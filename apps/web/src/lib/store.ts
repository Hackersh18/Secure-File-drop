// In-memory file storage
// Note: In Vercel's serverless environment, this will be reset on each cold start
// For production, consider using a database or external storage
import { randomBytes } from 'crypto';

// Define the type locally to avoid workspace package resolution issues in serverless
export interface SecureFileRecord {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  file_nonce: string;
  file_ct: string;
  file_tag: string;
  dek_wrap_nonce: string;
  dek_wrapped: string;
  dek_wrap_tag: string;
  alg: 'AES-256-GCM';
  mk_version: 1;
}

// Using a Map for in-memory storage
// In a serverless environment, this is per-instance, so files may not persist across requests
const fileStore = new Map<string, SecureFileRecord>();

export function getFile(id: string): SecureFileRecord | undefined {
  return fileStore.get(id);
}

export function saveFile(record: SecureFileRecord): void {
  fileStore.set(record.id, record);
}

export function generateFileId(): string {
  // Generate a random 16-byte ID (32 hex characters)
  // This function is only used server-side in API routes
  return randomBytes(16).toString('hex');
}
