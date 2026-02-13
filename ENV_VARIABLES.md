# Environment Variables Guide

## For Vercel Deployment

### Required Environment Variables

1. **`NEXT_PUBLIC_MASTER_KEY`** (REQUIRED)
   - **Type**: String
   - **Value**: A 64-character hexadecimal string (32 bytes)
   - **How to generate**:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`
   - **Where to set**: Vercel Dashboard → Project Settings → Environment Variables
   - **Important**: This key is exposed to the browser (due to `NEXT_PUBLIC_` prefix). In production, consider implementing a key exchange protocol.

### Optional Environment Variables

2. **`NEXT_PUBLIC_API_URL`** (OPTIONAL - Leave empty for Vercel)
   - **Type**: String
   - **For Vercel Deployment**: Leave this **EMPTY** or don't set it at all
     - The app will default to `/api` (relative path)
     - This works perfectly with Next.js API routes on Vercel
   - **For Local Development with Separate Backend**: Set to `http://localhost:3001`
   - **Where to set**: Vercel Dashboard → Project Settings → Environment Variables
   - **Note**: Only set this if you're using a separate backend server

## How to Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter the variable name (e.g., ``)
5. Enter the value
6. Select environments (Production, Preview, Development) - usually select all
7. Click **Save**
8. **Redeploy** your application for changes to take effect

## For Local Development

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MASTER_KEY=your_generated_64_character_hex_key_here
```

## Security Notes

⚠️ **Important**: 
- The `NEXT_PUBLIC_` prefix makes these variables available to the browser
- `NEXT_PUBLIC_MASTER_KEY` is exposed to the frontend - this is a security risk in production
- For production, consider:
  - Implementing a key exchange protocol
  - Using server-side key derivation
  - Using Web Crypto API with proper key management

## Verification

After setting environment variables:
1. Redeploy your application
2. Check that the variables are available in the build logs
3. Test the application to ensure it works correctly
