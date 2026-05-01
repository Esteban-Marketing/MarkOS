import { NextResponse } from 'next/server';

const otel = require('../../../../../../lib/markos/observability/otel.cjs');

otel.initOtel({ serviceName: 'markos' });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  return otel.withSpan('demo.legacy_route', { method: 'POST' }, async (span: any) => {
    span.setAttribute('status_code', 410);
    return NextResponse.json(
      {
        success: false,
        error: 'deprecated_demo_route',
        hint: 'Use /integrations/claude/demo/api/issue-token and /integrations/claude/demo/api/invoke.',
      },
      { status: 410 },
    );
  });
}
