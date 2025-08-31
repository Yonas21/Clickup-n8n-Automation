# n8n Workflow Import Guide

## Issue: "Cannot read properties of undefined (reading 'name')"

This error typically occurs when:
1. The workflow JSON structure is incompatible with your n8n version
2. There are missing required fields
3. The file is corrupted or malformed

## Solutions:

### Option 1: Create Workflow Manually (Recommended)

Instead of importing, create the workflow step by step:

1. **Start n8n:**
   ```bash
   npm start
   ```

2. **Open n8n interface:**
   - Go to http://localhost:5678
   - Login with: `admin` / `admin123`

3. **Create new workflow:**
   - Click "New workflow"
   - Click "Add first step"

4. **Add nodes one by one:**
   - **Cron Trigger:** Search for "Cron" → Add "Cron" node
   - **HTTP Request:** Search for "HTTP Request" → Add "HTTP Request" node
   - **Code:** Search for "Code" → Add "Code" node
   - **Google Drive:** Search for "Google Drive" → Add "Google Drive" node

### Option 2: Try Different Import Methods

1. **Copy-paste method:**
   - Open the JSON file in a text editor
   - Copy all content
   - In n8n, click "Import from clipboard"
   - Paste the content

2. **Try the simple test first:**
   - Import `simple-test.json` first
   - If that works, try `minimal-workflow.json`

### Option 3: Use the Standalone Script

If n8n continues to have issues, use the standalone backup script:

```bash
npm run backup
```

This will run the backup without n8n.

## Manual Workflow Creation Steps:

### Step 1: Add Cron Trigger
- Search: "Cron"
- Add: "Cron" node
- Configure: Set to "0 2 * * *" (daily at 2 AM)

### Step 2: Add HTTP Request
- Search: "HTTP Request"
- Add: "HTTP Request" node
- Configure:
  - URL: `https://api.clickup.com/api/v2/team/{{ $env.CLICKUP_TEAM_ID }}/space`
  - Authentication: "Predefined Credential Type"
  - Credential Type: "ClickUp API"

### Step 3: Add Code Node
- Search: "Code"
- Add: "Code" node
- Configure: Add the JavaScript code to process the data

### Step 4: Add Google Drive
- Search: "Google Drive"
- Add: "Google Drive" node
- Configure:
  - Operation: "Upload"
  - Name: `{{ $json.filename }}`
  - Binary Data: true
  - Parents: `{{ $env.GOOGLE_DRIVE_FOLDER_ID }}`

## Troubleshooting:

1. **Check n8n version:**
   ```bash
   npx n8n --version
   ```

2. **Check if n8n is running:**
   - Go to http://localhost:5678
   - Should see n8n interface

3. **Check credentials:**
   - Go to Settings → Credentials
   - Make sure ClickUp and Google Drive credentials are configured

4. **Check environment variables:**
   - Make sure `.env` file is properly configured
   - Restart n8n after changing `.env`

## Alternative: Use Docker

If local installation continues to have issues:

```bash
docker-compose up -d
```

This will run n8n in a container with all dependencies properly configured.