import { NextRequest, NextResponse } from "next/server";
import { getNowFromHeaders, getPasteAndUpdateViews } from "@/lib/paste-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const now = getNowFromHeaders(req.headers);
    const paste = await getPasteAndUpdateViews(id, now);

    if (!paste) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json(paste);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
