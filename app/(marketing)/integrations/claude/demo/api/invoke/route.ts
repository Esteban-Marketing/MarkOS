import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const demoSandbox = require('../../../../../../../lib/markos/marketing/demo-sandbox.cjs');
const otel = require('../../../../../../../lib/markos/observability/otel.cjs');
const { estimateToolCost } = require('../../../../../../../lib/markos/mcp/cost-table.cjs');
const invokeDraftMessage = require('../../../../../../../lib/markos/mcp/tools/marketing/draft-message.cjs');
const auditClaim = require('../../../../../../../lib/markos/mcp/tools/marketing/audit-claim.cjs');

otel.initOtel({ serviceName: 'markos' });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

async function loadLlm() {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const Ctor = Anthropic.default || Anthropic;
    return new Ctor({ apiKey: process.env.ANTHROPIC_API_KEY });
  } catch {
    return null;
  }
}

function json(span: any, payload: unknown, status: number) {
  span.setAttribute('status_code', status);
  return NextResponse.json(payload, { status });
}

function parseToolResult(raw: any) {
  const textBlock = Array.isArray(raw?.content) ? raw.content[0] : null;
  if (!textBlock || typeof textBlock.text !== 'string') return raw;
  try {
    return JSON.parse(textBlock.text);
  } catch {
    return { text: textBlock.text };
  }
}

export async function POST(req: NextRequest) {
  return otel.withSpan('demo.invoke', { method: 'POST' }, async (span: any) => {
    const body = await req.json().catch(() => ({}));
    const demoSessionToken = body?.demo_session_token;
    const tool_name = body?.tool_name;
    const tool_input = body?.tool_input || {};

    if (!demoSessionToken || typeof demoSessionToken !== 'string' || !tool_name || typeof tool_name !== 'string') {
      return json(span, { error: 'missing_fields' }, 400);
    }

    const verify = demoSandbox.verifyDemoSessionToken(demoSessionToken);
    if (!verify.ok) {
      span.setAttribute('reason', verify.reason);
      return json(span, { error: verify.reason }, 401);
    }

    const allowed = demoSandbox.assertToolAllowed(verify.claims, tool_name);
    if (!allowed.ok) {
      span.setAttribute('reason', allowed.reason);
      return json(span, { error: allowed.reason, detail: allowed.detail || tool_name }, 403);
    }

    span.setAttribute('tenant_id', verify.claims.synthetic_tenant_id);
    span.setAttribute('mcp_session_id', verify.claims.sub);
    span.setAttribute('tool_name', tool_name);

    const estimatedCost = estimateToolCost(tool_name);
    const supabase = createServiceRoleClient();
    const cost = await demoSandbox.recordDemoCost(
      supabase,
      verify.claims.sub,
      verify.claims.synthetic_tenant_id,
      estimatedCost,
      tool_name,
    );

    if (!cost.ok) {
      span.setAttribute('reason', cost.reason);
      span.setAttribute('cost_cents', estimatedCost);
      if (cost.reason === 'cost_cap_exceeded') {
        return json(span, { error: 'cost_cap_exceeded', total_cents: cost.total_cents }, 402);
      }
      return json(span, { error: cost.reason, detail: cost.detail || null }, 500);
    }

    const llm = await loadLlm();

    try {
      let rawResult;
      if (tool_name === 'draft_message') {
        rawResult = await invokeDraftMessage({
          tool_input,
          tenant_id: verify.claims.synthetic_tenant_id,
          mcp_session_id: verify.claims.sub,
        });
      } else if (tool_name === 'audit_claim') {
        rawResult = await auditClaim.handler({
          args: tool_input,
          session: {
            id: verify.claims.sub,
            tenant_id: verify.claims.synthetic_tenant_id,
            org_id: demoSandbox.DEMO_SYNTHETIC_ORG_ID,
            plan_tier: 'free',
          },
          supabase,
          deps: { llm },
        });
      } else {
        return json(span, { error: 'tool_not_allowed', detail: tool_name }, 403);
      }

      const result = parseToolResult(rawResult);
      span.setAttribute('cost_cents', estimatedCost);
      return json(
        span,
        {
          ok: true,
          tool_name,
          result,
          cost_cents: estimatedCost,
          total_cents: cost.total_cents,
          expires_at: new Date(verify.claims.exp * 1000).toISOString(),
        },
        200,
      );
    } catch (error: any) {
      span.setAttribute('error', true);
      return json(
        span,
        {
          error: 'tool_dispatch_failed',
          detail: error?.message || String(error),
        },
        500,
      );
    }
  });
}
