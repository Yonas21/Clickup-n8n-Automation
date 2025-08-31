#!/usr/bin/env node

/**
 * ClickUp backup script that creates Word documents (.docx)
 * Enhanced with detailed sprint information
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = require('docx');

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

  async getSprintDetails(sprintId) {
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/sprint/${sprintId}`,
        { headers: this.clickupHeaders }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching sprint details for ${sprintId}:`, error.message);
      return null;
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

  async getSprintTasks(sprintId) {
    try {
      const response = await axios.get(
        `https://api.clickup.com/api/v2/sprint/${sprintId}/task`,
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
      console.error(`Error fetching sprint tasks for ${sprintId}:`, error.message);
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

    // Get detailed sprint information
    if (sprints.length > 0) {
      console.log(`  🎯 Processing ${sprints.length} sprints...`);
      for (const sprint of sprints) {
        console.log(`    📊 Getting details for sprint: ${sprint.name}`);
        const sprintDetails = await this.getSprintDetails(sprint.id);
        const sprintTasks = await this.getSprintTasks(sprint.id);
        
        // Add detailed information to sprint
        sprint.details = sprintDetails;
        sprint.tasks = sprintTasks;
      }
    }

    return backupData;
  }

  createWordDocument(backupData) {
    const { space, folders, lists, sprints, tasks } = backupData;
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "ClickUp Backup Report",
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 }
          }),

          // Backup Info
          new Paragraph({
            text: `Backup Date: ${new Date(backupData.timestamp).toLocaleString()}`,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `Space: ${space.name}`,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `Space ID: ${space.id}`,
            spacing: { after: 400 }
          }),

          // Space Information
          new Paragraph({
            text: "Space Information",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            text: `Name: ${space.name}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Color: ${space.color}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Private: ${space.private ? 'Yes' : 'No'}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Archived: ${space.archived ? 'Yes' : 'No'}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Multiple Assignees: ${space.multiple_assignees ? 'Yes' : 'No'}`,
            spacing: { after: 200 }
          }),

          // Features
          new Paragraph({
            text: "Features",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 }
          }),

          ...Object.entries(space.features || {}).map(([key, value]) => 
            new Paragraph({
              text: `• ${key}: ${JSON.stringify(value)}`,
              spacing: { after: 100 }
            })
          ),

          // Folders
          new Paragraph({
            text: `Folders (${folders.length})`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),

          ...folders.map(folder => [
            new Paragraph({
              text: folder.name,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: `ID: ${folder.id}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Private: ${folder.private ? 'Yes' : 'No'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Archived: ${folder.archived ? 'Yes' : 'No'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Status: ${folder.status?.status || 'N/A'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Order Index: ${folder.orderindex}`,
              spacing: { after: 100 }
            })
          ]).flat(),

          // Lists
          new Paragraph({
            text: `Lists (${lists.length})`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),

          ...lists.map(list => [
            new Paragraph({
              text: list.name,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: `ID: ${list.id}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Private: ${list.private ? 'Yes' : 'No'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Archived: ${list.archived ? 'Yes' : 'No'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Status: ${list.status?.status || 'N/A'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Order Index: ${list.orderindex}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Folder ID: ${list.folder?.id || 'N/A'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Folder Name: ${list.folder?.name || 'N/A'}`,
              spacing: { after: 100 }
            })
          ]).flat(),

          // Sprints with detailed information
          new Paragraph({
            text: `Sprints (${sprints.length})`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),

          ...sprints.map(sprint => [
            new Paragraph({
              text: sprint.name,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: `ID: ${sprint.id}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Status: ${sprint.status || 'N/A'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Start Date: ${sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : 'N/A'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `End Date: ${sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : 'N/A'}`,
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: `Created: ${sprint.date_created ? new Date(sprint.date_created).toLocaleDateString() : 'N/A'}`,
              spacing: { after: 50 }
            }),

            // Sprint Details
            ...(sprint.details ? [
              new Paragraph({
                text: "Sprint Details",
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              new Paragraph({
                text: `Goal: ${sprint.details.goal || 'N/A'}`,
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: `Points: ${sprint.details.points || 'N/A'}`,
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: `Completed Points: ${sprint.details.completed_points || 'N/A'}`,
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: `Total Tasks: ${sprint.details.total_tasks || 'N/A'}`,
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: `Completed Tasks: ${sprint.details.completed_tasks || 'N/A'}`,
                spacing: { after: 50 }
              })
            ] : []),

            // Sprint Tasks
            ...(sprint.tasks && sprint.tasks.length > 0 ? [
              new Paragraph({
                text: `Sprint Tasks (${sprint.tasks.length})`,
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
              }),
              ...sprint.tasks.map(task => [
                new Paragraph({
                  text: `• ${task.name}`,
                  spacing: { after: 50 }
                }),
                new Paragraph({
                  text: `  ID: ${task.id}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Status: ${task.status?.status || 'N/A'}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Priority: ${task.priority || 'N/A'}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Assignees: ${task.assignees?.map(a => a.username).join(', ') || 'None'}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Due Date: ${task.due_date || 'No due date'}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Created: ${new Date(task.date_created).toLocaleDateString()}`,
                  spacing: { after: 50 }
                })
              ]).flat()
            ] : []),

            new Paragraph({
              text: "",
              spacing: { after: 100 }
            })
          ]).flat(),

          // Tasks Summary
          new Paragraph({
            text: "Tasks Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),

          ...Object.entries(tasks || {}).map(([listId, taskList]) => {
            const list = lists.find(l => l.id === listId);
            return [
              new Paragraph({
                text: `${list ? list.name : `List ${listId}`} (${taskList.length} tasks)`,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
              }),
              ...taskList.map(task => [
                new Paragraph({
                  text: `• ${task.name}`,
                  spacing: { after: 50 }
                }),
                new Paragraph({
                  text: `  ID: ${task.id}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Status: ${task.status?.status || 'N/A'}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Priority: ${task.priority || 'N/A'}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Assignees: ${task.assignees?.map(a => a.username).join(', ') || 'None'}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Due Date: ${task.due_date || 'No due date'}`,
                  spacing: { after: 25 }
                }),
                new Paragraph({
                  text: `  Created: ${new Date(task.date_created).toLocaleDateString()}`,
                  spacing: { after: 50 }
                })
              ]).flat()
            ];
          }).flat(),

          // Backup Statistics
          new Paragraph({
            text: "Backup Statistics",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({
            text: `Total Folders: ${folders.length}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Total Lists: ${lists.length}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Total Sprints: ${sprints.length}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Total Tasks: ${Object.values(tasks || {}).reduce((total, taskList) => total + taskList.length, 0)}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Backup Generated: ${new Date(backupData.timestamp).toLocaleString()}`,
            spacing: { after: 200 }
          }),

          // Footer
          new Paragraph({
            text: "This backup was generated automatically by the ClickUp Backup Agent.",
            spacing: { before: 400 }
          })
        ]
      }]
    });

    return doc;
  }

  async saveBackup(space, backupData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const spaceName = space.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Save as JSON
    const jsonFilename = `clickup-backup-${spaceName}-${timestamp}.json`;
    const jsonPath = path.join(this.backupDir, jsonFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2));
    
    // Create and save Word document
    const docFilename = `clickup-backup-${spaceName}-${timestamp}.docx`;
    const docPath = path.join(this.backupDir, docFilename);
    
    const doc = this.createWordDocument(backupData);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(docPath, buffer);
    
    console.log(`✅ Saved backup files:`);
    console.log(`   📄 JSON: ${jsonFilename}`);
    console.log(`   📝 Word: ${docFilename}`);
    console.log(`   📁 Location: ${this.backupDir}`);
    
    return { jsonPath, docPath };
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
      console.log('🚀 Starting ClickUp backup with Word documents...\n');

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
      console.log(`  - Format: Word documents (.docx) with detailed sprint information`);

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