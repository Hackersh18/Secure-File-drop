#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a 32-byte (64 hex character) master key
const masterKey = crypto.randomBytes(32).toString('hex');

console.log('\n🔑 Generated Master Key:');
console.log(masterKey);
console.log(`\n✅ Key length: ${masterKey.length} characters (correct: 64)\n`);

// Create backend .env file
const apiEnvPath = path.join(__dirname, 'apps', 'api', '.env');
const apiEnvContent = `MASTER_KEY=${masterKey}
PORT=3001
HOST=0.0.0.0
`;

// Create frontend .env.local file
const webEnvPath = path.join(__dirname, 'apps', 'web', '.env.local');
const webEnvContent = `NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MASTER_KEY=${masterKey}
`;

try {
  // Write backend .env
  fs.writeFileSync(apiEnvPath, apiEnvContent, 'utf8');
  console.log('✅ Created apps/api/.env');
  
  // Write frontend .env.local
  fs.writeFileSync(webEnvPath, webEnvContent, 'utf8');
  console.log('✅ Created apps/web/.env.local');
  
  console.log('\n🎉 Environment files created successfully!');
  console.log('\n⚠️  IMPORTANT: Keep this key secure. Do not commit it to git.\n');
} catch (error) {
  console.error('❌ Error creating environment files:', error.message);
  console.log('\n📝 Please manually create the files with this key:');
  console.log(`\napps/api/.env:`);
  console.log(`MASTER_KEY=${masterKey}`);
  console.log(`PORT=3001`);
  console.log(`HOST=0.0.0.0`);
  console.log(`\napps/web/.env.local:`);
  console.log(`NEXT_PUBLIC_API_URL=http://localhost:3001`);
  console.log(`NEXT_PUBLIC_MASTER_KEY=${masterKey}`);
  process.exit(1);
}
