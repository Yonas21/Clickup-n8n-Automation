#!/usr/bin/env node

/**
 * Simple Google Drive authentication setup
 * This works with web application OAuth clients
 */

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupGoogleAuth() {
  console.log('🔑 Google Drive Authentication Setup\n');
  
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log('❌ Missing Google Drive credentials in .env file');
    console.log('Please make sure GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET are set');
    rl.close();
    return;
  }
  
  console.log('📋 For web application OAuth clients, you need to:');
  console.log('1. Go to Google Cloud Console: https://console.developers.google.com/');
  console.log('2. Select your project');
  console.log('3. Go to "APIs & Services" → "Credentials"');
  console.log('4. Find your OAuth 2.0 Client ID');
  console.log('5. Click "Edit"');
  console.log('6. Add these redirect URIs:');
  console.log('   - http://localhost:8080/oauth2callback');
  console.log('   - http://localhost:3000/oauth2callback');
  console.log('   - http://localhost:5678/oauth2callback');
  console.log('7. Save the changes\n');
  
  const continueSetup = await question('Have you added the redirect URIs? (y/n): ');
  
  if (continueSetup.toLowerCase() !== 'y') {
    console.log('Please add the redirect URIs first and run this script again.');
    rl.close();
    return;
  }
  
  // Try different redirect URIs
  const redirectUris = [
    'http://localhost:8080/oauth2callback',
    'http://localhost:3000/oauth2callback',
    'http://localhost:5678/oauth2callback'
  ];
  
  for (const redirectUri of redirectUris) {
    try {
      console.log(`\n🔄 Trying redirect URI: ${redirectUri}`);
      
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file']
      });
      
      console.log('📋 Follow these steps:');
      console.log('1. Open this URL in your browser:');
      console.log(`   ${authUrl}\n`);
      console.log('2. Sign in with your Google account');
      console.log('3. Grant permissions to the app');
      console.log('4. You will be redirected to a page that may show an error');
      console.log('5. Copy the "code" parameter from the URL\n');
      
      const authCode = await question('Enter the authorization code from the URL: ');
      
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
      
      const folderId = await question('Enter your Google Drive folder ID (or press Enter to use existing): ');
      
      if (folderId.trim()) {
        // Test folder access
        try {
          const folder = await drive.files.get({
            fileId: folderId,
            fields: 'id,name'
          });
          
          console.log(`\n✅ Folder access confirmed: ${folder.data.name}`);
          console.log('📋 Add this to your .env file:');
          console.log(`GOOGLE_DRIVE_FOLDER_ID=${folderId}\n`);
        } catch (error) {
          console.log('❌ Error accessing folder:', error.message);
          console.log('Using existing folder ID from .env file');
        }
      }
      
      console.log('🎉 Setup complete! You can now run: npm run backup');
      rl.close();
      return;
      
    } catch (error) {
      console.log(`❌ Error with ${redirectUri}:`, error.message);
      continue;
    }
  }
  
  console.log('\n❌ All redirect URIs failed. Please check your OAuth client configuration.');
  rl.close();
}

setupGoogleAuth().catch(console.error);