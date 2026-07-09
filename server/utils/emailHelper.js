import nodemailer from 'nodemailer';

// Helper to configure transporter
const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
  }
  return null;
};

// Log fallback layout for testing/development
const logConsoleEmail = (title, to, subject, content) => {
  console.log(`
=========================================
📧 DEV EMAIL LOGGER [No SMTP Configured]
=========================================
Subject:  ${subject}
To:       ${to}
-----------------------------------------
${content}
=========================================
`);
};

export const sendVerificationEmail = async (to, otp, link) => {
  const subject = 'Verify your Nexus Couture Account';
  const textContent = `Welcome to Nexus Couture! Please verify your account.
Your 6-digit OTP verification code is: ${otp}
Alternatively, you can verify your account by visiting the following link: ${link}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Welcome to Nexus Couture</h2>
      <p>Thank you for registering. Please verify your account using the OTP code below:</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">
        ${otp}
      </div>
      <p style="margin-top: 20px;">Or click the link below to verify directly:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${link}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Account</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />
      <p style="font-size: 11px; color: #6b7280; text-align: center;">This link will expire in 24 hours. If you did not sign up for this account, please ignore this email.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Nexus Couture Support" <support@nexus.io>',
        to,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`✅ Verification email sent successfully to ${to}`);
    } catch (error) {
      console.error(`❌ SMTP Failed to send verification email to ${to}:`, error.message);
      logConsoleEmail('VERIFICATION EMAIL', to, subject, textContent);
    }
  } else {
    logConsoleEmail('VERIFICATION EMAIL', to, subject, textContent);
  }
};

export const sendForgotPasswordEmail = async (to, resetLink) => {
  const subject = 'Reset your Nexus Couture Password';
  const textContent = `You requested a password reset for your Nexus Couture account.
Please visit the following link to reset your password: ${resetLink}`;

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
      <p>We received a request to reset your password. Please click the button below to complete the setup:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eaeaea; margin-top: 30px;" />
      <p style="font-size: 11px; color: #6b7280; text-align: center;">This link will expire in 1 hour.</p>
    </div>
  `;

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Nexus Couture Support" <support@nexus.io>',
        to,
        subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`✅ Forgot password email sent successfully to ${to}`);
    } catch (error) {
      console.error(`❌ SMTP Failed to send forgot password email to ${to}:`, error.message);
      logConsoleEmail('FORGOT PASSWORD EMAIL', to, subject, textContent);
    }
  } else {
    logConsoleEmail('FORGOT PASSWORD EMAIL', to, subject, textContent);
  }
};
