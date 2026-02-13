#!/usr/bin/env node

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3001';

console.log(`\n🔍 Checking backend at ${API_URL}...\n`);

const req = http.request(`${API_URL}/files/upload`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
}, (res) => {
  console.log(`✅ Backend is running!`);
  console.log(`   Status: ${res.statusCode}`);
  console.log(`   Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`   Response:`, data);
    console.log(`\n✅ Backend is accessible from this machine.\n`);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error(`❌ Backend is NOT running or not accessible!`);
  console.error(`   Error: ${error.message}\n`);
  
  if (error.code === 'ECONNREFUSED') {
    console.log('💡 Solution: Start the backend with:');
    console.log('   cd apps/api && pnpm run dev\n');
  } else {
    console.log('💡 Check:');
    console.log('   1. Is the backend running?');
    console.log('   2. Is it on the correct port? (check apps/api/.env)');
    console.log('   3. Check backend terminal for errors\n');
  }
  
  process.exit(1);
});

req.end();
