# Email Setup Instructions

## Overview
The application uses SMTP to send emails for:
- Password reset links
- Welcome emails for new users
- System notifications

## Configuration Steps

1. Choose an Email Service Provider
   - You can use services like:
     - Gmail SMTP
     - Amazon SES
     - SendGrid
     - Mailgun
     - Your own SMTP server

2. Get SMTP Credentials
   - For Gmail:
     1. Enable 2-Step Verification in your Google Account
     2. Create an App Password:
        - Go to Google Account Settings
        - Security
        - App Passwords
        - Select "Mail" and your device
        - Copy the generated password
   - For other providers:
     - Follow their documentation to get SMTP credentials

3. Configure Environment Variables
   Copy these settings to your `.env` file and update with your values:
   ```
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   SMTP_FROM="PoV Manager <noreply@example.com>"
   ```

   Common SMTP Settings:
   - Gmail:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     ```
   - Amazon SES:
     ```
     SMTP_HOST=email-smtp.{region}.amazonaws.com
     SMTP_PORT=587
     SMTP_SECURE=false
     ```
   - SendGrid:
     ```
     SMTP_HOST=smtp.sendgrid.net
     SMTP_PORT=587
     SMTP_SECURE=false
     ```

4. Test Email Configuration
   - Create a new user in the admin interface
   - Check if the welcome email is received
   - Try the "Forgot Password" feature
   - Monitor the console for any email sending errors

## Troubleshooting

### Common Issues

1. Connection Timeout
   - Check if SMTP_HOST is correct
   - Verify your firewall allows outbound SMTP connections
   - Try using SMTP_SECURE=true with port 465

2. Authentication Failed
   - Double-check SMTP_USER and SMTP_PASS
   - For Gmail, ensure you're using an App Password
   - Check if the account has necessary permissions

3. Emails Not Received
   - Check spam/junk folder
   - Verify the recipient email is correct
   - Check server logs for sending errors
   - Verify SMTP_FROM is properly formatted

### Testing SMTP Connection

You can test your SMTP connection using telnet:
```bash
telnet your-smtp-host 587
```

Or using a tool like swaks:
```bash
swaks --to test@example.com --from noreply@yourapp.com --server your-smtp-host
```

## Security Considerations

1. Environment Variables
   - Never commit SMTP credentials to version control
   - Use secure environment variable management in production
   - Rotate SMTP passwords periodically

2. Email Content
   - Use TLS/SSL when available (SMTP_SECURE=true)
   - Don't include sensitive information in emails
   - Follow email best practices and anti-spam guidelines

## Support

If you encounter issues:
1. Check the application logs for detailed error messages
2. Verify all environment variables are correctly set
3. Test SMTP connection using telnet or similar tools
4. Contact your email service provider's support if needed
