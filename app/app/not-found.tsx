export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Paste Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          This paste is unavailable. It may have expired or reached its view
          limit.
        </p>
        <a
          href="/"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Create New Paste
        </a>

      </div>
    </div>
  );
}
