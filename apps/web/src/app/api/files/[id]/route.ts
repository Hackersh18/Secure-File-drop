import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage
const fileStore: Map<string, any> = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Next.js 14 (sync params) and Next.js 15 (async params)
    const id = params instanceof Promise ? (await params).id : params.id;
    const record = fileStore.get(id);

    if (!record) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
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
  } catch (error: any) {
    console.error('Get file error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
