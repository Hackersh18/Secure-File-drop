# Secure File Drop 🔒

A simple, secure way to share files. Your files are encrypted in your browser before they're uploaded, so even the server never sees what you're sharing.

## What is this?

This app lets you:
- **Upload files** that get encrypted automatically
- **Share a file ID** with someone
- **Download files** that only you (and whoever has the ID) can decrypt

The cool part? Everything is encrypted in your browser. The server never sees your actual files - just encrypted data.

## Quick Start

### What you need

- **Node.js** version 18 or higher
- **pnpm** version 8 or higher (we use pnpm instead of npm)

### Step 1: Install everything

Open your terminal in this folder and run:

```bash
pnpm install
```

This downloads all the code libraries we need.

### Step 2: Create your secret key

You need a secret key to encrypt files. Generate one by running:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will print a long string of random characters - that's your master key! **Save it somewhere safe** - you'll need it later.

### Step 3: Set up environment variables

Create a file called `.env.local` in the `apps/web` folder with:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MASTER_KEY=your_generated_key_here
```

Replace `your_generated_key_here` with the key you generated in Step 2.

### Step 4: Run the app

```bash
pnpm dev
```

Now open your browser and go to:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

That's it! You should see the app running.

## How it works (simple version)

### When you upload a file:

1. You pick a file in your browser
2. Your browser creates a random encryption key (DEK)
3. Your browser encrypts the file with that key
4. Your browser encrypts the key itself using your master key
5. Everything encrypted gets sent to the server
6. The server gives you back a file ID

**Important**: The server never sees your actual file - only encrypted data!

### When you download a file:

1. You enter the file ID
2. The server sends back the encrypted data
3. Your browser decrypts the key using your master key
4. Your browser decrypts the file using that key
5. Your file downloads to your computer

## Project Structure

Here's what's in this project:

```
.
├── apps/
│   ├── api/          # Optional Fastify backend
│   └── web/          # Next.js frontend + API routes
│       └── src/
│           └── app/
│               ├── api/      # API endpoints
│               └── page.tsx  # Main UI
├── packages/
│   └── crypto/       # Shared encryption utilities
└── package.json      # Root workspace config
```

## Deploying to Vercel (for free!)

Vercel is a free hosting service that works great with Next.js. Here's how to deploy:

### Before you start

1. **Generate a production key** (different from your local one):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Save this key - you'll need it!

2. **Push your code to GitHub** (if you haven't already)

### Deploy steps

1. **Go to [vercel.com](https://vercel.com)** and sign up/login

2. **Click "New Project"** and connect your GitHub repository

3. **Configure your project**:
   
   In the project settings, you need to set:
   
   - **Root Directory**: `apps/web` (this tells Vercel where your app is)
   - **Framework Preset**: `Next.js` (very important!)
   - **Package Manager**: `pnpm`
   - **Node.js Version**: 18.x or higher
   
   For Build Command, Output Directory, and Install Command - **leave them empty**. The `vercel.json` file handles this automatically.

4. **Add your secret key**:
   
   - Go to Settings → Environment Variables
   - Click "Add New"
   - Name: `NEXT_PUBLIC_MASTER_KEY`
   - Value: Your generated key from step 1
   - Select all environments (Production, Preview, Development)
   - Click Save
   
   **Don't set** `NEXT_PUBLIC_API_URL` - leave it empty for Vercel.

5. **Deploy!**
   
   - If you connected GitHub, Vercel will deploy automatically when you push
   - Or click "Deploy" in the Vercel dashboard

### Checklist before deploying

Make sure you've done these:

- ✅ Set Root Directory to `apps/web`
- ✅ Set Framework Preset to "Next.js"
- ✅ Set Package Manager to `pnpm`
- ✅ Added `NEXT_PUBLIC_MASTER_KEY` environment variable
- ✅ Left `NEXT_PUBLIC_API_URL` empty
- ✅ Your code builds locally (try `cd apps/web && pnpm run build`)

### Testing your deployment

1. Visit your Vercel URL (something like `https://your-app.vercel.app`)
2. Try uploading a file
3. Copy the file ID it gives you
4. Try downloading it using that ID

If it works, you're all set! 🎉

## Important things to know

### ⚠️ Storage limitation

Right now, files are stored in memory. This means:
- Files might disappear when the server restarts
- Files might not work across different server instances

**For a real app**, you'd want to use:
- A database (like Vercel Postgres or Supabase)
- File storage (like AWS S3 or Cloudflare R2)

### ⚠️ Security notes

This is a learning project. For a real production app, you'd want:
- Better key management (don't expose the master key to the frontend)
- User authentication
- File size limits
- Rate limiting
- Better error handling

But for learning and testing, this works great!

## Troubleshooting

### Build fails on Vercel?

1. Check that Root Directory is exactly `apps/web` (no trailing slash)
2. Make sure Framework Preset is set to "Next.js"
3. Check the build logs in Vercel for specific errors

### Getting 500 errors?

1. Check that `NEXT_PUBLIC_MASTER_KEY` is set in environment variables
2. Check the Vercel function logs for specific error messages
3. Check the function logs in Vercel (Deployments → Your deployment → Functions)

### Files not persisting?

This is expected! The app uses in-memory storage. Each serverless function might have its own memory. For production, add a database.

## Tech Stack

- **Frontend**: Next.js 14 (React with TypeScript)
- **Backend**: Next.js API routes (or Fastify for separate deployment)
- **Encryption**: AES-256-GCM (industry standard)
- **Package Manager**: pnpm
- **Monorepo**: Turborepo


