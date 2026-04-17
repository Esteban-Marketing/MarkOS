/**
 * app/(marketing)/integrations/claude/demo/api/route.ts
 *
 * Thin proxy for the demo sandbox. Accepts { tool, arguments } from the
 * client page and forwards to the local MCP session endpoint as a
 * tools/call JSON-RPC 2.0 envelope. Keeps CORS and rate-limit logic
 * server-side so the client page stays static.
 *
 * Runtime: Node (Fluid Compute). No streaming yet; 200-08.1 may upgrade
 * to SSE once the playground shows multi-turn conversations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { invokeTool } from '../../../../../../lib/markos/mcp/server.cjs';

const ALLOWED_TOOLS = new Set([
  'draft_message',
  'run_neuro_audit',
  'list_pain_points',
  'explain_literacy',
]);

const RATE_LIMIT_PER_MINUTE = 20;
const rateBuckets = new Map<string, { count: number; windowStart: number }>();

function rateCheck(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > 60_000) {
    rateBuckets.set(ip, { count: 1, windowStart: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT_PER_MINUTE;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  if (!rateCheck(ip)) {
    return NextResponse.json(
      { success: false, error: 'RATE_LIMITED', hint: 'demo sandbox capped at 20 req/min per ip' },
      { status: 429 },
    );
  }

  let body: { tool?: string; arguments?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const tool = body?.tool;
  if (!tool || typeof tool !== 'string') {
    return NextResponse.json({ success: false, error: 'TOOL_REQUIRED' }, { status: 400 });
  }
  if (!ALLOWED_TOOLS.has(tool)) {
    return NextResponse.json(
      { success: false, error: 'TOOL_NOT_PERMITTED', hint: `demo sandbox only exposes: ${[...ALLOWED_TOOLS].join(', ')}` },
      { status: 403 },
    );
  }

  try {
    const raw = await invokeTool(tool, body.arguments || {});
    const textBlock = Array.isArray(raw?.content) ? raw.content[0] : null;
    let parsed: unknown = null;
    if (textBlock && typeof textBlock.text === 'string') {
      try {
        parsed = JSON.parse(textBlock.text);
      } catch {
        parsed = { text: textBlock.text };
      }
    }
    return NextResponse.json({ success: true, tool, result: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /unknown tool/i.test(message) ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export const dynamic = 'force-dynamic';
