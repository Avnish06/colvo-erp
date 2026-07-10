const nodemailer = require('nodemailer');
const path = require('path');

const sendUniqueIdEmail = async (email, name, uniqueId) => {
  try {
    // Basic SMTP transport configuration
    // User must fill these in .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Management System" <${process.env.SMTP_USER || 'noreply@example.com'}>`,
      to: email,
      subject: 'Your Registration Details - Unique ID',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Welcome, ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering. Your application has been received and is currently pending administrator approval.
          </p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <p style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">Your Unique ID</p>
            <p style="font-size: 32px; font-weight: 800; color: #4f46e5; margin: 0; letter-spacing: -0.02em;">${uniqueId}</p>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center;">
            Please keep this ID safe. You will need it to log in once your account is approved.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="color: #ccc; font-size: 11px; text-align: center;">
            This is an automated message. Please do not reply.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailer] Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Mailer] Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendResetPasswordEmail = async (email, name, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
      from: `"Management System" <${process.env.SMTP_USER || 'noreply@example.com'}>`,
      to: email,
      subject: 'Reset Your Password - Management System',
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fa; padding: 40px 0; margin: 0; width: 100%;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            <div style="background-color: #ffffff; padding: 48px 32px 0 32px; text-align: center;">
              <img src="cid:company_logo" alt="Company Logo" style="height: 220px; width: auto; display: block; margin: 0 auto; border: none; outline: none; text-decoration: none;" />
            </div>
            <div style="padding: 0 32px 40px 32px;">
              <h1 style="color: #1e293b; margin: -30px 0 16px 0; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.025em;">Reset Your Password</h1>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                Hello <strong>${name}</strong>,<br/>
                We received a request to reset your password for your account. No changes have been made yet.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; transition: background-color 0.2s ease;">
                  Reset Password Now
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; text-align: center; margin: 24px 0 0 0;">
                If you didn't request a password reset, you can safely ignore this email. This link will expire in <strong>15 minutes</strong>.
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px 0;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="word-break: break-all; margin: 0;">
                <a href="${resetUrl}" style="color: #4f46e5; font-size: 12px; text-decoration: underline;">${resetUrl}</a>
              </p>
            </div>
          </div>
          <div style="max-width: 600px; margin: 24px auto 0 auto; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              &copy; ${new Date().getFullYear()} Colvo Management System. All rights reserved.
            </p>
          </div>
        </div>
      `,
      attachments: [{
        filename: 'company_logo.png',
        path: path.join(__dirname, '../uploads/company_logo.png'),
        cid: 'company_logo'
      }]
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('[Mailer] Reset email sent:', info.messageId);
    console.log('[Mailer] Preview URL:', previewUrl);
    return { success: true, previewUrl, html: mailOptions.html };
  } catch (error) {
    console.error('[Mailer] Reset error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendUniqueIdEmail, sendResetPasswordEmail };
