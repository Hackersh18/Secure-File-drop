# Vercel Deployment Guide

## Quick Start

1. **Generate Master Key**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Connect Repository to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Project Settings**:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: `Next.js`
   - **Package Manager**: `pnpm`
   - **Node.js Version**: `18.x` or higher

4. **Set Environment Variables**:
   - `NEXT_PUBLIC_MASTER_KEY`: Your 64-character hex key
   - `NEXT_PUBLIC_API_URL`: Leave empty (or don't set)

5. **Deploy**: Vercel will automatically deploy on push to main branch

## Detailed Configuration

### Vercel Project Settings

Navigate to: **Project Settings → General**

| Setting | Value | Notes |
|---------|-------|-------|
| Framework Preset | `Next.js` | Required for API routes |
| Root Directory | `apps/web` | Exact path, no trailing slash |
| Package Manager | `pnpm` | Must match your workspace |
| Node.js Version | `18.x` or higher | Recommended: Latest LTS |
| Build Command | **Leave empty** | Uses `vercel.json` settings |
| Output Directory | **Leave empty** | Uses `vercel.json` settings (`.next`) |
| Install Command | **Leave empty** | Uses `vercel.json` settings |

**Note**: Since `apps/web/vercel.json` exists, Vercel will automatically use those settings. You can leave Build Command, Output Directory, and Install Command empty in the dashboard, or set them to match `vercel.json`:
- **Build Command**: `cd ../.. && pnpm install && cd apps/web && pnpm run build`
- **Output Directory**: `.next`
- **Install Command**: `cd ../.. && pnpm install`

### Environment Variables

Navigate to: **Project Settings → Environment Variables**

#### Required

- **`NEXT_PUBLIC_MASTER_KEY`**
  - Type: String
  - Value: 64-character hexadecimal string
  - Environments: Production, Preview, Development (select all)
  - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### Optional

- **`NEXT_PUBLIC_API_URL`**
  - Type: String
  - Value: Leave **empty** for Vercel (defaults to `/api`)
  - Only set if using a separate backend server

### Build Configuration

The `apps/web/vercel.json` file is configured for monorepo deployment:

```json
{
  "buildCommand": "cd ../.. && pnpm install && cd apps/web && pnpm run build",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

## Troubleshooting

### Build Fails

1. **Check Root Directory**: Must be exactly `apps/web`
2. **Check Package Manager**: Must be set to `pnpm`
3. **Check Node Version**: Must be 18.x or higher
4. **Check Build Logs**: Look for specific error messages

### 500 Errors on API Routes

1. **Verify Framework Preset**: Must be "Next.js"
2. **Check Function Logs**: Go to Deployments → Functions → Logs
3. **Test Simple Route**: Visit `/api/test` to verify API routes work
4. **Check Environment Variables**: Ensure `NEXT_PUBLIC_MASTER_KEY` is set
5. **Rebuild**: Trigger a new deployment after fixing issues

### Files Not Persisting

⚠️ **Expected Behavior**: The current implementation uses in-memory storage. In Vercel's serverless environment:
- Each function invocation may have separate memory
- Files may not persist across requests
- This is a limitation of in-memory storage in serverless

**Solutions**:
- Add a database (Vercel Postgres, Supabase)
- Use object storage (AWS S3, Cloudflare R2)
- Implement persistent file storage

## Post-Deployment

1. **Test Upload**: Upload a file and verify encryption
2. **Test Download**: Download using the file ID
3. **Check Logs**: Monitor function logs for errors
4. **Set Up Monitoring**: Configure error tracking (Sentry, etc.)

## Security Considerations

⚠️ **Important**: The master key is exposed to the browser via `NEXT_PUBLIC_MASTER_KEY`.

**For Production**:
- Implement a key exchange protocol
- Use server-side key derivation
- Consider using Web Crypto API with proper key management
- Never commit `.env.local` files

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check function logs
3. Verify all settings match this guide
4. Test locally first: `cd apps/web && pnpm run build`
