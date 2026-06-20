const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// ─────────────────────────────────────────────────────
//  emailService.js
//  Sends professional branded emails using
//  Gmail OAuth2 — the most secure way to send email.
//
//  Why OAuth2 instead of plain SMTP password?
//  Plain password can be stolen and used anywhere.
//  OAuth2 token only works for sending email — nothing
//  else. This is how Stripe, GitHub, and Google send
//  their own transactional emails.
// ─────────────────────────────────────────────────────

// ── OAuth2 Client Setup ───────────────────────────────
const OAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

OAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// ── Create Transporter ────────────────────────────────
// Called fresh every time we send an email
// This ensures we always have a fresh access token
// Access tokens expire every 1 hour — OAuth2 auto refreshes
const createTransporter = async () => {
  const accessToken = await OAuth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });
};

// ─────────────────────────────────────────────────────
//  EMAIL TEMPLATE BASE
//  Every email shares this wrapper design
//  Clean, minimal, professional — like Stripe emails
// ─────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Toll Management System</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f6f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- HEADER -->
          <tr>
            <td style="
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
              padding: 40px 48px;
              border-radius: 16px 16px 0 0;
              text-align: center;
            ">
              <!-- Logo Icon -->
              <div style="
                width: 64px;
                height: 64px;
                background: rgba(255,255,255,0.1);
                border-radius: 16px;
                margin: 0 auto 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid rgba(255,255,255,0.2);
              ">
                <span style="font-size: 32px;">🛣️</span>
              </div>
              <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 22px;
                font-weight: 700;
                letter-spacing: -0.5px;
              ">Toll Management System</h1>
              <p style="
                margin: 6px 0 0;
                color: rgba(255,255,255,0.6);
                font-size: 13px;
                letter-spacing: 1px;
                text-transform: uppercase;
              ">Secure · Fast · Reliable</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="
              background: #ffffff;
              padding: 48px;
              border-left: 1px solid #e8ecf0;
              border-right: 1px solid #e8ecf0;
            ">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="
              background: #f8fafc;
              padding: 24px 48px;
              border-radius: 0 0 16px 16px;
              border: 1px solid #e8ecf0;
              border-top: none;
              text-align: center;
            ">
              <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px;">
                This email was sent by <strong style="color: #64748b;">Toll Management System</strong>
              </p>
              <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px;">
                If you did not request this, please ignore this email or
                <a href="mailto:${process.env.GMAIL_USER}" style="color: #6366f1; text-decoration: none;">contact support</a>
              </p>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e8ecf0;">
                <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                  © ${new Date().getFullYear()} Toll Management System. All rights reserved.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────────────
//  sendVerificationEmail
//  Sent when a new user registers
//  Contains a button to verify their email address
// ─────────────────────────────────────────────────────
const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email/${token}`;

  const content = `
    <!-- Greeting -->
    <h2 style="
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 24px;
      font-weight: 700;
    ">Welcome aboard, ${name}! 👋</h2>
    <p style="margin: 0 0 32px; color: #64748b; font-size: 15px; line-height: 1.6;">
      We're thrilled to have you join the Toll Management System.
      To get started, please verify your email address below.
    </p>

    <!-- Info Box -->
    <div style="
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
    ">
      <p style="margin: 0; color: #0369a1; font-size: 14px; line-height: 1.6;">
        🔒 <strong>Why verify?</strong> Verifying your email keeps your account secure
        and ensures you receive important notifications about your toll transactions.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${verifyUrl}" style="
        display: inline-block;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: #ffffff;
        text-decoration: none;
        padding: 16px 48px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.3px;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      ">Verify My Email Address</a>
    </div>

    <!-- Expiry Warning -->
    <div style="
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 32px;
    ">
      <p style="margin: 0; color: #c2410c; font-size: 13px;">
        ⏰ <strong>This link expires in 10 minutes.</strong>
        If it expires, you can request a new verification email from your account settings.
      </p>
    </div>

    <!-- Manual URL -->
    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px;">
      Button not working? Copy and paste this link into your browser:
    </p>
    <p style="
      margin: 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #6366f1;
      word-break: break-all;
    ">${verifyUrl}</p>
  `;

  const transporter = await createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "✅ Verify Your Email — Toll Management System",
    html: baseTemplate(content),
  });

  console.log(`📧 Verification email sent to ${email}`);
};

// ─────────────────────────────────────────────────────
//  sendPasswordResetEmail
//  Sent when user requests forgot password
//  Contains a secure reset button
// ─────────────────────────────────────────────────────
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${token}`;

  const content = `
    <!-- Greeting -->
    <h2 style="
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 24px;
      font-weight: 700;
    ">Password Reset Request 🔐</h2>
    <p style="margin: 0 0 32px; color: #64748b; font-size: 15px; line-height: 1.6;">
      Hi <strong>${name}</strong>, we received a request to reset the password
      for your Toll Management System account.
    </p>

    <!-- Warning Box -->
    <div style="
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 32px;
    ">
      <p style="margin: 0; color: #dc2626; font-size: 14px; line-height: 1.6;">
        🚨 <strong>Did not request this?</strong> If you did not request a password reset,
        please ignore this email. Your account is safe and no changes have been made.
      </p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${resetUrl}" style="
        display: inline-block;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: #ffffff;
        text-decoration: none;
        padding: 16px 48px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 0.3px;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
      ">Reset My Password</a>
    </div>

    <!-- Expiry Warning -->
    <div style="
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 32px;
    ">
      <p style="margin: 0; color: #c2410c; font-size: 13px;">
        ⏰ <strong>This link expires in 10 minutes.</strong>
        After expiry you will need to request a new reset link.
      </p>
    </div>

    <!-- Security Note -->
    <div style="
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 32px;
    ">
      <p style="margin: 0; color: #15803d; font-size: 13px; line-height: 1.6;">
        🛡️ <strong>Security tip:</strong> After resetting your password, we recommend
        enabling two-factor authentication for extra security.
      </p>
    </div>

    <!-- Manual URL -->
    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px;">
      Button not working? Copy and paste this link into your browser:
    </p>
    <p style="
      margin: 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #6366f1;
      word-break: break-all;
    ">${resetUrl}</p>
  `;

  const transporter = await createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "🔐 Password Reset Request — Toll Management System",
    html: baseTemplate(content),
  });

  console.log(`📧 Password reset email sent to ${email}`);
};

// ─────────────────────────────────────────────────────
//  sendWelcomeEmail
//  Sent after user successfully verifies their email
// ─────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, name) => {
  const content = `
    <!-- Greeting -->
    <h2 style="
      margin: 0 0 8px;
      color: #0f172a;
      font-size: 24px;
      font-weight: 700;
    ">You're all set, ${name}! 🎉</h2>
    <p style="margin: 0 0 32px; color: #64748b; font-size: 15px; line-height: 1.6;">
      Your email has been verified and your Toll Management System
      account is now fully activated. Here is what you can do next:
    </p>

    <!-- Feature Cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="
          background: #fafafa;
          border: 1px solid #e8ecf0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 12px;
        ">
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #0f172a;">
            🚗 Register Your Vehicle
          </p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Add your vehicle details and RFID tag to start using toll lanes.
          </p>
        </td>
      </tr>
      <tr><td style="height: 12px;"></td></tr>
      <tr>
        <td style="
          background: #fafafa;
          border: 1px solid #e8ecf0;
          border-radius: 12px;
          padding: 20px;
        ">
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #0f172a;">
            💳 Add Balance to Wallet
          </p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Top up your toll wallet to enable automatic toll payments.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <div style="text-align: center;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" style="
        display: inline-block;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: #ffffff;
        text-decoration: none;
        padding: 16px 48px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      ">Go to My Dashboard</a>
    </div>
  `;

  const transporter = await createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "🎉 Welcome to Toll Management System — Account Activated!",
    html: baseTemplate(content),
  });

  console.log(`📧 Welcome email sent to ${email}`);
};

const sendLowBalanceEmail = async (email, name, currentBalance, minimumBalance) => {
  const content = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:24px;font-weight:700;">
      Low Balance Alert ⚠️
    </h2>
    <p style="margin:0 0 32px;color:#64748b;font-size:15px;line-height:1.6;">
      Hi <strong>${name}</strong>, your toll wallet balance is running low.
    </p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
      <p style="margin:0 0 8px;color:#c2410c;font-size:15px;">
        <strong>Current Balance:</strong> ${currentBalance} BDT
      </p>
      <p style="margin:0;color:#c2410c;font-size:15px;">
        <strong>Minimum Balance:</strong> ${minimumBalance} BDT
      </p>
    </div>

    <div style="text-align:center;margin-bottom:32px;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/wallet"
        style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:12px;font-size:16px;font-weight:600;">
        Top Up Now
      </a>
    </div>
  `;

  const transporter = await createTransporter();

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: "⚠️ Low Balance Alert — Toll Management System",
    html:    baseTemplate(content),
  });

  console.log(`📧 Low balance alert sent to ${email}`);
};


module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLowBalanceEmail,
  sendWelcomeEmail,
};