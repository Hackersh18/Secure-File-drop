import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '../../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Next.js 14 (sync params) and Next.js 15 (async params)
    const resolvedParams = params instanceof Promise ? await params : params;
    const record = getFile(resolvedParams.id);

    if (!record) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Return encrypted record only (server never sees plaintext)
    return NextResponse.json({
      id: record.id,
      filename: record.filename,
      contentType: record.contentType,
      size: record.size,
      createdAt: record.createdAt,
      file_nonce: record.file_nonce,
      file_ct: record.file_ct,
      file_tag: record.file_tag,
      dek_wrap_nonce: record.dek_wrap_nonce,
      dek_wrapped: record.dek_wrapped,
      dek_wrap_tag: record.dek_wrap_tag,
      alg: record.alg,
      mk_version: record.mk_version,
    });
  } catch (error) {
    console.error('Get file error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
