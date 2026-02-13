// In-memory file storage
// Note: In Vercel's serverless environment, this will be reset on each cold start
// For production, consider using a database or external storage
import { SecureFileRecord } from '@secure-file-drop/crypto';
import { randomBytes } from 'crypto';

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
