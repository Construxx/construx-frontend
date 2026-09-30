import { NextRequest, NextResponse } from 'next/server';
import { handleBoQImport } from '../../../src/lib/ai/serverHandlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
    const body = await req.json();
    const result = await handleBoQImport(body, ip);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
