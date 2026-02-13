# Secure File Drop

A secure file sharing application built with Turborepo, Next.js, and Fastify. Files are encrypted in the browser using AES-256-GCM before being uploaded to the server.

## Tech Stack

- **Monorepo**: Turborepo + npm/pnpm workspaces
- **Frontend**: Next.js 14 (TypeScript)
- **Backend**: Fastify (TypeScript)
- **Crypto**: AES-256-GCM encryption
- **Shared Package**: `@secure-file-drop/crypto`

**Note**: Works with both npm (included with Node.js) and pnpm. npm is recommended if you're having pnpm network issues.

## Getting Started

### Prerequisites

- Node.js 18+ (includes npm)
- pnpm 8+ (optional - npm works fine)

### Installation

1. Install dependencies:
```bash
# Using npm (recommended if pnpm has issues)
npm install

# OR using pnpm
pnpm install
```

2. Generate a master key (32 bytes = 64 hex characters):
```bash
# Generate a random 32-byte key in hex format
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. Create environment files:

**apps/api/.env:**
```
MASTER_KEY=your_generated_64_character_hex_key_here
PORT=3001
HOST=0.0.0.0
```

**apps/web/.env.local:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MASTER_KEY=your_generated_64_character_hex_key_here
```

**Note**: In production, the master key should NEVER be exposed to the frontend. This is a simplified implementation for demonstration purposes.

### Running the Application

Start all services in development mode:

```bash
# Using npm (recommended)
npm run dev

# OR using pnpm
pnpm dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## How It Works

1. **Upload Flow**:
   - User selects a file in the browser
   - File is encrypted using AES-256-GCM with a randomly generated DEK (Data Encryption Key)
   - DEK is wrapped (encrypted) using the master key
   - Encrypted file and wrapped DEK are uploaded to the backend
   - Backend stores the encrypted data and returns a file ID

2. **Download Flow**:
   - User enters a file ID
   - Backend returns the encrypted file record
   - Browser unwraps the DEK using the master key
   - Browser decrypts the file using the DEK
   - File is downloaded to the user's device

**Important**: The server never sees the plaintext file contents - encryption/decryption happens entirely in the browser.

## Project Structure

```
.
├── apps/
│   ├── api/          # Fastify backend
│   └── web/          # Next.js frontend
├── packages/
│   └── crypto/       # Shared encryption utilities
└── package.json      # Root workspace config
```

## API Endpoints

- `POST /files/upload` - Upload encrypted file
- `GET /files/:id` - Get encrypted file record
- `POST /files/:id/decrypt` - Decrypt and download file (server-side decryption endpoint - not used in current implementation)

## Security Notes

This is a learning project with intentional simplifications:

- ✅ Files are encrypted before upload
- ✅ Server never sees plaintext
- ✅ Uses industry-standard AES-256-GCM
- ⚠️ Master key is exposed to frontend (should use key exchange in production)
- ⚠️ In-memory storage (no persistence)
- ⚠️ No authentication/authorization
- ⚠️ No file size limits
- ⚠️ No rate limiting

## Deployment

### Vercel (Frontend)

The Next.js app can be deployed to Vercel. Make sure to set environment variables in Vercel dashboard.

### Backend

The Fastify backend can be deployed to any Node.js hosting service (Railway, Render, etc.).

## License

MIT
