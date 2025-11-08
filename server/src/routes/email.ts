import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";

const router = Router();

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  from: z.string().email().optional(),
});

// Send email (stores in outbox for now - can integrate real email service later)
router.post("/send", authenticate, requireRole("admin", "community_admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const data = sendEmailSchema.parse(req.body);

    const email = await prisma.email.create({
      data: {
        to: data.to,
        from: data.from || "registration@fof.co.ke",
        subject: data.subject,
        body: data.body,
      },
    });

    // TODO: Integrate real email service (SendGrid, AWS SES, Nodemailer)
    // For now, just store in database

    res.json({ success: true, email });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
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



