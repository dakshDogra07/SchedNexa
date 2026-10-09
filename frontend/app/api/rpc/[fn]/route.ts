import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@backend/index';
import type { ApiFunctionName } from '@shared/types';

/**
 * LOCKED generic dispatcher.
 * Dispatches POST /api/rpc/[fn] to backend/index.ts handlers registry.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { fn: string } }
) {
  const fn = params.fn as ApiFunctionName;
  const handler = handlers[fn];

  if (!handler) {
    return NextResponse.json(
      { ok: false, error: `Unknown RPC function: ${fn}` },
      { status: 404 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await handler(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
