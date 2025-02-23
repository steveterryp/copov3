import { sendEmail } from '../lib/email';

async function testEmailConfiguration() {
  try {
    console.log('Testing email configuration...');
    
    await sendEmail({
      to: 'Steve.Terry@paichart.com', // Sending to the same address for testing
      subject: 'Test Email Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that your SMTP configuration is working correctly.</p>
          <p>If you received this email, your email configuration is set up properly!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `,
      text: `
        Email Configuration Test

        This is a test email to verify that your SMTP configuration is working correctly.
        
        If you received this email, your email configuration is set up properly!
        
        Sent at: ${new Date().toISOString()}
      `,
    });

    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Failed to send test email:', error);
    process.exit(1);
  }
}

testEmailConfiguration();
