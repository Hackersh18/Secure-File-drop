import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'API route is working',
    timestamp: new Date().toISOString()
  });
}
