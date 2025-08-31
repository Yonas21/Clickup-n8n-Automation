#!/usr/bin/env node

/**
 * Standalone backup script for ClickUp to Google Drive
 * This can be run independently of n8n for manual backups
 */

require('dotenv').config();
const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class ClickUpBackupAgent {
  constructor() {
    this.clickupToken = process.env.CLICKUP_API_TOKEN;
    this.teamId = process.env.CLICKUP_TEAM_ID;
    this.googleFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    
    this.clickupHeaders = {
      'Authorization': this.clickupToken,
      'Content-Type': 'application/json'
    };

    this.setupGoogleDrive();
  }

  setupGoogleDrive() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    });

    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
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
    
    const [folders, lists] = await Promise.all([
      this.getFolders(space.id),
      this.getLists(space.id)
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

  formatAsGoogleDoc(backupData) {
    const { space, folders, lists, tasks } = backupData;
    
    let docContent = `
# ClickUp Backup Report

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
- **Total Tasks:** ${Object.values(tasks || {}).reduce((total, taskList) => total + taskList.length, 0)}
- **Backup Generated:** ${new Date(backupData.timestamp).toLocaleString()}

---

*This backup was generated automatically by the ClickUp Backup Agent.*
`;

    return docContent;
  }

  async createGoogleDoc(filename, content) {
    try {
      // Create a new Google Doc
      const docMetadata = {
        name: filename,
        parents: [this.googleFolderId]
      };

      const response = await this.drive.files.create({
        resource: docMetadata,
        media: {
          mimeType: 'application/vnd.google-apps.document',
          body: content
        },
        fields: 'id,name,createdTime,webViewLink'
      });

      console.log(`✅ Created Google Doc: ${filename}`);
      console.log(`📄 View at: ${response.data.webViewLink}`);
      return response.data;
    } catch (error) {
      console.error('Error creating Google Doc:', error.message);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const response = await this.drive.files.list({
        q: `'${this.googleFolderId}' in parents and name contains 'ClickUp Backup' and mimeType = 'application/vnd.google-apps.document'`,
        orderBy: 'createdTime desc',
        fields: 'files(id,name,createdTime)'
      });

      const files = response.data.files;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      const filesToDelete = files.filter(file => {
        const createdTime = new Date(file.createdTime);
        return createdTime < cutoffDate;
      }).slice(0, -1); // Keep at least one backup

      for (const file of filesToDelete) {
        await this.drive.files.delete({ fileId: file.id });
        console.log(`🗑️ Deleted old backup: ${file.name}`);
      }

      return filesToDelete.length;
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
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ClickUp Backup - ${space.name} - ${timestamp}`;
        const docContent = this.formatAsGoogleDoc(backupData);

        await this.createGoogleDoc(filename, docContent);
      }

      const deletedCount = await this.cleanupOldBackups();

      console.log('\n🎉 Backup completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`  - Spaces backed up: ${spaces.length}`);
      console.log(`  - Old backups cleaned: ${deletedCount}`);
      console.log(`  - Retention period: ${this.retentionDays} days`);

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