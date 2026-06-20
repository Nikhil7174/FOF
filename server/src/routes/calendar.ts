import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";
import { assertSportEditAccess } from "../utils/sportAccess";

const router = Router();

const createCalendarItemSchema = z.object({
  sportId: z.string().min(1),
  date: z.string().or(z.date()),
  time: z.string().min(1),
  venue: z.string().min(1),
  type: z.string().min(1),
});

// List calendar items (public endpoint for home page)
router.get("/", async (req, res: Response) => {
  try {
    const calendarItems = await prisma.calendarItem.findMany({
      include: {
        sport: true,
      },
      orderBy: { date: "asc" },
    });

    res.json(calendarItems);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list calendar" });
  }
});

// Get calendar item by ID
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const calendarItem = await prisma.calendarItem.findUnique({
      where: { id },
      include: {
        sport: true,
      },
    });

    if (!calendarItem) {
      return res.status(404).json({ error: "Calendar item not found" });
    }

    res.json(calendarItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get calendar item" });
  }
});

// Create calendar item
router.post("/", authenticate, requireRole("admin", "sports_super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const data = createCalendarItemSchema.parse(req.body);
    assertSportEditAccess(req, data.sportId);

    let date: Date;
    if (typeof data.date === "string") {
      date = new Date(data.date);
    } else {
      date = data.date;
    }

    const sport = await prisma.sport.findUnique({
      where: { id: data.sportId },
    });

    if (!sport) {
      return res.status(404).json({ error: "Sport not found" });
    }

    const calendarItem = await prisma.calendarItem.create({
      data: {
        sportId: data.sportId,
        date,
        time: data.time,
        venue: data.venue,
        type: data.type,
      },
      include: {
        sport: true,
      },
    });

    res.status(201).json(calendarItem);
  } catch (error: any) {
    if (error.status === 403) {
      return res.status(403).json({ error: error.message || "Forbidden" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Failed to create calendar item" });
  }
});

// Update calendar item
router.patch("/:id", authenticate, requireRole("admin", "sports_super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createCalendarItemSchema.partial().parse(req.body);

    const existing = await prisma.calendarItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Calendar item not found" });
    }

    const targetSportId = data.sportId ?? existing.sportId;
    assertSportEditAccess(req, targetSportId);

    const updateData: any = { ...data };
    if (data.date !== undefined) {
      updateData.date = typeof data.date === "string" ? new Date(data.date) : data.date;
    }

    const calendarItem = await prisma.calendarItem.update({
      where: { id },
      data: updateData,
      include: {
        sport: true,
      },
    });

    res.json(calendarItem);
  } catch (error: any) {
    if (error.status === 403) {
      return res.status(403).json({ error: error.message || "Forbidden" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Calendar item not found" });
    }
    res.status(500).json({ error: error.message || "Failed to update calendar item" });
  }
});

// Delete calendar item
router.delete("/:id", authenticate, requireRole("admin", "sports_super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.calendarItem.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Calendar item not found" });
    }

    assertSportEditAccess(req, existing.sportId);

    await prisma.calendarItem.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error.status === 403) {
      return res.status(403).json({ error: error.message || "Forbidden" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Calendar item not found" });
    }
    res.status(500).json({ error: error.message || "Failed to delete calendar item" });
  }
});

// List timing (simplified calendar structure)
router.get("/timing", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const calendarItems = await prisma.calendarItem.findMany({
      select: {
        sportId: true,
        time: true,
        date: true,
        venue: true,
      },
      orderBy: { date: "asc" },
    });

    res.json(calendarItems);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list timing" });
  }
});

// List draws (placeholder - can be extended later)
router.get("/draws", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    res.json([
      { sportId: "1", url: "https://example.com/draws/football.pdf" },
      { sportId: "2", url: "https://example.com/draws/basketball.pdf" },
    ]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list draws" });
  }
});

export default router;
