# Step-by-Step ClickUp Backup Setup

Since importing workflows is having issues, here's how to create the backup manually:

## Option 1: Manual Workflow Creation

### Step 1: Open n8n
1. Go to http://localhost:5678
2. Login: `admin` / `admin123`

### Step 2: Create New Workflow
1. Click "New workflow"
2. Click "Add first step"

### Step 3: Add Cron Trigger
1. Search for "Cron"
2. Add "Cron" node
3. Configure:
   - **Expression:** `0 2 * * *` (daily at 2 AM)
   - **Name:** "Daily Backup Trigger"

### Step 4: Add HTTP Request for Sprints
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
   - **Name:** "Create Doc Content"

### Step 6: Add Google Drive Node
1. Click "+" to add another node
2. Search for "Google Drive"
3. Add "Google Drive" node
4. Configure:
   - **Operation:** "Upload"
   - **Name:** `{{ $json.filename }}`
   - **Binary Data:** true
   - **Parents:** `16ZPNnvvBNMW2X5HceZ8eWmzgIdrrjFeG`
   - **Name:** "Create Google Doc"

### Step 7: Connect Nodes
Connect: Cron → HTTP Request → Code → Google Drive

### Step 8: Configure Credentials
1. Go to Settings → Credentials
2. Add "ClickUp API" credential with your token
3. Add "Google Drive OAuth2" credential

## JavaScript Code for Code Node

```javascript
const now = new Date().toISOString();
const timestamp = now.replace(/[:.]/g, '-');
const sprints = $input.all();

const docContent = `# ClickUp Sprints Backup Report

**Backup Date:** ${new Date(now).toLocaleString()}
**Space ID:** 90153332732
**Team ID:** 42092860

---

## 🎯 Sprints Summary

**Total Sprints:** ${sprints.length > 0 ? sprints[0].json.sprints?.length || 0 : 0}

${sprints.length > 0 && sprints[0].json.sprints ? sprints[0].json.sprints.map(sprint => `
### ${sprint.name}
- **ID:** ${sprint.id}
- **Status:** ${sprint.status || 'N/A'}
- **Start Date:** ${sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : 'N/A'}
- **End Date:** ${sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : 'N/A'}
- **Created:** ${sprint.date_created ? new Date(sprint.date_created).toLocaleDateString() : 'N/A'}
`).join('\n') : 'No sprints found'}

---

## 📊 Backup Statistics

- **Total Sprints:** ${sprints.length > 0 ? sprints[0].json.sprints?.length || 0 : 0}
- **Backup Generated:** ${new Date(now).toLocaleString()}

---

*This backup was generated automatically by the ClickUp Backup Agent.*`;

const filename = `ClickUp Sprints Backup - ${timestamp}`;

return {
  json: {
    filename: filename,
    content: docContent,
    mimeType: 'application/vnd.google-apps.document'
  }
};
```

## Option 2: Use Standalone Script (Recommended)

If manual creation is too complex, use the standalone backup script:

```bash
npm run backup
```

This will:
- ✅ Create beautiful Google Docs
- ✅ Upload to your Google Drive folder
- ✅ Work immediately without n8n issues
- ✅ Use your existing credentials

## Option 3: Test Simple Import

Try importing `clickup-backup-minimal.json` first - this is just a placeholder that should work.

## Troubleshooting

1. **Check credentials are set up properly**
2. **Make sure .env file has correct values**
3. **Restart n8n after making changes**
4. **Use the standalone script as backup option**