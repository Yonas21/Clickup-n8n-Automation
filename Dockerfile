FROM n8nio/n8n:latest

# Install additional dependencies
USER root
RUN apk add --no-cache curl jq

# Copy custom files
COPY clickup-backup-workflow.json /home/node/.n8n/workflows/
COPY credentials/ /home/node/.n8n/credentials/
COPY backup-script.js /home/node/backup-script.js

# Set proper permissions
RUN chown -R node:node /home/node/.n8n
RUN chown node:node /home/node/backup-script.js

# Switch back to node user
USER node

# Expose port
EXPOSE 5678

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5678/healthz || exit 1