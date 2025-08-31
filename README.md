# ClickUp to Google Drive Backup Agent

A powerful n8n-based automation agent that automatically backs up your ClickUp workspace data to Google Drive. This agent provides comprehensive backup functionality including spaces, folders, lists, and tasks with automatic cleanup of old backups.

## 🚀 Features

- **Automated Daily Backups**: Runs daily at 2:00 AM (configurable)
- **Complete Data Backup**: Backs up spaces, folders, lists, and tasks
- **Google Drive Integration**: Automatically uploads backups to Google Drive
- **Automatic Cleanup**: Removes old backups based on retention policy
- **Error Handling**: Comprehensive error handling and notifications
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Standalone Script**: Can run independently of n8n
- **Flexible Configuration**: Environment-based configuration

## 📋 Prerequisites

Before setting up the backup agent, you'll need:

### ClickUp API Access
1. Go to your ClickUp settings
2. Navigate to "Apps" → "API"
3. Generate an API token
4. Note your Team ID from the URL or API response

### Google Drive API Access
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials
5. Download the credentials JSON file
6. Create a folder in Google Drive for backups and note the folder ID

### System Requirements
- Node.js 16+ (for standalone script)
- Docker and Docker Compose (for containerized deployment)
- n8n (for workflow automation)

## 🛠️ Installation

### Option 1: Quick Setup with Setup Script

1. **Clone or download this repository**
   ```bash
   cd /path/to/your/project
   ```

2. **Run the setup script**
   ```bash
   node setup-credentials.js
   ```
   This interactive script will guide you through configuring all necessary credentials.

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start n8n**
   ```bash
   npm start
   ```

5. **Import the workflow**
   - Open http://localhost:5678 in your browser
   - Import the `clickup-backup-workflow.json` file
   - Activate the workflow

### Option 2: Manual Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file** with your credentials:
   ```env
   CLICKUP_API_TOKEN=your_clickup_api_token
   CLICKUP_TEAM_ID=your_team_id
   GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
   GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
   GOOGLE_DRIVE_FOLDER_ID=your_backup_folder_id
   ```

3. **Configure credentials** in the `credentials/` directory

4. **Install and start**
   ```bash
   npm install
   npm start
   ```

### Option 3: Docker Deployment

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access n8n**
   - Open http://localhost:5678
   - Import and activate the workflow

## 📁 Project Structure

```
clickup-backup-agent/
├── package.json                 # Node.js dependencies and scripts
├── .env.example                 # Environment variables template
├── .env                         # Your environment configuration
├── clickup-backup-workflow.json # n8n workflow definition
├── backup-script.js             # Standalone backup script
├── setup-credentials.js         # Interactive setup script
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Custom Docker image
├── credentials/                 # API credential files
│   ├── clickup-api.json
│   └── google-drive-oauth2.json
└── README.md                    # This file
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLICKUP_API_TOKEN` | Your ClickUp API token | Required |
| `CLICKUP_TEAM_ID` | Your ClickUp team ID | Required |
| `GOOGLE_DRIVE_CLIENT_ID` | Google OAuth client ID | Required |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Google OAuth client secret | Required |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | Google OAuth refresh token | Required |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive backup folder ID | Required |
| `BACKUP_SCHEDULE` | Cron expression for backup schedule | `0 2 * * *` |
| `BACKUP_RETENTION_DAYS` | Days to keep old backups | `30` |
| `N8N_BASIC_AUTH_PASSWORD` | n8n admin password | `admin123` |

### Backup Schedule

The default backup runs daily at 2:00 AM. You can customize this using cron expressions:

- `0 2 * * *` - Daily at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight

## 🔄 Workflow Overview

The n8n workflow performs the following steps:

1. **Trigger**: Daily cron trigger (configurable)
2. **Fetch Spaces**: Retrieves all spaces from ClickUp team
3. **Process Each Space**:
   - Fetch folders and lists
   - Get all tasks for each list
   - Compile comprehensive backup data
4. **Create Backup File**: Generate JSON backup with timestamp
5. **Upload to Google Drive**: Upload backup file to specified folder
6. **Cleanup**: Remove old backups based on retention policy
7. **Notifications**: Send success/error notifications

## 🚀 Usage

### Running Manual Backups

You can run a manual backup using the standalone script:

```bash
npm run backup
```

Or directly:

```bash
node backup-script.js
```

### Monitoring Backups

1. **n8n Interface**: Check the workflow execution history
2. **Google Drive**: Verify backup files in your designated folder
3. **Logs**: Check n8n logs for detailed execution information

### Backup File Format

Backup files are stored as JSON with the following structure:

```json
{
  "timestamp": "2024-01-01T02:00:00.000Z",
  "space": {
    "id": "space_id",
    "name": "Space Name",
    "color": "#ff6b6b",
    "private": false,
    "archived": false,
    "statuses": [...],
    "multiple_assignees": true,
    "features": {...}
  },
  "folders": [...],
  "lists": [...],
  "tasks": {
    "list_id_1": [...],
    "list_id_2": [...]
  }
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify API tokens are correct
   - Check if tokens have expired
   - Ensure proper permissions are granted

2. **Google Drive Upload Fails**
   - Verify folder ID is correct
   - Check Google Drive API quotas
   - Ensure OAuth credentials are valid

3. **ClickUp API Rate Limits**
   - The workflow includes delays to respect rate limits
   - Consider reducing backup frequency if needed

4. **Workflow Not Triggering**
   - Check cron expression format
   - Verify workflow is activated
   - Check n8n logs for errors

### Debug Mode

Enable debug logging by setting:

```env
N8N_LOG_LEVEL=debug
```

### Manual Testing

Test individual components:

```bash
# Test ClickUp API connection
curl -H "Authorization: YOUR_TOKEN" https://api.clickup.com/api/v2/user

# Test Google Drive API
node -e "console.log('Google Drive test')"
```

## 🔒 Security Considerations

- Store credentials securely using environment variables
- Use strong passwords for n8n authentication
- Regularly rotate API tokens
- Monitor backup access logs
- Consider using Docker secrets for production deployments

## 📈 Monitoring and Alerts

The workflow includes built-in notifications for:
- Successful backup completion
- Backup failures with error details
- Cleanup operations summary

You can extend these notifications to include:
- Email alerts
- Slack notifications
- Webhook calls to monitoring services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review n8n documentation
3. Check ClickUp and Google Drive API documentation
4. Create an issue in the repository

## 🔄 Updates and Maintenance

- Regularly update n8n to the latest version
- Monitor API changes from ClickUp and Google
- Review and update backup retention policies
- Test backups periodically to ensure data integrity

---

**Happy Backing Up! 🎉**