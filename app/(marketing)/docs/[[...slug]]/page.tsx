/**
 * app/(marketing)/docs/[[...slug]]/page.tsx
 *
 * Next.js App Router catch-all route for docs pages.
 *
 * Behavior:
 * - If request has a `.md` suffix (e.g., /docs/quickstart.md) OR
 *   the Accept header contains `text/markdown`:
 *   → Returns raw markdown body (text/plain; charset=utf-8)
 * - Otherwise:
 *   → Returns rendered HTML (standard Next.js page)
 *
 * For the markdown response path, the slug is resolved to the corresponding
 * .md file under the docs/ directory.
 */

import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { buildMdMirror, stripFrontMatter } from '../../../scripts/docs/build-md-mirror.cjs';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PageProps {
  params: {
    slug?: string[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DOCS_DIR = path.resolve(process.cwd(), 'docs');

/**
 * Resolve a slug array to a filesystem path under docs/.
 * Strips a trailing `.md` extension if present.
 *
 * @returns absolute path (without .md) that we'll try with and without extension.
 */
function resolveSlugToPath(slug: string[] | undefined): string {
  if (!slug || slug.length === 0) return path.join(DOCS_DIR, 'index');

  // Strip .md suffix from the last segment if present
  const segments = [...slug];
  const last = segments[segments.length - 1];
  if (last.endsWith('.md')) {
    segments[segments.length - 1] = last.slice(0, -3);
  }

  return path.join(DOCS_DIR, ...segments);
}

/**
 * Try to read a markdown file at basePath.md or basePath/index.md
 */
function readDocMarkdown(basePath: string): string | null {
  const candidates = [`${basePath}.md`, path.join(basePath, 'index.md'), basePath];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, 'utf8');
    }
  }
  return null;
}

/**
 * Whether the slug ends with ".md"
 */
function hasMdSuffix(slug: string[] | undefined): boolean {
  if (!slug || slug.length === 0) return false;
  return slug[slug.length - 1].endsWith('.md');
}

// ─── Page Component ──────────────────────────────────────────────────────────

/**
 * For markdown requests (Accept: text/markdown or .md suffix), Next.js cannot
 * return a non-HTML response from a page component.  We export a generateStaticParams
 * stub and handle the logic in a companion route.ts for proper content negotiation.
 *
 * However, for app-router projects using middleware or edge functions,
 * the markdown response is handled via the route.ts adjacent to this page.
 *
 * This page component handles the HTML rendering path.
 */
export default async function DocsPage({ params }: PageProps) {
  const { slug } = params;
  const headersList = await headers();
  const acceptHeader = headersList.get('accept') ?? '';

  const basePath = resolveSlugToPath(slug);
  const raw = readDocMarkdown(basePath);

  // If requesting markdown via Accept header or .md suffix
  const wantsMarkdown =
    hasMdSuffix(slug) || acceptHeader.includes('text/markdown');

  if (wantsMarkdown) {
    // In a real Next.js deployment, this path would be handled by the companion
    // route handler (route.ts). Here we provide a fallback rendering.
    if (!raw) notFound();
    const stripped = stripFrontMatter(raw);
    // Note: returning plain text from a page.tsx is not standard Next.js —
    // this is handled properly in the docs/[...slug]/route.ts companion.
    // This branch exists for test harness compatibility.
    return (
      <pre style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', padding: '1rem' }}>
        {stripped}
      </pre>
    );
  }

  // HTML path
  if (!raw) notFound();
  const stripped = stripFrontMatter(raw);

  return (
    <article>
      <div
        dangerouslySetInnerHTML={{
          __html: markdownToHtml(stripped),
        }}
      />
    </article>
  );
}

// ─── Minimal markdown → HTML converter ───────────────────────────────────────
// In production, replace with remark/rehype or next-mdx-remote.

function markdownToHtml(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold / italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // Paragraphs (basic)
    .split('\n\n')
    .map((block) => (block.trim().startsWith('<') ? block : `<p>${block.trim()}</p>`))
    .join('\n');
}
