import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const redis = Redis.fromEnv();

// Validation schema for the request body
const pasteSchema = z.object({
  content: z.string().min(1),
  ttl_seconds: z.number().int().min(1).optional(),
  max_views: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = pasteSchema.parse(body);
    const id = nanoid(10);
    
    // Calculate expiration if TTL is provided
    const expiresAt = validatedData.ttl_seconds
      ? new Date(Date.now() + validatedData.ttl_seconds * 1000).toISOString()
      : null;
    const maxViews =
      validatedData.max_views && validatedData.max_views > 0
        ? validatedData.max_views
        : null;

    const pasteData = {
      content: validatedData.content,
      remaining_views: maxViews,
      max_views: maxViews,
      expires_at: expiresAt,
    };

    // Store in Redis with TTL if provided
    if (validatedData.ttl_seconds) {
      // Set with expiration in seconds
      await redis.set(`paste:${id}`, pasteData, { ex: validatedData.ttl_seconds });
    } else {
      await redis.set(`paste:${id}`, pasteData);
    }

    // Initialize view counter if max_views is set
    if (maxViews !== null) {
      if (validatedData.ttl_seconds) {
        await redis.set(`paste:${id}:views`, maxViews, {
          ex: validatedData.ttl_seconds,
        });
      } else {
        await redis.set(`paste:${id}:views`, maxViews);
      }
    }

    // Get the origin from request headers or environment
    // Vercel provides these headers in production
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https') ? 'https' : 'http');
    const origin = host ? `${protocol}://${host}` : new URL(req.url).origin;

    
    // Return the required JSON response
    return NextResponse.json({
      id,
      url: `${origin}/p/${id}`
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input'
      }, { status: 400 });
    }
    // Return 4xx on invalid input
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
}
