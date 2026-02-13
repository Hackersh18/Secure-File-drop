# Vercel Build & Output Settings Guide

## Quick Answer

**For your monorepo setup, you have two options:**

### Option 1: Use vercel.json (Recommended) ✅

Since you have `apps/web/vercel.json`, you can **leave Build Command, Output Directory, and Install Command EMPTY** in the Vercel Dashboard. Vercel will automatically use the settings from `vercel.json`.

### Option 2: Set Explicitly in Dashboard

If you want to set them explicitly in the Vercel Dashboard, use these values:

- **Build Command**: `cd ../.. && pnpm install && cd apps/web && pnpm run build`
- **Output Directory**: `.next`
- **Install Command**: `cd ../.. && pnpm install`

## Detailed Explanation

### Current vercel.json Configuration

Your `apps/web/vercel.json` contains:

```json
{
  "buildCommand": "cd ../.. && pnpm install && cd apps/web && pnpm run build",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### How Vercel Processes Settings

1. **If vercel.json exists**: Vercel uses settings from `vercel.json` first
2. **If dashboard settings exist**: They override `vercel.json` (if set)
3. **If neither exists**: Vercel auto-detects based on framework

### Recommended Dashboard Settings

In **Vercel Dashboard → Project Settings → General**:

| Setting | Recommended Value | Why |
|---------|-------------------|-----|
| **Build Command** | **Leave EMPTY** | `vercel.json` handles it |
| **Output Directory** | **Leave EMPTY** | `vercel.json` specifies `.next` |
| **Install Command** | **Leave EMPTY** | `vercel.json` handles monorepo install |
| **Root Directory** | `apps/web` | **MUST be set** (not in vercel.json) |
| **Framework Preset** | `Next.js` | **MUST be set** |
| **Package Manager** | `pnpm` | **MUST be set** |

### Why This Matters for Monorepos

For monorepos, you need to:
1. Install dependencies from the root (`cd ../.. && pnpm install`)
2. Build from the app directory (`cd apps/web && pnpm run build`)
3. Output to the correct location (`.next` in `apps/web`)

The `vercel.json` file handles all of this automatically.

## Troubleshooting

### If Build Fails

1. **Check Root Directory**: Must be exactly `apps/web`
2. **Check vercel.json**: Ensure it exists at `apps/web/vercel.json`
3. **Check Build Logs**: Look for specific error messages
4. **Try Explicit Settings**: If auto-detection fails, set commands explicitly in dashboard

### If Output Directory Error

- Vercel expects `.next` for Next.js
- Ensure `outputDirectory` in `vercel.json` is `.next`
- Or set it explicitly in dashboard

## Summary

✅ **Best Practice**: Leave Build Command, Output Directory, and Install Command **EMPTY** in the Vercel Dashboard and let `vercel.json` handle it.

✅ **Required Dashboard Settings**:
- Root Directory: `apps/web`
- Framework Preset: `Next.js`
- Package Manager: `pnpm`
- Node.js Version: `18.x` or higher
