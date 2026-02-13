import { NextRequest, NextResponse } from 'next/server';

const fileStore: Map<string, any> = new Map();

function generateFileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!body?.filename || !body?.contentType || !body?.size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!body?.file_nonce || !body?.file_ct || !body?.file_tag) {
      return NextResponse.json(
        { error: 'Missing encrypted file data' },
        { status: 400 }
      );
    }

    if (!body?.dek_wrap_nonce || !body?.dek_wrapped || !body?.dek_wrap_tag) {
      return NextResponse.json(
        { error: 'Missing wrapped DEK data' },
        { status: 400 }
      );
    }

    const fileId = generateFileId();

    const record = {
      id: fileId,
      filename: body.filename,
      contentType: body.contentType,
      size: body.size,
      createdAt: new Date().toISOString(),
      file_nonce: body.file_nonce,
      file_ct: body.file_ct,
      file_tag: body.file_tag,
      dek_wrap_nonce: body.dek_wrap_nonce,
      dek_wrapped: body.dek_wrapped,
      dek_wrap_tag: body.dek_wrap_tag,
      alg: 'AES-256-GCM',
      mk_version: 1,
    };

    fileStore.set(record.id, record);

    return NextResponse.json({
      id: fileId,
      message: 'File uploaded successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
