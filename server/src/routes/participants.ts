import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { ParticipantStatus, Gender, Role } from "@prisma/client";
import { hashPassword } from "../utils/password";
import { sendEmail } from "../utils/email";

const router = Router();

const createParticipantSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  gender: z.enum(["male", "female"]),
  dob: z.string().or(z.date()),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
  communityId: z.string().min(1, "Community ID is required"),
  nextOfKin: z.object({
    firstName: z.string().min(1),
    middleName: z.string().optional(),
    lastName: z.string().min(1),
    phone: z.string().min(1),
  }),
  sports: z.array(z.string().min(1, "Invalid sport ID")).min(1, "At least one sport must be selected"),
  teamName: z.string().optional(),
});

// List all participants (admin, community_admin, sports_admin)
router.get("/", authenticate, requireRole("admin", "community_admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    
    // Community admins can only see their community's participants
    if (req.user!.role === "community_admin" && req.user!.communityId) {
      where.communityId = req.user!.communityId;
      console.log(`[Participants] Filtering by communityId: ${req.user!.communityId} for user: ${req.user!.username}`);
    }

    const participants = await prisma.participant.findMany({
      where,
      include: {
        community: true,
        sports: {
          include: {
            sport: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    // Debug logging for community admins
    if (req.user!.role === "community_admin") {
      console.log(`[Participants] Found ${participants.length} participants for community ${req.user!.communityId}`);
      participants.forEach((p: any) => {
        console.log(`[Participants] - ${p.email} (${p.firstName} ${p.lastName}) - communityId: ${p.communityId}, status: ${p.status}`);
      });
    }

    // Sports admins can only see participants registered for their sport
    if (req.user!.role === "sports_admin" && req.user!.sportId) {
      const filtered = participants.filter((p: any) => 
        p.sports.some((ps: any) => ps.sportId === req.user!.sportId)
      );
      return res.json(filtered);
    }

    res.json(participants);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list participants" });
  }
});

// Get my participant (for regular users)
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true },
    });

    if (!user || !user.email) {
      return res.json(null);
    }

    const participant = await prisma.participant.findUnique({
      where: { email: user.email },
      include: {
        community: true,
        sports: {
          include: {
            sport: true,
          },
        },
      },
    });

    res.json(participant);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get participant" });
  }
});

// Create participant
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = createParticipantSchema.parse(req.body);
    
    // Check if email already exists in Participant or User table
    const existingParticipant = await prisma.participant.findUnique({
      where: { email: data.email },
    });

    if (existingParticipant) {
      return res.status(409).json({ error: "Participant with this email already exists" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Parse date
    const dob = typeof data.dob === "string" ? new Date(data.dob) : data.dob;

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate username from email (before @ symbol)
    const username = data.email.split("@")[0] + "_" + Date.now().toString().slice(-6);

    // Create user account first
    const user = await prisma.user.create({
      data: {
        username,
        email: data.email,
        password: hashedPassword,
        role: Role.user,
      },
    });

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        gender: data.gender as Gender,
        dob,
        email: data.email,
        phone: data.phone,
        communityId: data.communityId,
        nextOfKin: data.nextOfKin as any,
        teamName: data.teamName,
        sports: {
          create: data.sports.map((sportId) => ({
            sportId,
          })),
        },
      },
      include: {
        community: true,
        sports: {
          include: {
            sport: true,
          },
        },
      },
    });

    res.status(201).json(participant);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    // If user creation succeeded but participant creation failed, clean up user
    if (error.code === "P2002") {
      const email = req.body?.email;
      if (email) {
        // Try to delete the user if it was created
        try {
          await prisma.user.deleteMany({
            where: { email },
          });
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }
    res.status(500).json({ error: error.message || "Failed to create participant" });
  }
});

// Update participant status
router.patch("/:id/status", authenticate, requireRole("admin", "community_admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Check if participant exists
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        sports: {
          include: {
            sport: true,
          },
        },
      },
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Community admins can only update their community's participants
    if (req.user!.role === "community_admin" && participant.communityId !== req.user!.communityId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Sports admins can only update participants registered for their sport
    if (req.user!.role === "sports_admin" && req.user!.sportId) {
      const hasSport = participant.sports.some((ps: any) => ps.sportId === req.user!.sportId);
      if (!hasSport) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const updated = await prisma.participant.update({
      where: { id },
      data: { status: status as ParticipantStatus },
      include: {
        community: true,
        sports: {
          include: {
            sport: true,
          },
        },
      },
    });

    // Send email notification based on status change
    if (status === "accepted" || status === "rejected") {
      try {
        const participantName = `${updated.firstName} ${updated.middleName || ""} ${updated.lastName}`.trim();
        const communityName = updated.community?.name || "your community";
        const sportNames = updated.sports.map((ps: any) => ps.sport.name).join(", ");
        
        let emailSubject = "";
        let emailBody = "";
        
        if (status === "accepted") {
          emailSubject = "FOF 2026 - Registration Accepted!";
          emailBody = `
Dear ${participantName},

Congratulations! Your registration for the Festival of Friendship (FOF) 2026 has been accepted!

You have been accepted into ${communityName} for the following sports:
${sportNames}

You can now log in to your account and access your dashboard to view your registration details and upcoming events.

If you have any questions, please don't hesitate to contact us.

Best regards,
FOF 2026 Team
          `.trim();
        } else if (status === "rejected") {
          emailSubject = "FOF 2026 - Registration Update";
          emailBody = `
Dear ${participantName},

Thank you for your interest in the Festival of Friendship (FOF) 2026.

Unfortunately, we are unable to accept your registration at this time. If you have any questions or would like to discuss this further, please contact us.

We appreciate your understanding.

Best regards,
FOF 2026 Team
          `.trim();
        }

        // Send the email
        await sendEmail({
          to: updated.email,
          subject: emailSubject,
          body: emailBody,
          from: process.env.REGISTRATION_EMAIL || process.env.SMTP_USER || "registration@fof.co.ke",
        });

        // Store in database for record keeping
        await prisma.email.create({
          data: {
            to: updated.email,
            from: process.env.REGISTRATION_EMAIL || process.env.SMTP_USER || "registration@fof.co.ke",
            subject: emailSubject,
            body: emailBody,
          },
        });
      } catch (emailError: any) {
        // Log email error but don't fail the status update
        console.error("Failed to send status notification email:", emailError);
        // Continue with the response even if email fails
      }
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update status" });
  }
});

// Update participant profile details
router.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const updateSchema = z.object({
      firstName: z.string().min(1).optional(),
      middleName: z.string().optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().min(1).optional(),
      nextOfKin: z.object({
        firstName: z.string().min(1),
        middleName: z.string().optional(),
        lastName: z.string().min(1),
        phone: z.string().min(1),
      }).optional(),
      teamName: z.string().optional(),
    });

    const data = updateSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true },
    });

    if (!user || !user.email) {
      return res.status(404).json({ error: "User not found" });
    }

    const participant = await prisma.participant.findUnique({
      where: { email: user.email },
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.middleName !== undefined) updateData.middleName = data.middleName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.nextOfKin !== undefined) updateData.nextOfKin = data.nextOfKin as any;
    if (data.teamName !== undefined) updateData.teamName = data.teamName;

    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: updateData,
      include: {
        community: true,
        sports: {
          include: {
            sport: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Failed to update participant" });
  }
});

// Update participant sports
router.patch("/me/sports", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sportIds } = req.body;

    if (!Array.isArray(sportIds)) {
      return res.status(400).json({ error: "sportIds must be an array" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true },
    });

    if (!user || !user.email) {
      return res.status(404).json({ error: "User not found" });
    }

    const participant = await prisma.participant.findUnique({
      where: { email: user.email },
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Delete existing sports
    await prisma.participantSport.deleteMany({
      where: { participantId: participant.id },
    });

    // Create new sports
    await prisma.participantSport.createMany({
      data: sportIds.map((sportId: string) => ({
        participantId: participant.id,
        sportId,
      })),
    });

    const updated = await prisma.participant.findUnique({
      where: { id: participant.id },
      include: {
        community: true,
        sports: {
          include: {
            sport: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update sports" });
  }
});

// Delete participant
router.delete("/:id", authenticate, requireRole("admin", "community_admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        sports: {
          include: {
            sport: true,
          },
        },
      },
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Community admins can only delete their community's participants
    if (req.user!.role === "community_admin" && participant.communityId !== req.user!.communityId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Sports admins can only delete participants registered for their sport
    if (req.user!.role === "sports_admin" && req.user!.sportId) {
      const hasSport = participant.sports.some((ps: any) => ps.sportId === req.user!.sportId);
      if (!hasSport) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    await prisma.participant.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete participant" });
  }
});

export default router;


