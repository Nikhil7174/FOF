import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { hashPassword } from "../utils/password";

const router = Router();

const createCommunitySchema = z.object({
  name: z.string().min(1),
  active: z.boolean().optional(),
  contactPerson: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  adminEmail: z.string().email().optional().nullable(),
  adminPassword: z.string().optional().nullable(),
});

// List communities (public - needed for login page)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const communities = await prisma.community.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        active: true,
        contactPerson: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(communities);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list communities" });
  }
});

// Get community by ID
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const community = await prisma.community.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        active: true,
        contactPerson: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    res.json(community);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get community" });
  }
});

// Create community
router.post("/", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const data = createCommunitySchema.parse(req.body);

    // Check if name, email, or adminEmail already exists
    const existing = await prisma.community.findFirst({
      where: {
        OR: [
          { name: data.name }, 
          { email: data.email },
          ...(data.adminEmail ? [{ adminEmail: data.adminEmail } as any] : [])
        ],
      } as any,
    });

    if (existing) {
      return res.status(409).json({ error: "Community with this name, email, or admin email already exists" });
    }

    // Hash passwords if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await hashPassword(data.password);
    }

    let hashedAdminPassword: string | undefined;
    if (data.adminPassword) {
      hashedAdminPassword = await hashPassword(data.adminPassword);
    }

    const community = await prisma.community.create({
      data: {
        name: data.name,
        active: data.active ?? true,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        adminEmail: data.adminEmail || null,
        adminPassword: hashedAdminPassword || null,
      },
      select: {
        id: true,
        name: true,
        active: true,
        contactPerson: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(community);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Failed to create community" });
  }
});

// Update community
router.patch("/:id", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createCommunitySchema.partial().parse(req.body);

    // Hash passwords if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await hashPassword(data.password);
    }

    let hashedAdminPassword: string | undefined;
    if (data.adminPassword) {
      hashedAdminPassword = await hashPassword(data.adminPassword);
    }

    const updateData: any = { ...data };
    if (hashedPassword !== undefined) {
      updateData.password = hashedPassword;
    }
    if (hashedAdminPassword !== undefined) {
      updateData.adminPassword = hashedAdminPassword;
    }
    // Handle adminEmail separately (can be set to null to clear it)
    if (data.adminEmail !== undefined) {
      updateData.adminEmail = data.adminEmail || null;
    }

    const community = await prisma.community.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        active: true,
        contactPerson: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(community);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Community not found" });
    }
    res.status(500).json({ error: error.message || "Failed to update community" });
  }
});

// Delete community
router.delete("/:id", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.community.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Community not found" });
    }
    res.status(500).json({ error: error.message || "Failed to delete community" });
  }
});

export default router;


