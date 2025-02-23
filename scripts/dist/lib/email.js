import nodemailer from 'nodemailer';
import { config } from './config';
// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export async function sendEmail({ to, subject, text, html }) {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || config.app.name,
            to,
            subject,
            text,
            html,
        });
        console.log('Email sent:', info.messageId);
        return info;
    }
    catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}
export function generatePasswordResetEmail(resetToken, userName) {
    const resetUrl = `${config.app.url}/auth/reset-password?token=${resetToken}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hello ${userName},</p>
      <p>You recently requested to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in ${config.auth.passwordResetTokenExpiry} minutes.</p>
      <p>Best regards,<br>${config.app.name} Team</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
      <p style="color: #666; font-size: 12px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        ${resetUrl}
      </p>
    </div>
  `;
    const text = `
    Reset Your Password
    
    Hello ${userName},
    
    You recently requested to reset your password. Click the link below to proceed:
    
    ${resetUrl}
    
    If you didn't request this, you can safely ignore this email.
    
    This link will expire in ${config.auth.passwordResetTokenExpiry} minutes.
    
    Best regards,
    ${config.app.name} Team
  `;
    return { html, text };
}
