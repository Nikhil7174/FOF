import { Router, Response } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../index";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth";

const router = Router();

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const updateSettingsSchema = z.object({
  ageCalculatorDate: z.string().or(z.date()).optional(),
  profileFreezeDate: z.string().or(z.date()).nullable().optional(),
  siteTitle: z.string().nullable().optional(),
  siteIconUrl: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  heroImageUrl: z.union([z.string().url(), z.literal("")]).nullable().optional(),
  heroTitle: z.string().nullable().optional(),
  heroSubtitle: z.string().nullable().optional(),
  heroDescription: z.string().nullable().optional(),
});

// Get settings (public endpoint for home screen display)
router.get("/", async (req: any, res: Response) => {
  try {
    let settings = await prisma.settings.findFirst();

    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          ageCalculatorDate: new Date("2026-11-01"),
          profileFreezeDate: null,
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

    const updateData: any = {};
    
    if (data.ageCalculatorDate !== undefined) {
      updateData.ageCalculatorDate = typeof data.ageCalculatorDate === "string" 
        ? new Date(data.ageCalculatorDate) 
        : data.ageCalculatorDate;
    }
    
    if (data.profileFreezeDate !== undefined) {
      updateData.profileFreezeDate = data.profileFreezeDate === null || data.profileFreezeDate === "" 
        ? null 
        : (typeof data.profileFreezeDate === "string" 
          ? new Date(data.profileFreezeDate) 
          : data.profileFreezeDate);
    }

    if (data.siteTitle !== undefined) {
      updateData.siteTitle = data.siteTitle === "" ? null : data.siteTitle;
    }

    if (data.siteIconUrl !== undefined) {
      updateData.siteIconUrl = data.siteIconUrl === "" ? null : data.siteIconUrl;
    }

    if (data.heroImageUrl !== undefined) {
      updateData.heroImageUrl = data.heroImageUrl === "" ? null : data.heroImageUrl;
    }

    if (data.heroTitle !== undefined) {
      updateData.heroTitle = data.heroTitle === "" ? null : data.heroTitle;
    }

    if (data.heroSubtitle !== undefined) {
      updateData.heroSubtitle = data.heroSubtitle === "" ? null : data.heroSubtitle;
    }

    if (data.heroDescription !== undefined) {
      updateData.heroDescription = data.heroDescription === "" ? null : data.heroDescription;
    }

    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.settings.create({
        data: {
          ageCalculatorDate: updateData.ageCalculatorDate || new Date("2026-11-01"),
          profileFreezeDate: updateData.profileFreezeDate || null,
        },
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

// Upload image endpoint
router.post(
  "/upload-image",
  authenticate,
  requireRole("admin"),
  upload.single("image"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Get the base URL from the request
      const protocol = req.protocol;
      const host = req.get("host");
      const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error: any) {
      // If there's an error and a file was uploaded, delete it
      if (req.file) {
        const filePath = path.join(uploadsDir, req.file.filename);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }
      res.status(500).json({ error: error.message || "Failed to upload image" });
    }
  }
);

export default router;



