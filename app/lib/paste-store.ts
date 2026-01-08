import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export interface PasteData {
  content: string;
  remaining_views: number | null;
  max_views?: number | null;
  expires_at: string | null;
}

export type PasteResult = Pick<
  PasteData,
  "content" | "remaining_views" | "expires_at"
>;

type HeaderLookup = { get(name: string): string | null };
type ViewState = Map<string, number>;

function getViewState(): ViewState {
  const globalForViews = globalThis as typeof globalThis & {
    __pasteViewState?: ViewState;
  };

  if (!globalForViews.__pasteViewState) {
    globalForViews.__pasteViewState = new Map();
  }

  return globalForViews.__pasteViewState;
}

export function getNowFromHeaders(headers?: HeaderLookup): number {
  if (
    process.env.TEST_MODE !== "1" ||
    !headers ||
    typeof headers.get !== "function"
  ) {
    return Date.now();
  }

  const testNow = headers.get("x-test-now-ms");
  if (!testNow) {
    return Date.now();
  }

  const parsed = parseInt(testNow, 10);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function getRemainingSeconds(
  expiresAt: string | null,
  nowMs: number
): number | null {
  if (!expiresAt) {
    return null;
  }

  const expiryMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryMs)) {
    return 0;
  }

  const remainingMs = expiryMs - nowMs;
  if (remainingMs <= 0) {
    return 0;
  }

  return Math.ceil(remainingMs / 1000);
}

async function persistPaste(
  id: string,
  paste: PasteData,
  ttlSeconds: number | null
) {
  if (ttlSeconds && ttlSeconds > 0) {
    await redis.set(`paste:${id}`, paste, { ex: ttlSeconds });
    return;
  }

  await redis.set(`paste:${id}`, paste);
}

export async function getPasteAndUpdateViews(
  id: string,
  nowMs: number
): Promise<PasteResult | null> {
  const paste = await redis.get<PasteData>(`paste:${id}`);

  if (!paste) {
    return null;
  }

  const remainingSeconds = getRemainingSeconds(paste.expires_at, nowMs);
  if (remainingSeconds === 0) {
    await redis.del(`paste:${id}`);
    await redis.del(`paste:${id}:views`);
    if (process.env.RESET_VIEW_LIMIT_ON_RESTART === "1") {
      getViewState().delete(id);
    }
    return null;
  }

  let updatedRemaining = paste.remaining_views;

  if (process.env.RESET_VIEW_LIMIT_ON_RESTART === "1") {
    const maxViews = paste.max_views ?? paste.remaining_views;
    if (maxViews !== null) {
      const viewState = getViewState();
      const current = viewState.get(id);
      const nextRemaining = (current ?? maxViews) - 1;
      viewState.set(id, nextRemaining);

      if (nextRemaining < 0) {
        return null;
      }

      updatedRemaining = nextRemaining;
    }
  } else if (paste.remaining_views !== null) {
    const remaining = await redis.decr(`paste:${id}:views`);

    if (remaining < 0) {
      await redis.del(`paste:${id}:views`);
      await persistPaste(
        id,
        {
          ...paste,
          remaining_views: 0,
        },
        remainingSeconds
      );
      return null;
    }

    updatedRemaining = remaining;
    await persistPaste(
      id,
      {
        ...paste,
        remaining_views: updatedRemaining,
      },
      remainingSeconds
    );
  }

  return {
    content: paste.content,
    remaining_views: updatedRemaining,
    expires_at: paste.expires_at,
  };
}
