/**
 * app/docs/llms-full.txt/route.ts
 *
 * Next.js App Router route handler: GET /docs/llms-full.txt
 *
 * Returns a concatenated plain-text (text/plain) markdown document of all
 * MarkOS documentation pages — suitable for LLM ingestion.
 *
 * Caching: cached for 1 hour via Cache-Control (s-maxage=3600, stale-while-revalidate=86400).
 * In a Next.js 15+ environment with `use cache` / `cacheLife`, upgrade to:
 *   export const dynamic = 'force-static';
 *   import { unstable_cacheLife as cacheLife } from 'next/cache';
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildMdMirror } = require('../../../scripts/docs/build-md-mirror.cjs') as typeof import('../../../scripts/docs/build-md-mirror.cjs');

export const runtime = 'nodejs';

/**
 * Cache for 1 hour at the CDN layer.
 * Stale-while-revalidate allows serving stale content for 24h while refreshing.
 */
const CACHE_MAX_AGE = 3600;
const CACHE_SWR = 86400;

export async function GET(): Promise<Response> {
  try {
    const markdown: string = buildMdMirror();

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${CACHE_SWR}`,
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`# Error generating docs\n\n${message}\n`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
