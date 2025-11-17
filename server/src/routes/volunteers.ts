import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { Gender, Role } from "@prisma/client";
import { hashPassword } from "../utils/password";
import { sendExport } from "../utils/export";

const router = Router();

const usernameFormatSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only include letters, numbers, underscores, hyphens or dots");

const createVolunteerSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  gender: z.enum(["male", "female"]),
  dob: z.string().or(z.date()),
  email: z.string().email(),
  username: usernameFormatSchema,
  phone: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
  sportId: z.string().optional(),
});

const updateVolunteerSchema = z.object({
  username: usernameFormatSchema.optional(),
  firstName: z.string().min(1).optional(),
  middleName: z.string().optional(),
  lastName: z.string().min(1).optional(),
  gender: z.enum(["male", "female"]).optional(),
  dob: z.string().or(z.date()).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  sportId: z.string().optional().nullable(),
});

// Get my volunteer (for volunteers)
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: req.user!.id },
      include: {
        sport: true,
      },
    });

    res.json(volunteer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get volunteer" });
  }
});

// Update my volunteer profile (for volunteers to update their own profile)
router.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if profile updates are frozen
    const settings = await prisma.settings.findFirst();
    if (settings?.profileFreezeDate) {
      const now = new Date();
      const freezeDate = new Date(settings.profileFreezeDate);
      // Set time to end of day for freeze date
      freezeDate.setHours(23, 59, 59, 999);
      
      if (now > freezeDate) {
        return res.status(403).json({ 
          error: "Profile updates are frozen", 
          message: `Profile updates are no longer allowed after ${new Date(settings.profileFreezeDate).toLocaleDateString()}. Please contact an administrator if you need to make changes.` 
        });
      }
    }

    const updateSchema = z.object({
      firstName: z.string().min(1).optional(),
      middleName: z.string().optional().nullable(),
      lastName: z.string().min(1).optional(),
      phone: z.string().min(1).optional(),
    });

    const data = updateSchema.parse(req.body);

    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: req.user!.id },
    });

    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.middleName !== undefined) updateData.middleName = data.middleName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const updated = await prisma.volunteer.update({
      where: { id: volunteer.id },
      data: updateData,
      include: {
        sport: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Failed to update volunteer profile" });
  }
});

// Update my volunteer sport (for volunteers to update their own sport)
router.patch("/me/sport", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if profile updates are frozen
    const settings = await prisma.settings.findFirst();
    if (settings?.profileFreezeDate) {
      const now = new Date();
      const freezeDate = new Date(settings.profileFreezeDate);
      // Set time to end of day for freeze date
      freezeDate.setHours(23, 59, 59, 999);
      
      if (now > freezeDate) {
        return res.status(403).json({ 
          error: "Sports selection updates are frozen", 
          message: `Sports selection updates are no longer allowed after ${new Date(settings.profileFreezeDate).toLocaleDateString()}. Please contact an administrator if you need to make changes.` 
        });
      }
    }

    const { sportId } = req.body;

    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: req.user!.id },
    });

    if (!volunteer) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    const updated = await prisma.volunteer.update({
      where: { id: volunteer.id },
      data: { sportId: sportId || null },
      include: {
        sport: true,
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to update volunteer sport" });
  }
});

// List volunteers
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sportId } = req.query;

    const where: any = {};
    if (sportId) {
      where.sportId = sportId as string;
    }

    const volunteers = await prisma.volunteer.findMany({
      where,
      include: {
        sport: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(volunteers);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list volunteers" });
  }
});

// Create volunteer
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = createVolunteerSchema.parse(req.body);

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Check if email already exists in Volunteer table
    const existingVolunteer = await prisma.volunteer.findUnique({
      where: { email: data.email },
    });

    if (existingVolunteer) {
      return res.status(409).json({ error: "Volunteer with this email already exists" });
    }

    // Check if email already exists in User table
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Parse date
    const dob = typeof data.dob === "string" ? new Date(data.dob) : data.dob;

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user account first
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: Role.volunteer,
      },
    });

    // Create volunteer
    const volunteer = await prisma.volunteer.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        gender: data.gender as Gender,
        dob,
        email: data.email,
        phone: data.phone,
        sportId: data.sportId,
        userId: user.id,
      },
      include: {
        sport: true,
      },
    });

    res.status(201).json(volunteer);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    // If user creation succeeded but volunteer creation failed, clean up user
    if (error.code === "P2002") {
      const email = req.body?.email;
      if (email) {
        try {
          await prisma.user.deleteMany({
            where: { email },
          });
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }
    res.status(500).json({ error: error.message || "Failed to create volunteer" });
  }
});

// Update volunteer
router.patch("/:id", authenticate, requireRole("admin", "volunteer_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = updateVolunteerSchema.parse(req.body);

    const volunteerRecord = await prisma.volunteer.findUnique({
      where: { id },
      select: { userId: true, email: true },
    });

    if (!volunteerRecord) {
      return res.status(404).json({ error: "Volunteer not found" });
    }

    if (updateData.username) {
      const trimmedUsername = updateData.username.trim();
      const existingUser = await prisma.user.findUnique({
        where: { username: trimmedUsername },
        select: { id: true },
      });
      if (existingUser && existingUser.id !== volunteerRecord.userId) {
        return res.status(409).json({ error: "Username already exists" });
      }
      updateData.username = trimmedUsername;
    }

    // Parse date if provided
    if (updateData.dob) {
      updateData.dob = typeof updateData.dob === "string" ? new Date(updateData.dob) : updateData.dob;
    }

    const { password: newPassword, username, ...volunteerData } = updateData as any;

    const volunteer = await prisma.volunteer.update({
      where: { id },
      data: volunteerData,
      include: {
        sport: true,
      },
    });

    const userUpdateData: any = {};
    if (username !== undefined) {
      userUpdateData.username = username;
    }
    if (updateData.email !== undefined) {
      userUpdateData.email = updateData.email;
    }
    if (newPassword) {
      userUpdateData.password = await hashPassword(newPassword);
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: volunteerRecord.userId },
        data: userUpdateData,
      });
    }

    res.json(volunteer);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error.message === "Username already exists") {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || "Failed to update volunteer" });
  }
});

// Export volunteers
router.get("/export/:format", authenticate, requireRole("admin", "volunteer_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { format } = req.params;
    if (!["csv", "excel"].includes(format)) {
      return res.status(400).json({ error: "Invalid format. Use 'csv' or 'excel'" });
    }

    const { sportId } = req.query;
    const where: any = {};
    if (sportId) {
      where.sportId = sportId as string;
    }

    const volunteers = await prisma.volunteer.findMany({
      where,
      include: {
        sport: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const exportData = volunteers.map((v) => {
      let sportName = "-";
      if (v.sport) {
        if (v.sport.parentId) {
          // We'd need to fetch parent, but for now just use sport name
          sportName = v.sport.name;
        } else {
          sportName = v.sport.name;
        }
      }
      return {
        id: v.id,
        firstName: v.firstName,
        middleName: v.middleName || "",
        lastName: v.lastName,
        gender: v.gender,
        dob: v.dob.toISOString().split("T")[0],
        email: v.email,
        phone: v.phone,
        sport: sportName,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      };
    });

    const headers = ["id", "firstName", "middleName", "lastName", "gender", "dob", "email", "phone", "sport", "createdAt", "updatedAt"];
    sendExport(res, exportData, headers, { filename: "volunteers", format: format as "csv" | "excel" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to export volunteers" });
  }
});

export default router;



