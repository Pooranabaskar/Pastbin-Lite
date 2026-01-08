"use client";

import { useState } from "react";

export default function Home() {
  const [content, setContent] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: string; url: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const body: any = { content };
      if (ttlSeconds) {
        const ttl = parseInt(ttlSeconds);
        if (isNaN(ttl) || ttl < 1) {
          setError("TTL must be a positive integer");
          setLoading(false);
          return;
        }
        body.ttl_seconds = ttl;
      }
      if (maxViews) {
        const views = parseInt(maxViews);
        if (isNaN(views) || views < 1) {
          setError("Max views must be a positive integer");
          setLoading(false);
          return;
        }
        body.max_views = views;
      }

      const res = await fetch("/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create paste");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSuccess(data);
      setContent("");
      setTtlSeconds("");
      setMaxViews("");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Pastebin-Lite
          </h1>
          <p className="text-gray-600">
            Create and share text pastes with expiration constraints
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Paste Content *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={10}
                className="w-full px-3 py-2 bg-gray-900 text-green-400 border border-gray-700 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm placeholder-gray-500"
                placeholder="Enter your text here..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ttl"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  TTL (seconds, optional)
                </label>
                <input
                  type="number"
                  id="ttl"
                  value={ttlSeconds}
                  onChange={(e) => setTtlSeconds(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 bg-gray-900 text-green-400 border border-gray-700 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm placeholder-gray-500"
                  placeholder="e.g., 3600"
                />
              </div>

              <div>
                <label
                  htmlFor="maxViews"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Max Views (optional)
                </label>
                <input
                  type="number"
                  id="maxViews"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  min="1"
                  className="w-full px-3 py-2 bg-gray-900 text-green-400 border border-gray-700 rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm placeholder-gray-500"
                  placeholder="e.g., 5"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <p className="font-medium mb-2">Paste created successfully!</p>
                <p className="text-sm mb-2">ID: {success.id}</p>
                <a
                  href={success.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline break-all"
                >
                  {success.url}
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Creating..." : "Create Paste"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            How it works
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Enter your text content (required)</li>
            <li>• Optionally set a time-to-live (TTL) in seconds</li>
            <li>• Optionally set a maximum number of views</li>
            <li>• Share the generated URL with others</li>
            <li>
              • The paste becomes unavailable when constraints are triggered
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
