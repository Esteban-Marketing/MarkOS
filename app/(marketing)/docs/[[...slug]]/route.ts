/**
 * app/(marketing)/docs/[[...slug]]/route.ts
 *
 * Companion route handler for docs pages that handles content negotiation:
 *
 * - GET /docs/<slug>.md         → 200 text/plain raw markdown
 * - GET /docs/<slug> with Accept: text/markdown → 200 text/plain raw markdown
 * - GET /docs/<slug>            → passes through to page.tsx (HTML rendering)
 *
 * This route runs BEFORE the page.tsx in Next.js resolution order,
 * allowing it to intercept markdown requests before the HTML renderer.
 */

import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { stripFrontMatter } = require('../../../../scripts/docs/build-md-mirror.cjs') as typeof import('../../../../scripts/docs/build-md-mirror.cjs');

const DOCS_DIR = path.resolve(process.cwd(), 'docs');

interface RouteContext {
  params: {
    slug?: string[];
  };
}

function resolveSlug(slug: string[] | undefined): { basePath: string; hasMdSuffix: boolean } {
  if (!slug || slug.length === 0) {
    return { basePath: path.join(DOCS_DIR, 'index'), hasMdSuffix: false };
  }
  const segments = [...slug];
  const last = segments[segments.length - 1];
  const hasMdSuffix = last.endsWith('.md');
  if (hasMdSuffix) {
    segments[segments.length - 1] = last.slice(0, -3);
  }
  return {
    basePath: path.join(DOCS_DIR, ...segments),
    hasMdSuffix,
  };
}

function readDoc(basePath: string): string | null {
  const candidates = [`${basePath}.md`, path.join(basePath, 'index.md')];
  for (const c of candidates) {
    if (fs.existsSync(c)) return fs.readFileSync(c, 'utf8');
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: RouteContext
): Promise<Response | undefined> {
  const { slug } = params;
  const acceptHeader = request.headers.get('accept') ?? '';
  const { basePath, hasMdSuffix } = resolveSlug(slug);

  const wantsMarkdown = hasMdSuffix || acceptHeader.includes('text/markdown');
  if (!wantsMarkdown) {
    // Let Next.js fall through to page.tsx
    return undefined;
  }

  const raw = readDoc(basePath);
  if (!raw) {
    return new Response('Not Found', { status: 404 });
  }

  const stripped = stripFrontMatter(raw);
  return new Response(stripped, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
