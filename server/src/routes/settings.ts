import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";

const router = Router();

const updateSettingsSchema = z.object({
  ageCalculatorDate: z.string().or(z.date()),
});

// Get settings
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst();

    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          ageCalculatorDate: new Date("2026-11-01"),
        },
      });
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get settings" });
  }
});

// Update settings
router.patch("/", authenticate, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateSettingsSchema.parse(req.body);

    let settings = await prisma.settings.findFirst();

    const ageCalculatorDate = typeof data.ageCalculatorDate === "string" 
      ? new Date(data.ageCalculatorDate) 
      : data.ageCalculatorDate;

    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: { ageCalculatorDate },
      });
    } else {
      settings = await prisma.settings.create({
        data: { ageCalculatorDate },
      });
    }

    res.json(settings);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Failed to update settings" });
  }
});

export default router;



