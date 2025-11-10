import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
// Supports Gmail, Outlook, and other SMTP services
// Based on official Nodemailer documentation: https://nodemailer.com/
const createTransporter = async () => {
  // Check if we have SMTP configuration
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@example.com";

  // If SMTP is configured, use it
  if (smtpHost && smtpUser && smtpPassword) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  // Default: Gmail configuration (requires app password)
  // For Gmail: Go to Google Account > Security > 2-Step Verification > App passwords
  if (smtpUser && smtpPassword) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPassword, // Use App Password, not regular password
      },
    });
  }

  // Fallback: Create a test account using Ethereal.email (for development only)
  // In production, you MUST set SMTP_USER and SMTP_PASSWORD
  console.warn("⚠️  No SMTP configuration found. Creating test account with Ethereal.email...");
  console.warn("⚠️  Set SMTP_USER and SMTP_PASSWORD environment variables for production.");
  
  // Create a test account dynamically (as per Nodemailer docs)
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
};

// Create transporter (will be initialized asynchronously)
let transporter: nodemailer.Transporter | null = null;

const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
};

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  
  if (!smtpFrom || smtpFrom.includes("example.com")) {
    throw new Error("SMTP_FROM or SMTP_USER not configured. Cannot send emails.");
  }
  
  const emailTransporter = await getTransporter();
  
  const mailOptions = {
    from: options.from || smtpFrom,
    to: options.to,
    subject: options.subject,
    text: options.body,
    html: options.html || options.body.replace(/\n/g, "<br>"),
  };

  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    
    // If using Ethereal test account, get the preview URL
    // As per Nodemailer docs: https://nodemailer.com/
    if (info.messageId) {
      try {
        // getTestMessageUrl is a synchronous function available when using Ethereal test accounts
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log("📧 Preview URL (Ethereal test account):", previewUrl);
          console.log("   You can view the email in your browser using the URL above");
        }
      } catch {
        // Not using Ethereal, or getTestMessageUrl not available - that's fine
      }
    }
    
    return;
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Verify transporter configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const emailTransporter = await getTransporter();
    await emailTransporter.verify();
    console.log("✅ Email server is ready to send messages");
    return true;
  } catch (error: any) {
    console.error("❌ Email server configuration error:", error.message);
    console.error("   Make sure SMTP_USER and SMTP_PASSWORD are set correctly");
    return false;
  }
};

