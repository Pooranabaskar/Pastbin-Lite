# Pastebin-Lite

A small "Pastebin"-like application that allows users to create text pastes and share links to view them. Pastes can optionally include time-based expiry (TTL) and view-count limits.

## Project Description

Pastebin-Lite is a Next.js application that provides a simple interface for creating and sharing text pastes. Users can:
- Create a paste containing arbitrary text
- Receive a shareable URL for that paste
- Visit the URL to view the paste
- Set optional constraints (TTL and/or view limits) that make pastes unavailable when triggered

## How to Run Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pastbin1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   ```
   
   You can get these credentials by creating a free Redis database at [Upstash](https://upstash.com/).

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Persistence Layer

This application uses **Upstash Redis** as its persistence layer. Upstash Redis is a serverless Redis-compatible database that:
- Survives across serverless function invocations (essential for Vercel deployments)
- Provides built-in TTL (Time-To-Live) support for automatic expiration
- Supports atomic operations for view count management
- Works seamlessly with Next.js serverless functions

The choice of Upstash Redis ensures that pastes persist across requests and that the application works correctly in a serverless environment without relying on in-memory storage.

## Design Decisions

### Technology Stack
- **Next.js 16**: Modern React framework with App Router for server-side rendering and API routes
- **TypeScript**: Type safety and better developer experience
- **Upstash Redis**: Serverless Redis for persistent storage
- **Zod**: Runtime validation for API request bodies
- **nanoid**: URL-safe unique ID generation for paste identifiers
- **Tailwind CSS**: Utility-first CSS for modern, responsive UI

### Key Implementation Details

1. **Atomic View Counting**: View counts are managed using Redis's atomic `DECR` operation on a separate counter key (`paste:{id}:views`). This ensures that concurrent requests don't cause race conditions or negative view counts.

2. **Deterministic Time for Testing**: The application supports `TEST_MODE=1` environment variable and `x-test-now-ms` header for automated testing. When enabled, expiry checks use the header value instead of real system time.

3. **Dual Storage Strategy**: 
   - Main paste data stored in `paste:{id}` with full paste information
   - View counter stored separately in `paste:{id}:views` for atomic operations
   - Both keys share the same TTL when expiration is set

4. **Safe Content Rendering**: Paste content is rendered in a `<pre>` tag with proper escaping to prevent XSS attacks. No script execution is possible.

5. **Error Handling**: All API endpoints return proper JSON error responses with appropriate HTTP status codes (4xx for client errors, 404 for unavailable pastes).

6. **Constraint Logic**: Pastes become unavailable as soon as either constraint (TTL or view limit) is triggered, whichever comes first.

## API Endpoints

### Health Check
- `GET /api/healthz` - Returns `{ "ok": true }` if the application and database are accessible

### Create Paste
- `POST /api/pastes` - Creates a new paste
  - Request body: `{ "content": "string", "ttl_seconds": 60, "max_views": 5 }`
  - Response: `{ "id": "string", "url": "https://your-app.vercel.app/p/<id>" }`

### Fetch Paste (API)
- `GET /api/pastes/:id` - Retrieves paste data (counts as a view)
  - Response: `{ "content": "string", "remaining_views": 4, "expires_at": "2026-01-01T00:00:00.000Z" }`

### View Paste (HTML)
- `GET /p/:id` - Returns HTML page displaying the paste content

## Deployment

This application is designed to be deployed on Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in Vercel
3. Add environment variables (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`)
4. Deploy

The application will automatically build and deploy. No manual database migrations or shell access is required.

## Testing

The application supports deterministic time testing via the `TEST_MODE` environment variable:
- Set `TEST_MODE=1` in your environment
- Include the `x-test-now-ms` header in requests with a timestamp in milliseconds
- Expiry checks will use the header value instead of real time

Example:
```bash
curl -H "x-test-now-ms: 1735689600000" https://your-app.vercel.app/api/pastes/:id
```
