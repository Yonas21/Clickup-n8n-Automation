#!/usr/bin/env node

/**
 * Script to help find the Google Drive refresh token
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Looking for Google Drive refresh token...\n');

// Check if n8n data directory exists
const n8nDataPath = path.join(process.env.HOME, '.n8n');
const credentialsPath = path.join(n8nDataPath, 'credentials');

console.log('📁 Checking n8n data directory...');
console.log(`Path: ${n8nDataPath}`);

if (fs.existsSync(n8nDataPath)) {
  console.log('✅ n8n data directory found');
  
  if (fs.existsSync(credentialsPath)) {
    console.log('✅ credentials directory found');
    
    // List all credential files
    const files = fs.readdirSync(credentialsPath);
    console.log(`\n📋 Found ${files.length} credential files:`);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(credentialsPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const credential = JSON.parse(content);
          
          if (credential.type === 'googleDriveOAuth2Api' || 
              credential.name?.toLowerCase().includes('google') ||
              credential.name?.toLowerCase().includes('drive')) {
            
            console.log(`\n🎯 Found Google Drive credential: ${credential.name}`);
            console.log(`File: ${file}`);
            
            if (credential.data?.refreshToken) {
              console.log('✅ Refresh token found!');
              console.log(`📋 Add this to your .env file:`);
              console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${credential.data.refreshToken}`);
            } else {
              console.log('❌ No refresh token found in this credential');
            }
          }
        } catch (error) {
          console.log(`❌ Error reading ${file}: ${error.message}`);
        }
      }
    });
  } else {
    console.log('❌ credentials directory not found');
  }
} else {
  console.log('❌ n8n data directory not found');
  console.log('Make sure n8n is installed and has been run at least once');
}

console.log('\n📋 Alternative: Manual steps:');
console.log('1. Open n8n: http://localhost:5678');
console.log('2. Go to Settings → Credentials');
console.log('3. Find your Google Drive credential');
console.log('4. Copy the refresh token');
console.log('5. Add it to your .env file');