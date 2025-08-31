#!/usr/bin/env node

/**
 * Script to get Google Drive refresh token
 * This will help you authenticate with Google Drive API
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function getGoogleToken() {
  console.log('🔑 Google Drive Authentication Setup\n');
  
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log('❌ Missing Google Drive credentials in .env file');
    console.log('Please make sure GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET are set');
    rl.close();
    return;
  }
  
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:8080/oauth2callback'
  );
  
  // Generate the URL for authentication
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file']
  });
  
  console.log('📋 Follow these steps:');
  console.log('1. Open this URL in your browser:');
  console.log(`   ${authUrl}\n`);
  console.log('2. Sign in with your Google account');
  console.log('3. Grant permissions to the app');
  console.log('4. Copy the authorization code from the page\n');
  
  const authCode = await question('Enter the authorization code: ');
  
  try {
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);
    
    console.log('\n✅ Authentication successful!');
    console.log('📋 Add this to your .env file:');
    console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    
    // Test the connection
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id,name)'
    });
    
    console.log('✅ Google Drive connection test successful!');
    console.log(`📁 Found ${response.data.files.length} files in your Drive\n`);
    
    // Ask for folder ID
    console.log('📁 Now let\'s set up your backup folder:');
    console.log('1. Go to https://drive.google.com');
    console.log('2. Navigate to or create your backup folder');
    console.log('3. Copy the folder ID from the URL');
    console.log('   (The long string after /folders/ in the URL)\n');
    
    const folderId = await question('Enter your Google Drive folder ID: ');
    
    // Test folder access
    try {
      const folder = await drive.files.get({
        fileId: folderId,
        fields: 'id,name'
      });
      
      console.log(`\n✅ Folder access confirmed: ${folder.data.name}`);
      console.log('📋 Add this to your .env file:');
      console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}\n`);
      
      console.log('🎉 Setup complete! You can now run: npm run backup');
      
    } catch (error) {
      console.log('❌ Error accessing folder:', error.message);
      console.log('Please check the folder ID and try again');
    }
    
  } catch (error) {
    console.log('❌ Error getting token:', error.message);
  }
  
  rl.close();
}

getGoogleToken().catch(console.error);