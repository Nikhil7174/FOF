import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { ParticipantStatus, Gender } from "@prisma/client";

const router = Router();

const createParticipantSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  gender: z.enum(["male", "female"]),
  dob: z.string().or(z.date()),
  email: z.string().email(),
  phone: z.string().min(1),
  communityId: z.string().uuid(),
  nextOfKin: z.object({
    firstName: z.string().min(1),
    middleName: z.string().optional(),
    lastName: z.string().min(1),
    phone: z.string().min(1),
  }),
  sports: z.array(z.string().uuid()),
  teamName: z.string().optional(),
});

// List all participants (admin, community_admin, sports_admin)
router.get("/", authenticate, requireRole("admin", "community_admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {};
    
    // Community admins can only see their community's participants
    if (req.user!.role === "community_admin" && req.user!.communityId) {
      where.communityId = req.user!.communityId;
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
    
    // Check if email already exists
    const existing = await prisma.participant.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return res.status(409).json({ error: "Participant with this email already exists" });
    }

    // Parse date
    const dob = typeof data.dob === "string" ? new Date(data.dob) : data.dob;

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

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update status" });
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


