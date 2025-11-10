import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { Gender, Role } from "@prisma/client";
import { hashPassword } from "../utils/password";

const router = Router();

const createVolunteerSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  gender: z.enum(["male", "female"]),
  dob: z.string().or(z.date()),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters"),
  sportId: z.string().optional(),
});

// Get my volunteer (for volunteers)
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true },
    });

    if (!user || !user.email) {
      return res.json(null);
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { email: user.email },
      include: {
        sport: true,
      },
    });

    res.json(volunteer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get volunteer" });
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

    // Check if email already exists in Volunteer table
    const existingVolunteer = await prisma.volunteer.findUnique({
      where: { email: data.email },
    });

    if (existingVolunteer) {
      return res.status(409).json({ error: "Volunteer with this email already exists" });
    }

    // Check if email already exists in User table
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
    const updateData = createVolunteerSchema.partial().parse(req.body);

    // Parse date if provided
    if (updateData.dob) {
      updateData.dob = typeof updateData.dob === "string" ? new Date(updateData.dob) : updateData.dob;
    }

    const volunteer = await prisma.volunteer.update({
      where: { id },
      data: updateData as any,
      include: {
        sport: true,
      },
    });

    res.json(volunteer);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Volunteer not found" });
    }
    res.status(500).json({ error: error.message || "Failed to update volunteer" });
  }
});

export default router;



