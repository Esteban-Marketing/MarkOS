import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const demoSandbox = require('../../../../../../../lib/markos/marketing/demo-sandbox.cjs');
const otel = require('../../../../../../../lib/markos/observability/otel.cjs');

otel.initOtel({ serviceName: 'markos' });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function createServiceRoleClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

function json(span: any, payload: unknown, status: number) {
  span.setAttribute('status_code', status);
  return NextResponse.json(payload, { status });
}

export async function POST(req: NextRequest) {
  return otel.withSpan('demo.issue_token', { method: 'POST' }, async (span: any) => {
    const body = await req.json().catch(() => ({}));
    const botidToken = body?.botid_token;

    if (!botidToken || typeof botidToken !== 'string') {
      return json(span, { error: 'missing_botid_token' }, 400);
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;
    const ua = req.headers.get('user-agent') || null;

    try {
      const result = await demoSandbox.issueDemoSessionToken({
        botid_token: botidToken,
        ip,
        ua,
        supabaseClient: createServiceRoleClient(),
      });

      if (!result.ok) {
        span.setAttribute('reason', result.reason);
        return json(span, { error: result.reason, detail: result.detail || null }, 401);
      }

      span.setAttribute('tenant_id', demoSandbox.DEMO_SYNTHETIC_TENANT_ID);
      return json(
        span,
        {
          demo_session_token: result.demo_session_token,
          expires_at: result.expires_at,
          cost_cap_cents: result.cost_cap_cents,
          allowed_tools: result.allowed_tools,
        },
        200,
      );
    } catch (error: any) {
      span.setAttribute('error', true);
      return json(
        span,
        {
          error: 'token_issue_failed',
          detail: error?.message || String(error),
        },
        500,
      );
    }
  });
}
