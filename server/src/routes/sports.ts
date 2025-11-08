import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { SportType, Gender } from "@prisma/client";

const router = Router();

const createSportSchema = z.object({
  name: z.string().min(1),
  active: z.boolean().optional(),
  type: z.enum(["individual", "team"]),
  requiresTeamName: z.boolean().optional(),
  parentId: z.string().uuid().optional(),
  venue: z.string().optional(),
  timings: z.string().optional(),
  date: z.string().or(z.date()).optional(),
  gender: z.enum(["male", "female", "mixed"]).optional().nullable(),
  ageLimitMin: z.number().optional(),
  ageLimitMax: z.number().optional(),
  rules: z.string().optional(),
});

// List all sports
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const sports = await prisma.sport.findMany({
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
      },
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

    // Parse date if provided
    let date: Date | undefined;
    if (data.date) {
      date = typeof data.date === "string" ? new Date(data.date) : data.date;
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
      },
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
    let date: Date | undefined;
    if (data.date !== undefined) {
      date = data.date ? (typeof data.date === "string" ? new Date(data.date) : data.date) : null;
    }

    const updateData: any = { ...data };
    if (date !== undefined) {
      updateData.date = date;
    }

    const sport = await prisma.sport.update({
      where: { id },
      data: updateData,
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

export default router;



