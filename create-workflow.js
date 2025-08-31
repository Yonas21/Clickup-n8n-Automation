#!/usr/bin/env node

/**
 * Script to create n8n workflow programmatically
 * This bypasses the import issues by creating the workflow directly
 */

const fs = require('fs');
const path = require('path');

// Simple workflow structure that should work with n8n 0.235.0
const workflow = {
  "name": "ClickUp Backup Manual",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "value": "0 2 * * *"
            }
          ]
        }
      },
      "id": "cron-trigger",
      "name": "Daily Backup Trigger",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "https://api.clickup.com/api/v2/team/{{ $env.CLICKUP_TEAM_ID }}/space",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "clickupApi"
      },
      "id": "get-spaces",
      "name": "Get ClickUp Spaces",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [460, 300],
      "credentials": {
        "clickupApi": {
          "id": "clickup-credentials",
          "name": "ClickUp API"
        }
      }
    },
    {
      "parameters": {
        "jsCode": `const spaces = $input.all();
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

let allSpaces = [];
for (const space of spaces) {
  if (space.json && space.json.spaces) {
    allSpaces = allSpaces.concat(space.json.spaces);
  }
}

const backupData = {
  timestamp: new Date().toISOString(),
  spaces: allSpaces,
  totalSpaces: allSpaces.length
};

const filename = \`clickup-backup-\${timestamp}.json\`;

return {
  json: {
    filename: filename,
    content: JSON.stringify(backupData, null, 2)
  }
};`
      },
      "id": "create-backup",
      "name": "Create Backup File",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [680, 300]
    },
    {
      "parameters": {
        "operation": "upload",
        "name": "={{ $json.filename }}",
        "binaryData": true,
        "options": {
          "parents": {
            "values": [
              {
                "parentId": "={{ $env.GOOGLE_DRIVE_FOLDER_ID }}"
              }
            ]
          }
        }
      },
      "id": "upload-to-drive",
      "name": "Upload to Google Drive",
      "type": "n8n-nodes-base.googleDrive",
      "typeVersion": 3,
      "position": [900, 300],
      "credentials": {
        "googleDriveOAuth2Api": {
          "id": "google-drive-credentials",
          "name": "Google Drive OAuth2"
        }
      }
    }
  ],
  "connections": {
    "Daily Backup Trigger": {
      "main": [
        [
          {
            "node": "Get ClickUp Spaces",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get ClickUp Spaces": {
      "main": [
        [
          {
            "node": "Create Backup File",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Create Backup File": {
      "main": [
        [
          {
            "node": "Upload to Google Drive",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": [],
  "triggerCount": 1,
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "versionId": "1"
};

// Save the workflow
const workflowPath = path.join(__dirname, 'clickup-backup-manual.json');
fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2));

console.log('✅ Workflow created: clickup-backup-manual.json');
console.log('📋 Manual creation steps:');
console.log('1. Open n8n at http://localhost:5678');
console.log('2. Create new workflow manually');
console.log('3. Add nodes one by one:');
console.log('   - Cron Trigger (Daily at 2 AM)');
console.log('   - HTTP Request (Get ClickUp spaces)');
console.log('   - Code (Process data)');
console.log('   - Google Drive (Upload backup)');
console.log('4. Connect the nodes');
console.log('5. Configure credentials');
console.log('');
console.log('🔧 Or use the standalone script: npm run backup');