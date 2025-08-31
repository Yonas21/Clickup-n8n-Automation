#!/usr/bin/env node

/**
 * Setup script for ClickUp to Google Drive Backup Agent
 * This script helps configure the necessary credentials and environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupCredentials() {
  console.log('🚀 ClickUp to Google Drive Backup Agent Setup\n');
  console.log('This script will help you configure the necessary credentials.\n');

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created!\n');
  }

  console.log('🔧 Please provide the following information:\n');

  // ClickUp API Configuration
  console.log('📋 ClickUp API Configuration:');
  const clickupToken = await question('Enter your ClickUp API Token: ');
  const teamId = await question('Enter your ClickUp Team ID: ');

  // Google Drive API Configuration
  console.log('\n📁 Google Drive API Configuration:');
  console.log('To get Google Drive API credentials:');
  console.log('1. Go to https://console.developers.google.com/');
  console.log('2. Create a new project or select existing one');
  console.log('3. Enable Google Drive API');
  console.log('4. Create OAuth 2.0 credentials');
  console.log('5. Download the credentials JSON file\n');

  const googleClientId = await question('Enter Google Drive Client ID: ');
  const googleClientSecret = await question('Enter Google Drive Client Secret: ');
  const googleRefreshToken = await question('Enter Google Drive Refresh Token: ');
  const googleFolderId = await question('Enter Google Drive Backup Folder ID: ');

  // n8n Configuration
  console.log('\n⚙️ n8n Configuration:');
  const n8nPassword = await question('Enter n8n admin password (or press Enter for default): ') || 'admin123';

  // Backup Configuration
  console.log('\n🔄 Backup Configuration:');
  const backupSchedule = await question('Enter backup schedule (cron format, default: 0 2 * * *): ') || '0 2 * * *';
  const retentionDays = await question('Enter backup retention days (default: 30): ') || '30';

  // Update .env file
  const envContent = `# ClickUp API Configuration
CLICKUP_API_TOKEN=${clickupToken}
CLICKUP_TEAM_ID=${teamId}

# Google Drive API Configuration
GOOGLE_DRIVE_CLIENT_ID=${googleClientId}
GOOGLE_DRIVE_CLIENT_SECRET=${googleClientSecret}
GOOGLE_DRIVE_REFRESH_TOKEN=${googleRefreshToken}
GOOGLE_DRIVE_FOLDER_ID=${googleFolderId}

# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=${n8nPassword}
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http

# Backup Configuration
BACKUP_SCHEDULE=${backupSchedule}
BACKUP_RETENTION_DAYS=${retentionDays}
`;

  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file updated with your credentials!');

  // Create credentials directory if it doesn't exist
  const credentialsDir = path.join(__dirname, 'credentials');
  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir);
  }

  // Update credential files
  const clickupCreds = {
    name: "ClickUp API",
    type: "clickupApi",
    data: {
      apiToken: clickupToken
    },
    nodesAccess: [
      {
        nodeType: "n8n-nodes-base.httpRequest",
        date: new Date().toISOString()
      }
    ]
  };

  const googleCreds = {
    name: "Google Drive OAuth2",
    type: "googleDriveOAuth2Api",
    data: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      refreshToken: googleRefreshToken
    },
    nodesAccess: [
      {
        nodeType: "n8n-nodes-base.googleDrive",
        date: new Date().toISOString()
      }
    ]
  };

  fs.writeFileSync(
    path.join(credentialsDir, 'clickup-api.json'),
    JSON.stringify(clickupCreds, null, 2)
  );

  fs.writeFileSync(
    path.join(credentialsDir, 'google-drive-oauth2.json'),
    JSON.stringify(googleCreds, null, 2)
  );

  console.log('✅ Credential files created!');

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm start');
  console.log('3. Open http://localhost:5678 in your browser');
  console.log('4. Import the workflow: clickup-backup-workflow.json');
  console.log('5. Activate the workflow');

  rl.close();
}

setupCredentials().catch(console.error);