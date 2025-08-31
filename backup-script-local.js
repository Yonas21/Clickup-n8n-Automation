#!/usr/bin/env node

/**
 * ClickUp backup script that saves to local files
 * This works without Google Drive authentication
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ClickUpBackupAgent {
  constructor() {
    this.clickupToken = process.env.CLICKUP_API_TOKEN;
    this.teamId = process.env.CLICKUP_TEAM_ID;
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    
    this.clickupHeaders = {
      'Authorization': this.clickupToken,
      'Content-Type': 'application/json'
    };

    // Create backup directory
    this.backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async getSpaces() {
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/team/${this.teamId}/space`,
        { headers: this.clickupHeaders }
      );
      return response.data.spaces;
    } catch (error) {
      console.error('Error fetching spaces:', error.message);
      throw error;
    }
  }

  async getFolders(spaceId) {
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/space/${spaceId}/folder`,
        { headers: this.clickupHeaders }
      );
      return response.data.folders;
    } catch (error) {
      console.error(`Error fetching folders for space ${spaceId}:`, error.message);
      return [];
    }
  }

  async getLists(spaceId) {
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/space/${spaceId}/list`,
        { headers: this.clickupHeaders }
      );
      return response.data.lists;
    } catch (error) {
      console.error(`Error fetching lists for space ${spaceId}:`, error.message);
      return [];
    }
  }

  async getSprints(spaceId) {
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/space/${spaceId}/sprint`,
        { headers: this.clickupHeaders }
      );
      return response.data.sprints;
    } catch (error) {
      console.error(`Error fetching sprints for space ${spaceId}:`, error.message);
      return [];
    }
  }

  async getTasks(listId) {
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/list/${listId}/task`,
        {
          headers: this.clickupHeaders,
          params: {
            include_closed: true,
            subtasks: true
          }
        }
      );
      return response.data.tasks;
    } catch (error) {
      console.error(`Error fetching tasks for list ${listId}:`, error.message);
      return [];
    }
  }

  async backupSpace(space) {
    console.log(`📁 Backing up space: ${space.name}`);
    
    const [folders, lists, sprints] = await Promise.all([
      this.getFolders(space.id),
      this.getLists(space.id),
      this.getSprints(space.id)
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      space: {
        id: space.id,
        name: space.name,
        color: space.color,
        private: space.private,
        archived: space.archived,
        statuses: space.statuses,
        multiple_assignees: space.multiple_assignees,
        features: space.features
      },
      folders: folders,
      lists: lists,
      sprints: sprints,
      tasks: {}
    };

    // Get tasks for each list
    for (const list of lists) {
      console.log(`  📋 Processing list: ${list.name}`);
      const tasks = await this.getTasks(list.id);
      backupData.tasks[list.id] = tasks;
    }

    return backupData;
  }

  formatAsMarkdown(backupData) {
    const { space, folders, lists, sprints, tasks } = backupData;
    
    let docContent = `# ClickUp Backup Report

**Backup Date:** ${new Date(backupData.timestamp).toLocaleString()}
**Space:** ${space.name}
**Space ID:** ${space.id}

---

## 📁 Space Information

**Name:** ${space.name}
**Color:** ${space.color}
**Private:** ${space.private ? 'Yes' : 'No'}
**Archived:** ${space.archived ? 'Yes' : 'No'}
**Multiple Assignees:** ${space.multiple_assignees ? 'Yes' : 'No'}

### Features
${Object.entries(space.features || {}).map(([key, value]) => `- **${key}:** ${value}`).join('\n')}

---

## 📂 Folders (${folders.length})

${folders.map(folder => `
### ${folder.name}
- **ID:** ${folder.id}
- **Private:** ${folder.private ? 'Yes' : 'No'}
- **Archived:** ${folder.archived ? 'Yes' : 'No'}
- **Status:** ${folder.status?.status || 'N/A'}
- **Order Index:** ${folder.orderindex}
`).join('\n')}

---

## 📋 Lists (${lists.length})

${lists.map(list => `
### ${list.name}
- **ID:** ${list.id}
- **Private:** ${list.private ? 'Yes' : 'No'}
- **Archived:** ${list.archived ? 'Yes' : 'No'}
- **Status:** ${list.status?.status || 'N/A'}
- **Order Index:** ${list.orderindex}
- **Folder ID:** ${list.folder?.id || 'N/A'}
- **Folder Name:** ${list.folder?.name || 'N/A'}
`).join('\n')}

---

## 🎯 Sprints (${sprints.length})

${sprints.map(sprint => `
### ${sprint.name}
- **ID:** ${sprint.id}
- **Status:** ${sprint.status || 'N/A'}
- **Start Date:** ${sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : 'N/A'}
- **End Date:** ${sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : 'N/A'}
- **Created:** ${sprint.date_created ? new Date(sprint.date_created).toLocaleDateString() : 'N/A'}
`).join('\n')}

---

## 🎯 Tasks Summary

${Object.entries(tasks || {}).map(([listId, taskList]) => {
  const list = lists.find(l => l.id === listId);
  return `
### ${list ? list.name : `List ${listId}`} (${taskList.length} tasks)
${taskList.map(task => `
- **${task.name}**
  - ID: ${task.id}
  - Status: ${task.status?.status || 'N/A'}
  - Priority: ${task.priority || 'N/A'}
  - Assignees: ${task.assignees?.map(a => a.username).join(', ') || 'None'}
  - Due Date: ${task.due_date || 'No due date'}
  - Created: ${new Date(task.date_created).toLocaleDateString()}
`).join('\n')}
`;
}).join('\n')}

---

## 📊 Backup Statistics

- **Total Folders:** ${folders.length}
- **Total Lists:** ${lists.length}
- **Total Sprints:** ${sprints.length}
- **Total Tasks:** ${Object.values(tasks || {}).reduce((total, taskList) => total + taskList.length, 0)}
- **Backup Generated:** ${new Date(backupData.timestamp).toLocaleString()}

---

*This backup was generated automatically by the ClickUp Backup Agent.*
`;

    return docContent;
  }

  async saveBackup(space, backupData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const spaceName = space.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Save as JSON
    const jsonFilename = `clickup-backup-${spaceName}-${timestamp}.json`;
    const jsonPath = path.join(this.backupDir, jsonFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2));
    
    // Save as Markdown
    const mdFilename = `clickup-backup-${spaceName}-${timestamp}.md`;
    const mdPath = path.join(this.backupDir, mdFilename);
    const markdownContent = this.formatAsMarkdown(backupData);
    fs.writeFileSync(mdPath, markdownContent);
    
    console.log(`✅ Saved backup files:`);
    console.log(`   📄 JSON: ${jsonFilename}`);
    console.log(`   📝 Markdown: ${mdFilename}`);
    console.log(`   📁 Location: ${this.backupDir}`);
    
    return { jsonPath, mdPath };
  }

  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(file => file.startsWith('clickup-backup-'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      let deletedCount = 0;
      
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Deleted old backup: ${file}`);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old backups:', error.message);
      return 0;
    }
  }

  async runBackup() {
    try {
      console.log('🚀 Starting ClickUp backup...\n');

      const spaces = await this.getSpaces();
      if (spaces.length === 0) {
        console.log('❌ No spaces found in ClickUp team');
        return;
      }

      for (const space of spaces) {
        const backupData = await this.backupSpace(space);
        await this.saveBackup(space, backupData);
      }

      const deletedCount = await this.cleanupOldBackups();

      console.log('\n🎉 Backup completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`  - Spaces backed up: ${spaces.length}`);
      console.log(`  - Old backups cleaned: ${deletedCount}`);
      console.log(`  - Retention period: ${this.retentionDays} days`);
      console.log(`  - Backup location: ${this.backupDir}`);

    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  const agent = new ClickUpBackupAgent();
  agent.runBackup();
}

module.exports = ClickUpBackupAgent;