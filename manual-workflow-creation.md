# Manual Workflow Creation Guide

Since importing workflows is having issues, let's create the ClickUp backup workflow manually.

## Step-by-Step Manual Creation

### Step 1: Open n8n
1. Go to http://localhost:5678
2. Login with: `admin` / `admin123`

### Step 2: Create New Workflow
1. Click "New workflow"
2. Click "Add first step"

### Step 3: Add Cron Trigger
1. Search for "Cron"
2. Add "Cron" node
3. Configure:
   - **Expression:** `0 2 * * *` (daily at 2 AM)
   - **Name:** "Daily Backup Trigger"

### Step 4: Add HTTP Request Node
1. Click "+" to add another node
2. Search for "HTTP Request"
3. Add "HTTP Request" node
4. Configure:
   - **URL:** `https://api.clickup.com/api/v2/space/90153332732/sprint`
   - **Authentication:** "Predefined Credential Type"
   - **Credential Type:** "ClickUp API"
   - **Name:** "Get Sprints"

### Step 5: Add Code Node
1. Click "+" to add another node
2. Search for "Code"
3. Add "Code" node
4. Configure:
   - **Language:** JavaScript
   - **Code:** (see below)
   - **Name:** "Create Backup File"

### Step 6: Add Google Drive Node
1. Click "+" to add another node
2. Search for "Google Drive"
3. Add "Google Drive" node
4. Configure:
   - **Operation:** "Upload"
   - **Name:** `{{ $json.filename }}`
   - **Binary Data:** true
   - **Parents:** `16ZPNnvvBNMW2X5HceZ8eWmzgIdrrjFeG`
   - **Name:** "Upload to Google Drive"

### Step 7: Connect Nodes
Connect them in order: Cron → HTTP Request → Code → Google Drive

### Step 8: Configure Credentials
1. Go to Settings → Credentials
2. Add "ClickUp API" credential with your token
3. Add "Google Drive OAuth2" credential

## JavaScript Code for Code Node

```javascript
const now = new Date().toISOString();
const timestamp = now.replace(/[:.]/g, '-');
const sprints = $input.all();

const backupData = {
  timestamp: now,
  sprints: sprints.length > 0 ? sprints[0].json.sprints || [] : [],
  totalSprints: sprints.length > 0 ? sprints[0].json.sprints?.length || 0 : 0
};

const filename = `clickup-sprints-backup-${timestamp}.json`;

return {
  json: {
    filename: filename,
    content: JSON.stringify(backupData, null, 2)
  }
};
```

## Alternative: Use Standalone Script

If manual creation is too complex, use the standalone backup script:

```bash
npm run backup
```

This will run the backup without n8n and should work immediately.