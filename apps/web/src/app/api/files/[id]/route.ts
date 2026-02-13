import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = getFile(params.id);

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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
