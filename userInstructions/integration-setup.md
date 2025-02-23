# External Integrations Setup Guide

## Overview
This guide walks through setting up integrations with Salesforce, Jira, and messaging platforms (Slack/Teams). Each integration requires specific credentials and configuration steps.

## Prerequisites
- Admin access to Salesforce org
- Jira admin privileges
- Slack/Teams workspace admin access
- Node.js 18+

## Step-by-Step Setup

### 1. Salesforce Integration

#### Create Connected App
1. Log into Salesforce as Admin
2. Navigate to Setup → Apps → App Manager
3. Click "New Connected App"
4. Fill in required fields:
   ```
   Connected App Name: PoV Manager
   API Name: PoV_Manager
   Contact Email: your-email@company.com
   Enable OAuth Settings: ✓
   Callback URL: https://your-domain/api/auth/salesforce/callback
   Selected OAuth Scopes:
   - Access and manage your data (api)
   - Perform requests at any time (refresh_token, offline_access)
   ```
5. Save and copy credentials:
   ```bash
   # Add to .env
   SALESFORCE_CLIENT_ID=your-client-id
   SALESFORCE_CLIENT_SECRET=your-client-secret
   SALESFORCE_REDIRECT_URI=https://your-domain/api/auth/salesforce/callback
   ```

#### Configure API Access
1. Create API User:
   ```sql
   Username: api-user@your-domain.com
   Profile: System Administrator
   ```
2. Set up IP Ranges:
   - Navigate to Setup → Security → Network Access
   - Add your server IP ranges

### 2. Jira Integration

#### Create API Token
1. Log into Jira as Admin
2. Go to Profile → Security
3. Create API Token:
   ```bash
   # Add to .env
   JIRA_API_TOKEN=your-api-token
   JIRA_EMAIL=your-email@company.com
   JIRA_DOMAIN=your-domain.atlassian.net
   ```

#### Configure Webhook
1. Go to System Settings → WebHooks
2. Create Webhook:
   ```
   URL: https://your-domain/api/webhooks/jira
   Events: 
   - Issue: created, updated
   - Sprint: started, closed
   ```
3. Add webhook secret:
   ```bash
   # Add to .env
   JIRA_WEBHOOK_SECRET=your-webhook-secret
   ```

### 3. Messaging Platform Integration

#### Slack Setup
1. Create Slack App:
   ```bash
   # Install dependencies
   npm install @slack/bolt
   
   # Add to .env
   SLACK_SIGNING_SECRET=your-signing-secret
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_APP_TOKEN=xapp-your-app-token
   ```

2. Configure OAuth Scopes:
   - chat:write
   - channels:read
   - users:read
   - im:write

#### Teams Setup
1. Register Teams App:
   ```bash
   # Add to .env
   TEAMS_APP_ID=your-app-id
   TEAMS_APP_PASSWORD=your-app-password
   TEAMS_TENANT_ID=your-tenant-id
   ```

2. Configure Permissions:
   - ChatMessage.Send
   - ChannelMessage.Send
   - User.Read.All

### 4. Verify Integrations

Run verification script:
```bash
npm run verify-integrations

# Expected output:
✓ Salesforce connection successful
✓ Jira API accessible
✓ Slack bot connected
✓ Teams app registered
```

## Testing

### 1. Salesforce Integration
```bash
# Test opportunity sync
npm run test-salesforce-sync

# Expected output:
✓ Retrieved opportunities
✓ Created PoV record
✓ Linked to opportunity
```

### 2. Jira Integration
```bash
# Test ticket creation
npm run test-jira-ticket

# Expected output:
✓ Created Jira ticket
✓ Added watchers
✓ Linked to PoV
```

### 3. Messaging Integration
```bash
# Test notifications
npm run test-notifications

# Expected output:
✓ Sent Slack message
✓ Posted Teams message
✓ Received webhook
```

## Troubleshooting

### Common Issues

1. Salesforce Connection Failed
   - Verify OAuth configuration
   - Check IP restrictions
   - Validate API user permissions

2. Jira API Errors
   - Check API token expiration
   - Verify domain settings
   - Validate webhook URL

3. Messaging Platform Issues
   - Check bot permissions
   - Verify token validity
   - Test webhook endpoints

### Getting Help
1. Check integration logs:
   ```bash
   tail -f logs/integrations.log
   ```
2. Run diagnostics:
   ```bash
   npm run diagnose-integrations
   ```
3. Contact support with diagnostic output

## Security Best Practices

1. Credential Management
   - Use environment variables
   - Rotate secrets regularly
   - Never commit credentials

2. Access Control
   - Implement least privilege
   - Regular access audits
   - Monitor API usage

3. Data Protection
   - Encrypt sensitive data
   - Validate webhooks
   - Implement rate limiting

## Next Steps

1. Configure sync settings
2. Set up monitoring
3. Document custom integrations
4. Plan backup procedures

## Related Documentation
- [Functional Requirements](../cline_docs/functionalRequirements.md)
- [Tech Stack](../cline_docs/techStack.md)
- [API Documentation](../cline_docs/apiDocs.md)
