import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

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

export interface EncryptedFileEnvelope {
  file_nonce: string;
  file_ct: string;
  file_tag: string;
  dek_wrap_nonce: string;
  dek_wrapped: string;
  dek_wrap_tag: string;
  alg: 'AES-256-GCM';
  mk_version: 1;
}

/**
 * Encrypts a file using AES-256-GCM
 * Generates a random DEK, encrypts the file, then wraps the DEK with master key
 */
export async function encryptFileEnvelope(
  fileBuffer: Buffer,
  masterKey: string
): Promise<EncryptedFileEnvelope> {
  // Validate master key length (should be 32 bytes for AES-256)
  const masterKeyBuffer = Buffer.from(masterKey, 'hex');
  if (masterKeyBuffer.length !== 32) {
    throw new Error('Master key must be 32 bytes (64 hex characters)');
  }

  // Step 1: Generate random DEK (32 bytes)
  const dek = randomBytes(32);

  // Step 2: Encrypt file with DEK
  const fileNonce = randomBytes(12); // GCM requires 12-byte nonce
  const cipher = createCipheriv('aes-256-gcm', dek, fileNonce);
  
  const fileCiphertext = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final()
  ]);
  
  const fileTag = cipher.getAuthTag(); // 16 bytes for GCM

  // Step 3: Wrap DEK using master key
  const dekWrapNonce = randomBytes(12);
  const dekCipher = createCipheriv('aes-256-gcm', masterKeyBuffer, dekWrapNonce);
  
  const dekWrapped = Buffer.concat([
    dekCipher.update(dek),
    dekCipher.final()
  ]);
  
  const dekWrapTag = dekCipher.getAuthTag();

  return {
    file_nonce: fileNonce.toString('hex'),
    file_ct: fileCiphertext.toString('hex'),
    file_tag: fileTag.toString('hex'),
    dek_wrap_nonce: dekWrapNonce.toString('hex'),
    dek_wrapped: dekWrapped.toString('hex'),
    dek_wrap_tag: dekWrapTag.toString('hex'),
    alg: 'AES-256-GCM',
    mk_version: 1,
  };
}

/**
 * Decrypts a file from an encrypted envelope
 */
export async function decryptFileEnvelope(
  record: SecureFileRecord,
  masterKey: string
): Promise<Buffer> {
  // Validate master key
  const masterKeyBuffer = Buffer.from(masterKey, 'hex');
  if (masterKeyBuffer.length !== 32) {
    throw new Error('Master key must be 32 bytes (64 hex characters)');
  }

  // Basic validation
  const fileNonce = Buffer.from(record.file_nonce, 'hex');
  const fileTag = Buffer.from(record.file_tag, 'hex');
  const dekWrapNonce = Buffer.from(record.dek_wrap_nonce, 'hex');
  const dekWrapTag = Buffer.from(record.dek_wrap_tag, 'hex');

  if (fileNonce.length !== 12) {
    throw new Error('Invalid file nonce length');
  }
  if (fileTag.length !== 16) {
    throw new Error('Invalid file tag length');
  }
  if (dekWrapNonce.length !== 12) {
    throw new Error('Invalid DEK wrap nonce length');
  }
  if (dekWrapTag.length !== 16) {
    throw new Error('Invalid DEK wrap tag length');
  }

  try {
    // Step 1: Unwrap DEK
    const dekWrapped = Buffer.from(record.dek_wrapped, 'hex');
    const dekDecipher = createDecipheriv('aes-256-gcm', masterKeyBuffer, dekWrapNonce);
    dekDecipher.setAuthTag(dekWrapTag);
    
    const dek = Buffer.concat([
      dekDecipher.update(dekWrapped),
      dekDecipher.final()
    ]);

    // Step 2: Decrypt file with DEK
    const fileCiphertext = Buffer.from(record.file_ct, 'hex');
    const fileDecipher = createDecipheriv('aes-256-gcm', dek, fileNonce);
    fileDecipher.setAuthTag(fileTag);
    
    const fileBuffer = Buffer.concat([
      fileDecipher.update(fileCiphertext),
      fileDecipher.final()
    ]);

    return fileBuffer;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
