import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

// Simple in-memory storage
const fileStore: Map<string, any> = new Map();

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

    // Basic validation
    if (!body.filename || !body.contentType || !body.size) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!body.file_nonce || !body.file_ct || !body.file_tag) {
      return NextResponse.json(
        { error: 'Missing encrypted file data' },
        { status: 400 }
      );
    }

    if (!body.dek_wrap_nonce || !body.dek_wrapped || !body.dek_wrap_tag) {
      return NextResponse.json(
        { error: 'Missing wrapped DEK data' },
        { status: 400 }
      );
    }

    // Generate file ID
    const fileId = randomBytes(16).toString('hex');

    const record = {
      id: fileId,
      filename: String(body.filename),
      contentType: String(body.contentType),
      size: Number(body.size),
      createdAt: new Date().toISOString(),
      file_nonce: String(body.file_nonce),
      file_ct: String(body.file_ct),
      file_tag: String(body.file_tag),
      dek_wrap_nonce: String(body.dek_wrap_nonce),
      dek_wrapped: String(body.dek_wrapped),
      dek_wrap_tag: String(body.dek_wrap_tag),
      alg: 'AES-256-GCM',
      mk_version: 1,
    };

    fileStore.set(record.id, record);

    return NextResponse.json(
      {
        id: fileId,
        message: 'File uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
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
