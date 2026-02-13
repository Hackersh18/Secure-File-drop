import Fastify from 'fastify';
import cors from '@fastify/cors';
import { SecureFileRecord, decryptFileEnvelope } from '@secure-file-drop/crypto';
import { randomBytes } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
// Try multiple paths to work with different execution contexts
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config(); // Fallback to default .env in current directory

const fastify = Fastify({
  logger: true,
});

// Register CORS
fastify.register(cors, {
  origin: true,
});

// In-memory storage (simple Map)
const fileStore = new Map<string, SecureFileRecord>();

// Generate file ID
function generateFileId(): string {
  return randomBytes(16).toString('hex');
}

// POST /files/upload
fastify.post('/files/upload', async (request, reply) => {
  try {
    const body = request.body as any;

    // Basic validation
    if (!body.filename || !body.contentType || !body.size) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    if (!body.file_nonce || !body.file_ct || !body.file_tag) {
      return reply.status(400).send({ error: 'Missing encrypted file data' });
    }

    if (!body.dek_wrap_nonce || !body.dek_wrapped || !body.dek_wrap_tag) {
      return reply.status(400).send({ error: 'Missing wrapped DEK data' });
    }

    const fileId = generateFileId();

    const record: SecureFileRecord = {
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

    fileStore.set(fileId, record);

    return reply.status(201).send({
      id: fileId,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// GET /files/:id
fastify.get('/files/:id', async (request, reply) => {
  try {
    const params = request.params as { id: string };
    const record = fileStore.get(params.id);

    if (!record) {
      return reply.status(404).send({ error: 'File not found' });
    }

    // Return encrypted record only (server never sees plaintext)
    return reply.send({
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
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});

// POST /files/:id/decrypt
fastify.post('/files/:id/decrypt', async (request, reply) => {
  try {
    const params = request.params as { id: string };
    const record = fileStore.get(params.id);

    if (!record) {
      return reply.status(404).send({ error: 'File not found' });
    }

    const masterKey = process.env.MASTER_KEY;
    if (!masterKey) {
      return reply.status(500).send({ error: 'Server configuration error' });
    }

    // Decrypt file
    const decryptedBuffer = await decryptFileEnvelope(record, masterKey);

    reply.type(record.contentType);
    reply.header('Content-Disposition', `attachment; filename="${record.filename}"`);
    return reply.send(decryptedBuffer);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ 
      error: error instanceof Error ? error.message : 'Decryption failed' 
    });
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    if (!process.env.MASTER_KEY) {
      fastify.log.error('MASTER_KEY environment variable is required');
      process.exit(1);
    }

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
