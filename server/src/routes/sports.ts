import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { SportType, Gender } from "@prisma/client";
import { hashPassword } from "../utils/password";
import { sendExport } from "../utils/export";

const router = Router();

const createSportSchema = z.object({
  name: z.string().min(1),
  active: z.boolean().optional(),
  type: z.enum(["individual", "team"]),
  requiresTeamName: z.boolean().optional(),
  parentId: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  timings: z.string().optional().nullable(),
  date: z.string().or(z.date()).optional().nullable(),
  gender: z.enum(["male", "female", "mixed"]).optional().nullable(),
  ageLimitMin: z.number().optional(),
  ageLimitMax: z.number().optional(),
  rules: z.string().optional().nullable(),
  adminEmail: z.string().email().optional().nullable(),
  adminPassword: z.string().optional().nullable(),
  incompatibleSportIds: z.array(z.string()).optional(),
});

// List all sports
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const sports = await prisma.sport.findMany({
      include: {
        incompatibleWith: {
          include: {
            incompatibleSport: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      } as any,
      orderBy: { name: "asc" },
    });

    res.json(sports);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list sports" });
  }
});

// List sports as tree (parent with children)
router.get("/tree", async (req: AuthRequest, res: Response) => {
  try {
    const allSports = await prisma.sport.findMany({
      orderBy: { name: "asc" },
    });

    const parents = allSports.filter((s) => !s.parentId);
    const tree = parents.map((parent) => ({
      parent,
      children: allSports.filter((s) => s.parentId === parent.id),
    }));

    res.json(tree);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list sports tree" });
  }
});

// Get subsports
router.get("/subsports/:parentId", async (req: AuthRequest, res: Response) => {
  try {
    const { parentId } = req.params;

    const subsports = await prisma.sport.findMany({
      where: { parentId },
      orderBy: { name: "asc" },
    });

    res.json(subsports);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get subsports" });
  }
});

// Get sport by ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sport = await prisma.sport.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        incompatibleWith: {
          include: {
            incompatibleSport: true,
          },
        },
      } as any,
    });

    if (!sport) {
      return res.status(404).json({ error: "Sport not found" });
    }

    res.json(sport);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get sport" });
  }
});

// Create sport
router.post("/", authenticate, requireRole("admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const data = createSportSchema.parse(req.body);

    // Check if adminEmail already exists (if provided)
    if (data.adminEmail) {
      const existingAdmin = await prisma.sport.findFirst({
        where: { adminEmail: data.adminEmail } as any,
      });
      if (existingAdmin) {
        return res.status(409).json({ error: "A sport with this admin email already exists" });
      }
    }

    // Parse date if provided
    let date: Date | undefined;
    if (data.date) {
      date = typeof data.date === "string" ? new Date(data.date) : data.date;
    }

    // Hash admin password if provided
    let hashedAdminPassword: string | undefined;
    if (data.adminPassword) {
      hashedAdminPassword = await hashPassword(data.adminPassword);
    }

    const sport = await prisma.sport.create({
      data: {
        name: data.name,
        active: data.active ?? true,
        type: data.type as SportType,
        requiresTeamName: data.requiresTeamName ?? false,
        parentId: data.parentId,
        venue: data.venue,
        timings: data.timings,
        date,
        gender: data.gender as Gender | null,
        ageLimitMin: data.ageLimitMin,
        ageLimitMax: data.ageLimitMax,
        rules: data.rules,
        adminEmail: data.adminEmail || null,
        adminPassword: hashedAdminPassword || null,
        incompatibleWith: data.incompatibleSportIds ? {
          create: data.incompatibleSportIds.map((incompatibleId) => ({
            incompatibleSportId: incompatibleId,
          })),
        } : undefined,
      } as any,
      include: {
        incompatibleWith: {
          include: {
            incompatibleSport: true,
          },
        },
      } as any,
    });

    res.status(201).json(sport);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Failed to create sport" });
  }
});

// Update sport
router.patch("/:id", authenticate, requireRole("admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createSportSchema.partial().parse(req.body);

    // Parse date if provided
    let date: Date | null | undefined;
    if (data.date !== undefined) {
      if (data.date === null || data.date === "") {
        // Explicitly set to null to clear the date
        date = null;
      } else {
        // Parse the date string or use the Date object
        date = typeof data.date === "string" ? new Date(data.date) : data.date;
        // Validate the date
        if (isNaN(date.getTime())) {
          return res.status(400).json({ error: "Invalid date format" });
        }
      }
    }

    // Check if adminEmail already exists (if provided and different from current)
    if (data.adminEmail !== undefined) {
      const currentSport = await prisma.sport.findUnique({ where: { id }, select: { adminEmail: true } as any });
      if (data.adminEmail && data.adminEmail !== (currentSport as any)?.adminEmail) {
        const existingAdmin = await prisma.sport.findFirst({
          where: { adminEmail: data.adminEmail } as any,
        });
        if (existingAdmin) {
          return res.status(409).json({ error: "A sport with this admin email already exists" });
        }
      }
    }

    // Hash admin password if provided
    let hashedAdminPassword: string | undefined;
    if (data.adminPassword) {
      hashedAdminPassword = await hashPassword(data.adminPassword);
    }

    const updateData: any = { ...data };
    // Only include date in update if it was explicitly provided
    if (data.date !== undefined) {
      updateData.date = date;
    }
    // Remove date from updateData if it's undefined (to avoid sending it)
    if (date === undefined) {
      delete updateData.date;
    }
    // Handle adminEmail and adminPassword
    if (data.adminEmail !== undefined) {
      updateData.adminEmail = data.adminEmail || null;
    }
    if (hashedAdminPassword !== undefined) {
      updateData.adminPassword = hashedAdminPassword;
    }
    // Remove adminPassword from updateData if not provided (to avoid clearing it)
    if (data.adminPassword === undefined) {
      delete updateData.adminPassword;
    }

    // Remove incompatibleSportIds from updateData as it's not a Prisma field
    const incompatibleSportIds = updateData.incompatibleSportIds;
    delete updateData.incompatibleSportIds;

    // Handle incompatible sports
    if (incompatibleSportIds !== undefined) {
      // Delete existing incompatible sports
      await (prisma as any).sportIncompatibility.deleteMany({
        where: { sportId: id },
      });

      // Create new incompatible sports if provided
      if (incompatibleSportIds.length > 0) {
        await (prisma as any).sportIncompatibility.createMany({
          data: incompatibleSportIds.map((incompatibleId: string) => ({
            sportId: id,
            incompatibleSportId: incompatibleId,
          })),
        });
      }
    }

    const sport = await prisma.sport.update({
      where: { id },
      data: updateData,
      include: {
        incompatibleWith: {
          include: {
            incompatibleSport: true,
          },
        },
      } as any,
    });

    res.json(sport);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Sport not found" });
    }
    res.status(500).json({ error: error.message || "Failed to update sport" });
  }
});

// Delete sport
router.delete("/:id", authenticate, requireRole("admin", "sports_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Delete children first (cascade should handle this, but let's be explicit)
    await prisma.sport.deleteMany({
      where: { parentId: id },
    });

    // Delete the sport
    await prisma.sport.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Sport not found" });
    }
    res.status(500).json({ error: error.message || "Failed to delete sport" });
  }
});

// Export sports
router.get("/export/:format", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { format } = req.params;
    if (!["csv", "excel"].includes(format)) {
      return res.status(400).json({ error: "Invalid format. Use 'csv' or 'excel'" });
    }

    const sports = await prisma.sport.findMany({
      include: {
        parent: true,
      },
      orderBy: { name: "asc" },
    });

    const exportData = sports.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      requiresTeamName: s.requiresTeamName ? "Yes" : "No",
      parent: s.parent?.name || "-",
      active: s.active ? "Yes" : "No",
      venue: s.venue || "",
      timings: s.timings || "",
      date: s.date ? s.date.toISOString().split("T")[0] : "",
      gender: s.gender || "",
      ageLimitMin: s.ageLimitMin || "",
      ageLimitMax: s.ageLimitMax || "",
      rules: s.rules || "",
      adminEmail: s.adminEmail || "",
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    const headers = [
      "id", "name", "type", "requiresTeamName", "parent", "active", "venue", "timings", "date",
      "gender", "ageLimitMin", "ageLimitMax", "rules", "adminEmail", "createdAt", "updatedAt"
    ];
    sendExport(res, exportData, headers, { filename: "sports", format: format as "csv" | "excel" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to export sports" });
  }
});

export default router;



