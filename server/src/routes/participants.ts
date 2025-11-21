import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { ParticipantStatus, Gender, Role, Prisma } from "@prisma/client";
import { hashPassword } from "../utils/password";
import { sendEmail } from "../utils/email";
import { sendExport } from "../utils/export";

const router = Router();

const createParticipantSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  gender: z.enum(["male", "female"]),
  dob: z.string().or(z.date()),
  email: z.string().email(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only include letters, numbers, underscores, hyphens or dots"),
  phone: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
  communityId: z.string().min(1, "Community ID is required"),
  nextOfKin: z.object({
    firstName: z.string().min(1),
    middleName: z.string().optional(),
    lastName: z.string().min(1),
    phone: z.string().min(1),
  }),
  sports: z.array(
    z.union([
      z.string().min(1, "Invalid sport ID"),
      z.object({
        sportId: z.string().min(1, "Invalid sport ID"),
        notes: z.string().max(500).optional().nullable(),
      }),
    ])
  ).min(1, "At least one sport must be selected"),
  teamName: z.string().optional(),
  notes: z.string().min(1, "Payment details are required").max(500),
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
    
    // Include pendingSports in the response
    const participantsWithPending = participants.map((p: any) => ({
      ...p,
      pendingSports: p.pendingSports,
    }));
    
    // Debug logging for community admins
    if (req.user!.role === "community_admin") {
      console.log(`[Participants] Found ${participants.length} participants for community ${req.user!.communityId}`);
      participants.forEach((p: any) => {
        console.log(`[Participants] - ${p.email} (${p.firstName} ${p.lastName}) - communityId: ${p.communityId}, status: ${p.status}`);
      });
    }

    // Sports admins can only see participants registered for their sport
    if (req.user!.role === "sports_admin" && req.user!.sportId) {
      const filtered = participantsWithPending.filter((p: any) => 
        p.sports.some((ps: any) => ps.sportId === req.user!.sportId)
      );
      return res.json(filtered);
    }

    res.json(participantsWithPending);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list participants" });
  }
});

// Get my participant (for regular users)
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const participant = await prisma.participant.findUnique({
      where: { userId: req.user!.id },
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
  let createdUserId: string | null = null;
  try {
    const data = createParticipantSchema.parse(req.body);

    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Parse date
    const dob = typeof data.dob === "string" ? new Date(data.dob) : data.dob;

    // Normalize sports array - extract sportIds for validation
    const sportIds = data.sports.map((s: any) => typeof s === "string" ? s : s.sportId);

    // Check for incompatible sports
    if (sportIds.length > 1) {
      const selectedSports = await prisma.sport.findMany({
        where: { id: { in: sportIds } },
        include: {
          incompatibleWith: {
            include: {
              incompatibleSport: true,
            },
          },
        } as any,
      });

      // Check if any selected sports are incompatible with each other
      for (const sport of selectedSports) {
        const incompatibleIds = sport.incompatibleWith.map((inc: any) => inc.incompatibleSportId);
        const hasIncompatible = sportIds.some(
          (selectedId) => selectedId !== sport.id && incompatibleIds.includes(selectedId)
        );

        if (hasIncompatible) {
          const incompatibleSport = selectedSports.find((s) => incompatibleIds.includes(s.id));
          return res.status(400).json({
            error: `Cannot select ${sport.name} and ${incompatibleSport?.name || "another incompatible sport"} together. These sports are incompatible.`,
          });
        }
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user account first
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: Role.user,
      },
    });

    createdUserId = user.id;

    const participantData: Prisma.ParticipantUncheckedCreateInput = {
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      gender: data.gender as Gender,
      dob,
      email: data.email,
      phone: data.phone,
      communityId: data.communityId,
      nextOfKin: data.nextOfKin as any,
      teamName: data.teamName ?? null,
      userId: user.id,
      sports: {
        create: data.sports.map((s: any) => {
          if (typeof s === "string") {
            return { sportId: s };
          }
          return {
            sportId: s.sportId,
            notes: s.notes && s.notes.trim().length > 0 ? s.notes.trim() : null,
          };
        }),
      },
    };

    if (data.notes !== undefined) {
      (participantData as any).notes =
        data.notes && data.notes.trim().length > 0 ? data.notes.trim() : null;
    }

    const participant = await prisma.participant.create({
      data: participantData,
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
    if (createdUserId) {
      try {
        await prisma.user.delete({
          where: { id: createdUserId },
        });
      } catch {
        // Ignore cleanup errors
      }
    }

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
    }) as any;

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

    // If accepting and there are pending sports, apply them
    let updateData: any = { status: status as ParticipantStatus };
    
    if (status === "accepted" && participant.pendingSports) {
      const pendingSports = participant.pendingSports as any[];
      
      // Delete existing sports
      await prisma.participantSport.deleteMany({
        where: { participantId: participant.id },
      });

      // Create new sports from pendingSports (handle both string IDs and objects)
      if (pendingSports.length > 0) {
        await prisma.participantSport.createMany({
          data: pendingSports.map((s: any) => {
            if (typeof s === "string") {
              return {
                participantId: participant.id,
                sportId: s,
              };
            }
            return {
              participantId: participant.id,
              sportId: s.sportId,
              notes: s.notes && s.notes.trim().length > 0 ? s.notes.trim() : null,
            };
          }),
        });
      }

      // Clear pendingSports
      updateData.pendingSports = null;
    } else if (status === "rejected" && participant.pendingSports) {
      // Clear pendingSports on rejection
      updateData.pendingSports = null;
    }

    const updated = await prisma.participant.update({
      where: { id },
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

// Helper function to check if profile updates are frozen
async function isProfileFrozen(): Promise<{ frozen: boolean; freezeDate: Date | null }> {
  const settings = await prisma.settings.findFirst();
  if (!settings) {
    return { frozen: false, freezeDate: null };
  }
  const profileFreezeDate = (settings as any).profileFreezeDate;
  if (!profileFreezeDate) {
    return { frozen: false, freezeDate: null };
  }
  const now = new Date();
  const freezeDate = new Date(profileFreezeDate);
  // Set time to end of day for freeze date
  freezeDate.setHours(23, 59, 59, 999);
  return { frozen: now > freezeDate, freezeDate: profileFreezeDate };
}

// Update participant profile details
router.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if profile updates are frozen
    const freezeCheck = await isProfileFrozen();
    if (freezeCheck.frozen) {
      return res.status(403).json({ 
        error: "Profile updates are frozen", 
        message: `Profile updates are no longer allowed after ${freezeCheck.freezeDate ? new Date(freezeCheck.freezeDate).toLocaleDateString() : 'the freeze date'}. Please contact an administrator if you need to make changes.` 
      });
    }

    const updateSchema = z.object({
      firstName: z.string().min(1).optional(),
      middleName: z.string().optional().nullable(),
      lastName: z.string().min(1).optional(),
      phone: z.string().min(1).optional(),
      nextOfKin: z.object({
        firstName: z.string().min(1),
        middleName: z.string().optional().nullable(),
        lastName: z.string().min(1),
        phone: z.string().min(1),
      }).optional(),
      teamName: z.string().optional().nullable(),
      notes: z.string().max(500).optional().nullable(),
    });

    const data = updateSchema.parse(req.body);

    const participant = await prisma.participant.findUnique({
      where: { userId: req.user!.id },
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
    if (data.notes !== undefined) {
      updateData.notes = data.notes && data.notes.trim().length > 0 ? data.notes.trim() : null;
    }

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
    // Check if profile updates are frozen
    const freezeCheck = await isProfileFrozen();
    if (freezeCheck.frozen) {
      return res.status(403).json({ 
        error: "Sports selection updates are frozen", 
        message: `Sports selection updates are no longer allowed after ${freezeCheck.freezeDate ? new Date(freezeCheck.freezeDate).toLocaleDateString() : 'the freeze date'}. Please contact an administrator if you need to make changes.` 
      });
    }

    const { sports } = req.body;

    if (!Array.isArray(sports)) {
      return res.status(400).json({ error: "sports must be an array" });
    }

    // Normalize sports array - extract sportIds for validation
    const sportIds = sports.map((s: any) => typeof s === "string" ? s : s.sportId);

    const participant = await prisma.participant.findUnique({
      where: { userId: req.user!.id },
      include: {
        sports: true,
      },
    });

    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    // Check if sports have actually changed
    const currentSportIds = participant.sports.map((ps: any) => ps.sportId).sort();
    const newSportIds = [...sportIds].sort();
    const sportsChanged = JSON.stringify(currentSportIds) !== JSON.stringify(newSportIds);

    if (!sportsChanged) {
      // No change, return current participant
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
      return res.json(updated);
    }

    // If participant was previously accepted, set status to pending and store new sports in pendingSports
    // If already pending, just update pendingSports with the latest selection
    const updateData: any = {
      pendingSports: sports, // Store full sports array with notes
    };

    // Only set status to pending if it was previously accepted
    if (participant.status === "accepted") {
      updateData.status = "pending";
    }

    await prisma.participant.update({
      where: { id: participant.id },
      data: updateData,
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

// Export participants
router.get("/export/:format", authenticate, requireRole("admin", "community_admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { format } = req.params;
    if (!["csv", "excel"].includes(format)) {
      return res.status(400).json({ error: "Invalid format. Use 'csv' or 'excel'" });
    }

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
    let filteredParticipants = participants;
    if (req.user!.role === "sports_admin" && req.user!.sportId) {
      filteredParticipants = participants.filter((p: any) => 
        p.sports.some((ps: any) => ps.sportId === req.user!.sportId)
      );
    }

    const exportData = filteredParticipants.map((p: any) => {
      const sportsList = p.sports.map((ps: any) => {
        const sport = ps.sport;
        if (sport.parentId) {
          const parent = p.sports.find((ps2: any) => ps2.sport.id === sport.parentId)?.sport;
          return parent ? `${parent.name} - ${sport.name}` : sport.name;
        }
        return sport.name;
      }).join(", ");

      const nextOfKin = p.nextOfKin as any;
      return {
        id: p.id,
        firstName: p.firstName,
        middleName: p.middleName || "",
        lastName: p.lastName,
        gender: p.gender,
        dob: p.dob.toISOString().split("T")[0],
        email: p.email,
        phone: p.phone,
        community: p.community?.name || "-",
        sports: sportsList || "-",
        teamName: p.teamName || "",
        status: p.status,
        nextOfKinFirstName: nextOfKin?.firstName || "",
        nextOfKinMiddleName: nextOfKin?.middleName || "",
        nextOfKinLastName: nextOfKin?.lastName || "",
        nextOfKinPhone: nextOfKin?.phone || "",
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    const headers = [
      "id", "firstName", "middleName", "lastName", "gender", "dob", "email", "phone",
      "community", "sports", "teamName", "status",
      "nextOfKinFirstName", "nextOfKinMiddleName", "nextOfKinLastName", "nextOfKinPhone",
      "createdAt", "updatedAt"
    ];
    
    const filename = req.user!.role === "community_admin" 
      ? `participants-community-${req.user!.communityId}`
      : req.user!.role === "sports_admin"
      ? `participants-sport-${req.user!.sportId}`
      : "participants";
    
    sendExport(res, exportData, headers, { filename, format: format as "csv" | "excel" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to export participants" });
  }
});

export default router;


