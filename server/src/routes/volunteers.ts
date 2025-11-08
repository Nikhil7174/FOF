import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { Gender } from "@prisma/client";

const router = Router();

const createVolunteerSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  gender: z.enum(["male", "female"]),
  dob: z.string().or(z.date()),
  email: z.string().email(),
  phone: z.string().min(1),
  departmentId: z.string().uuid(),
  sportId: z.string().uuid().optional(),
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
        department: true,
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

    // Check if email already exists
    const existing = await prisma.volunteer.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return res.status(409).json({ error: "Volunteer with this email already exists" });
    }

    // Parse date
    const dob = typeof data.dob === "string" ? new Date(data.dob) : data.dob;

    const volunteer = await prisma.volunteer.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        gender: data.gender as Gender,
        dob,
        email: data.email,
        phone: data.phone,
        departmentId: data.departmentId,
        sportId: data.sportId,
      },
      include: {
        department: true,
        sport: true,
      },
    });

    res.status(201).json(volunteer);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
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
        department: true,
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



