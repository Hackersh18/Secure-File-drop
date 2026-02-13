'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [fileId, setFileId] = useState<string>('');
  const [downloadFileId, setDownloadFileId] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  async function encryptFile(file: File, masterKey: string): Promise<{
    file_nonce: string;
    file_ct: string;
    file_tag: string;
    dek_wrap_nonce: string;
    dek_wrapped: string;
    dek_wrap_tag: string;
  }> {
    if (!masterKey || masterKey.trim().length !== 64) {
      throw new Error('Master key must be exactly 64 hex characters (32 bytes)');
    }

    const dek = crypto.getRandomValues(new Uint8Array(32));
    const fileBuffer = await file.arrayBuffer();
    const fileNonce = crypto.getRandomValues(new Uint8Array(12));
    
    const dekKey = await crypto.subtle.importKey(
      'raw',
      dek,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encryptedFile = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: fileNonce,
        tagLength: 128,
      },
      dekKey,
      fileBuffer
    );

    const encryptedArray = new Uint8Array(encryptedFile);
    const fileTag = encryptedArray.slice(-16);
    const fileCiphertext = encryptedArray.slice(0, -16);

    const masterKeyBuffer = hexToBuffer(masterKey);
    if (masterKeyBuffer.length !== 32) {
      throw new Error(`Master key must be 32 bytes, got ${masterKeyBuffer.length} bytes`);
    }
    
    const masterKeyCopy = new Uint8Array(masterKeyBuffer);
    const masterKeyArrayBuffer = masterKeyCopy.buffer as ArrayBuffer;
    
    const masterKeyCrypto = await crypto.subtle.importKey(
      'raw',
      masterKeyArrayBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const dekWrapNonce = crypto.getRandomValues(new Uint8Array(12));
    const wrappedDek = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: dekWrapNonce,
        tagLength: 128,
      },
      masterKeyCrypto,
      dek
    );

    const wrappedArray = new Uint8Array(wrappedDek);
    const dekWrapTag = wrappedArray.slice(-16);
    const dekWrapped = wrappedArray.slice(0, -16);

    return {
      file_nonce: bufferToHex(fileNonce),
      file_ct: bufferToHex(fileCiphertext),
      file_tag: bufferToHex(fileTag),
      dek_wrap_nonce: bufferToHex(dekWrapNonce),
      dek_wrapped: bufferToHex(dekWrapped),
      dek_wrap_tag: bufferToHex(dekWrapTag),
    };
  }

  async function decryptFile(
    encryptedData: {
      file_nonce: string;
      file_ct: string;
      file_tag: string;
      dek_wrap_nonce: string;
      dek_wrapped: string;
      dek_wrap_tag: string;
    },
    masterKey: string
  ): Promise<ArrayBuffer> {
    if (!masterKey || masterKey.trim().length !== 64) {
      throw new Error('Master key must be exactly 64 hex characters (32 bytes)');
    }

    const masterKeyBuffer = hexToBuffer(masterKey);
    if (masterKeyBuffer.length !== 32) {
      throw new Error(`Master key must be 32 bytes, got ${masterKeyBuffer.length} bytes`);
    }
    
    const masterKeyCopy = new Uint8Array(masterKeyBuffer);
    const masterKeyArrayBuffer = masterKeyCopy.buffer as ArrayBuffer;
    
    const masterKeyCrypto = await crypto.subtle.importKey(
      'raw',
      masterKeyArrayBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const dekWrapNonce = hexToBuffer(encryptedData.dek_wrap_nonce);
    const dekWrapped = hexToBuffer(encryptedData.dek_wrapped);
    const dekWrapTag = hexToBuffer(encryptedData.dek_wrap_tag);

    const wrappedDekWithTag = new Uint8Array(dekWrapped.length + dekWrapTag.length);
    wrappedDekWithTag.set(dekWrapped);
    wrappedDekWithTag.set(dekWrapTag, dekWrapped.length);

    const dekWrapNonceBuffer = new Uint8Array(dekWrapNonce);

    const dekBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: dekWrapNonceBuffer,
        tagLength: 128,
      },
      masterKeyCrypto,
      wrappedDekWithTag
    );

    const dekKey = await crypto.subtle.importKey(
      'raw',
      dekBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const fileNonce = hexToBuffer(encryptedData.file_nonce);
    const fileCiphertext = hexToBuffer(encryptedData.file_ct);
    const fileTag = hexToBuffer(encryptedData.file_tag);

    const fileCiphertextWithTag = new Uint8Array(fileCiphertext.length + fileTag.length);
    fileCiphertextWithTag.set(fileCiphertext);
    fileCiphertextWithTag.set(fileTag, fileCiphertext.length);

    const fileNonceBuffer = new Uint8Array(fileNonce);

    const decryptedFile = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fileNonceBuffer,
        tagLength: 128,
      },
      dekKey,
      fileCiphertextWithTag
    );

    return decryptedFile;
  }

  function hexToBuffer(hex: string): Uint8Array {
    hex = hex.trim();
    
    if (hex.length % 2 !== 0) {
      throw new Error('Hex string must have even length');
    }
    
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substr(i, 2), 16);
      if (isNaN(byte)) {
        throw new Error(`Invalid hex character at position ${i}`);
      }
      bytes[i / 2] = byte;
    }
    return bytes;
  }

  function bufferToHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: 'info', message: 'Encrypting file...' });

    try {
      const masterKey = process.env.NEXT_PUBLIC_MASTER_KEY || '';
      if (!masterKey) {
        throw new Error('Master key not configured. Please set NEXT_PUBLIC_MASTER_KEY environment variable.');
      }
      
      if (masterKey.trim().length !== 64) {
        throw new Error(`Master key must be exactly 64 hex characters (got ${masterKey.trim().length}). Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
      }

      const encryptedData = await encryptFile(selectedFile, masterKey);
      const response = await fetch(`${API_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
          size: selectedFile.size,
          ...encryptedData,
          alg: 'AES-256-GCM',
          mk_version: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setFileId(data.id);
      setUploadStatus({ type: 'success', message: 'File encrypted and uploaded successfully!' });
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload() {
    if (!downloadFileId.trim()) {
      setDownloadStatus({ type: 'error', message: 'Please enter a file ID' });
      return;
    }

    setIsDownloading(true);
    setDownloadStatus({ type: 'info', message: 'Fetching file...' });

    try {
      // Get file metadata
      const response = await fetch(`${API_URL}/files/${downloadFileId}`);
      if (!response.ok) {
        throw new Error('File not found');
      }

      const fileData = await response.json();
      setDownloadStatus({ type: 'info', message: 'Decrypting file...' });

      const masterKey = process.env.NEXT_PUBLIC_MASTER_KEY || '';
      if (!masterKey) {
        throw new Error('Master key not configured. Please set NEXT_PUBLIC_MASTER_KEY environment variable.');
      }
      
      if (masterKey.trim().length !== 64) {
        throw new Error(`Master key must be exactly 64 hex characters (got ${masterKey.trim().length}). Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
      }

      const decryptedBuffer = await decryptFile(
        {
          file_nonce: fileData.file_nonce,
          file_ct: fileData.file_ct,
          file_tag: fileData.file_tag,
          dek_wrap_nonce: fileData.dek_wrap_nonce,
          dek_wrapped: fileData.dek_wrapped,
          dek_wrap_tag: fileData.dek_wrap_tag,
        },
        masterKey
      );

      const blob = new Blob([decryptedBuffer], { type: fileData.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadStatus({ type: 'success', message: 'File decrypted and downloaded!' });
    } catch (error) {
      setDownloadStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Download failed',
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="container">
      <h1>Secure File Drop</h1>

      <div className="section">
        <h2>Upload & Encrypt</h2>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setSelectedFile(file || null);
            setUploadStatus(null);
            setFileId('');
          }}
        />
        <button onClick={handleUpload} disabled={isUploading || !selectedFile}>
          {isUploading ? 'Encrypting & Uploading...' : 'Encrypt & Upload'}
        </button>
        {uploadStatus && (
          <div className={`status ${uploadStatus.type}`}>
            {uploadStatus.message}
          </div>
        )}
        {fileId && (
          <div className="file-id">
            <strong>File ID:</strong> {fileId}
          </div>
        )}
      </div>

      <div className="section">
        <h2>Download & Decrypt</h2>
        <input
          type="text"
          placeholder="Enter file ID"
          value={downloadFileId}
          onChange={(e) => {
            setDownloadFileId(e.target.value);
            setDownloadStatus(null);
          }}
        />
        <button onClick={handleDownload} disabled={isDownloading || !downloadFileId.trim()}>
          {isDownloading ? 'Fetching & Decrypting...' : 'Fetch & Decrypt'}
        </button>
        {downloadStatus && (
          <div className={`status ${downloadStatus.type}`}>
            {downloadStatus.message}
          </div>
        )}
      </div>
    </div>
  );
}
