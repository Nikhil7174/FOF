import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { sendEmail } from "../utils/email";

const router = Router();

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  from: z.string().email().optional(),
});

const contactEmailSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

// Public contact endpoint (no authentication required)
router.post("/contact", async (req, res: Response) => {
  try {
    const data = contactEmailSchema.parse(req.body);
    
    // Get admin email - must be configured, no fallback to example.com
    const adminEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;
    
    if (!adminEmail || adminEmail.includes("example.com")) {
      console.error("❌ CONTACT_EMAIL or SMTP_USER not configured. Cannot send contact form emails.");
      return res.status(500).json({ 
        error: "Email service not configured", 
        message: "Please configure CONTACT_EMAIL or SMTP_USER environment variable to receive contact form submissions."
      });
    }

    // Format the email body
    const emailBody = `
New contact form submission:

Name: ${data.name}
Email: ${data.email}

Message:
${data.message}

---
This email was sent from the contact form on your website.
    `.trim();

    // Send email to admin
    await sendEmail({
      to: adminEmail,
      subject: `Contact Form: New Message from ${data.name}`,
      body: emailBody,
    });

    // Also send confirmation to the user
    await sendEmail({
      to: data.email,
      subject: "Thank you for contacting us",
      body: `Hi ${data.name},\n\nThank you for reaching out! We have received your message and will get back to you soon.\n\nBest regards,\nThe Team`,
    });

    // Store in database for record keeping
    await prisma.email.create({
      data: {
        to: adminEmail,
        from: data.email,
        subject: `Contact Form: ${data.name}`,
        body: emailBody,
      },
    });

    res.json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Contact form error:", error);
    res.status(500).json({ error: error.message || "Failed to send message" });
  }
});

// Send email (authenticated - for admin use)
router.post("/send", authenticate, requireRole("admin", "community_admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const data = sendEmailSchema.parse(req.body);

    // Actually send the email using nodemailer
    await sendEmail({
      to: data.to,
      subject: data.subject,
      body: data.body,
      from: data.from,
    });

    // Store in database for record keeping
    const email = await prisma.email.create({
      data: {
        to: data.to,
        from: data.from || "registration@fof.co.ke",
        subject: data.subject,
        body: data.body,
      },
    });

    res.json({ success: true, email });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Send email error:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

// List outbox
router.get("/outbox", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const emails = await prisma.email.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(emails);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list outbox" });
  }
});

export default router;



