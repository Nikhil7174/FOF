import { Router, Response } from "express";
import { prisma } from "../index";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// List calendar items
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
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
    // Placeholder implementation
    res.json([
      { sportId: "1", url: "https://example.com/draws/football.pdf" },
      { sportId: "2", url: "https://example.com/draws/basketball.pdf" },
    ]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list draws" });
  }
});

export default router;



