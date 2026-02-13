# Secure File Drop

A secure file sharing application built with Turborepo, Next.js, and Fastify. Files are encrypted in the browser using AES-256-GCM before being uploaded to the server.

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 14 (TypeScript)
- **Backend**: Fastify (TypeScript)
- **Crypto**: AES-256-GCM encryption
- **Shared Package**: `@secure-file-drop/crypto`

**Note**: This project uses pnpm for package management.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

1. Install dependencies:
```bash
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

**For local development with separate backend (apps/web/.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MASTER_KEY=your_generated_64_character_hex_key_here
```

**For Vercel deployment**, only set:
```
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_MASTER_KEY=your_generated_64_character_hex_key_here
```

**Note**: In production, the master key should NEVER be exposed to the frontend. This is a simplified implementation for demonstration purposes.

### Running the Application

Start all services in development mode:

```bash
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
│   ├── api/                    # Fastify backend (optional, for separate deployment)
│   └── web/                     # Next.js frontend with API routes
│       └── src/
│           ├── app/
│           │   ├── api/         # Next.js API routes (replaces Fastify backend)
│           │   │   └── files/   # File upload/download endpoints
│           │   └── page.tsx     # Main UI component
│           └── lib/
│               └── store.ts     # In-memory file storage
├── packages/
│   └── crypto/                  # Shared encryption utilities
└── package.json                 # Root workspace config
```

## API Endpoints

The API is available as Next.js API routes (when deployed on Vercel) or Fastify endpoints (when using the separate backend):

- `POST /api/files/upload` - Upload encrypted file
- `GET /api/files/:id` - Get encrypted file record
- `POST /api/files/:id/decrypt` - Decrypt and download file (server-side decryption endpoint - not used in current implementation)

**Note**: When deployed on Vercel, the API routes are automatically available at `/api/*`. For local development with the separate Fastify backend, use `http://localhost:3001/files/*`.

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

### Deploy to Vercel (Full Stack)

Both the frontend and backend can be deployed together on Vercel using Next.js API routes. The Fastify backend has been converted to Next.js API routes for seamless deployment.

#### Prerequisites

1. **Generate a production master key** (keep this secret!):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Save this key securely - you'll need it for Vercel environment variables.

2. **Install Vercel CLI** (optional, you can also use the web dashboard):
   ```bash
   pnpm add -g vercel
   ```

#### Deployment Steps

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy from the project root**:
   ```bash
   vercel
   ```
   
   Or connect your GitHub repository to [Vercel](https://vercel.com) for automatic deployments.

3. **Configure Vercel for Monorepo**:
   
   **Important**: You must set the Root Directory in Vercel Dashboard!
   
   After connecting your repository, go to Project Settings → General:
   - **Root Directory**: Set to `apps/web`
   - Vercel will automatically detect Next.js from `apps/web/package.json`
   - The `vercel.json` in `apps/web` will handle the monorepo build configuration
   
   **Vercel Configuration** (in Project Settings → General):
   
   **CRITICAL SETTINGS:**
   - **Root Directory**: `apps/web` (REQUIRED - must be exactly this, no trailing slash)
   - **Framework Preset**: **Next.js** (VERY IMPORTANT - select this from the dropdown if not auto-detected)
   - **Node.js Version**: 18.x or higher (check in Settings → General → Node.js Version)
   
   **Build Settings** (can leave empty if using vercel.json):
   - **Build Command**: Leave empty (vercel.json handles it) OR manually set: `cd ../.. && pnpm install && cd apps/web && pnpm run build`
   - **Output Directory**: Leave empty (defaults to `.next`)
   - **Install Command**: Leave empty (vercel.json handles it) OR manually set: `cd ../.. && pnpm install`
   
   **Package Manager**:
   - **Package Manager**: pnpm (set this in Settings → General → Package Manager)
   
   **Troubleshooting 500 Errors**:
   
   If you're getting 500 errors on API routes:
   1. **Check Build Logs**: Make sure the build completed successfully
   2. **Check Function Logs**: Go to Deployments → Your deployment → Functions tab → Click on the failing function → Check Logs
   3. **Test Simple Route**: Visit `/api/test` to verify API routes work at all
   4. **Verify Root Directory**: Must be exactly `apps/web` (not `apps/web/` or anything else)
   5. **Check Environment**: Make sure Node.js version is 18+ in Vercel settings
   6. **Rebuild**: Try triggering a new deployment after fixing configuration

4. **Set Environment Variables in Vercel Dashboard**:
   
   Go to your project settings → Environment Variables and add:
   - `NEXT_PUBLIC_MASTER_KEY`: Your generated 64-character hex master key (REQUIRED)
   - `NEXT_PUBLIC_API_URL`: **Leave this EMPTY** for Vercel deployment (it defaults to `/api`). Only set this if you're using a separate backend server.
   
   **Important**: 
   - For Vercel deployment with Next.js API routes, `NEXT_PUBLIC_API_URL` should be **empty** or not set at all
   - The frontend will automatically use `/api` as the default (relative path)
   - Setting it to `/api` is also fine, but not necessary
   - Only set `NEXT_PUBLIC_API_URL` if you're using a separate backend (e.g., `http://localhost:3001` for local dev)
   
   **Note**: The `NEXT_PUBLIC_` prefix makes these variables available to the browser. In production, consider implementing a key exchange protocol instead of exposing the master key.

5. **Redeploy**:
   
   After setting environment variables, trigger a new deployment:
   ```bash
   vercel --prod
   ```
   
   Or push to your main branch if you have GitHub integration enabled.

#### Testing Your Deployment

1. Visit your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
2. Try uploading a file - it should encrypt and store it
3. Copy the file ID and test downloading it

#### Important Notes

⚠️ **Storage Limitation**: The current implementation uses in-memory storage. In Vercel's serverless environment, each function invocation may have separate memory, so files may not persist across requests. For production:
- Add a database (Vercel Postgres, Supabase, etc.)
- Use object storage (AWS S3, Cloudflare R2, etc.)
- Implement persistent file storage

⚠️ **Security**: The master key is currently exposed to the frontend via `NEXT_PUBLIC_MASTER_KEY`. For production:
- Implement a key exchange protocol
- Use server-side key derivation
- Consider using Web Crypto API with proper key management

⚠️ **CORS**: CORS is automatically handled by Next.js API routes when deployed on the same domain.

#### Alternative: Separate Backend Deployment

If you prefer to keep the Fastify backend separate, you can:
- Deploy the Next.js frontend to Vercel
- Deploy the Fastify backend to Railway, Render, or Fly.io
- Set `NEXT_PUBLIC_API_URL` to your backend URL

## License

MIT
