import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getNowFromHeaders, getPasteAndUpdateViews } from "@/lib/paste-store";

function formatExpiry(value: string | null) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export const dynamic = "force-dynamic";

export default async function PastePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const headerList = await headers();
  const now = getNowFromHeaders(headerList);
  const paste = await getPasteAndUpdateViews(id, now);

  if (!paste) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Paste</h1>
            <a
              href="/"
              className="inline-flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create New Paste
            </a>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <div>Remaining views: {paste.remaining_views ?? "Unlimited"}</div>
            <div>Expires: {formatExpiry(paste.expires_at)}</div>
          </div>

          <pre className="w-full px-3 py-3 bg-gray-900 text-green-400 border border-gray-700 rounded-md shadow-inner font-mono text-sm whitespace-pre-wrap break-words">
            {paste.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
