import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const signupSchema = z.object({
  role: z.enum(["community", "volunteer"]),
  username: z.string().min(1),
  password: z.string().min(1),
  communityId: z.string().optional(),
  volunteerId: z.string().optional(),
});

const sportsAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  sportId: z.string().min(1),
});

const communityAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  communityId: z.string().min(1),
});

const volunteerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        communityId: true,
        sportId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to get user" });
  }
});

// Logout (client-side token removal, but we can track it if needed)
router.post("/logout", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting here if needed
    res.json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Logout failed" });
  }
});

// Signup
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { role, username, password, communityId, volunteerId } = signupSchema.parse(req.body);

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Map role
    const userRole: Role = role === "community" ? "community_admin" : "volunteer";

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: userRole,
        communityId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        communityId: true,
        sportId: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    res.status(201).json({
      user,
      token,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Signup failed" });
  }
});

// Sports Admin Login (using adminEmail/adminPassword from Sport table)
router.post("/sports-admin/login", async (req: Request, res: Response) => {
  try {
    const { email, password, sportId } = sportsAdminLoginSchema.parse(req.body);

    // Find sport by ID and check adminEmail
    const sport = await prisma.sport.findUnique({
      where: { id: sportId },
      select: {
        id: true,
        name: true,
        adminEmail: true,
        adminPassword: true,
      },
    });

    if (!sport) {
      return res.status(401).json({ error: "Invalid sport" });
    }

    if (!sport.adminEmail || !sport.adminPassword) {
      return res.status(401).json({ error: "Admin credentials not configured for this sport" });
    }

    // Check email matches
    if (sport.adminEmail !== email) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isValid = await comparePassword(password, sport.adminPassword);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Find or create a User record for this sports admin
    let user = await prisma.user.findFirst({
      where: {
        role: "sports_admin",
        sportId: sport.id,
      },
    });

    if (!user) {
      // Create a user record for this sports admin
      const hashedPassword = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          username: `sports_admin_${sport.id}`,
          email: sport.adminEmail,
          password: hashedPassword,
          role: "sports_admin",
          sportId: sport.id,
        },
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        sportId: user.sportId,
        communityId: user.communityId,
      },
      token,
      sport: {
        id: sport.id,
        name: sport.name,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// Community Admin Login (using adminEmail/adminPassword from Community table)
router.post("/community-admin/login", async (req: Request, res: Response) => {
  try {
    const { email, password, communityId } = communityAdminLoginSchema.parse(req.body);

    // Find community by ID and check adminEmail
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        name: true,
        adminEmail: true,
        adminPassword: true,
      },
    });

    if (!community) {
      return res.status(401).json({ error: "Invalid community" });
    }

    if (!community.adminEmail || !community.adminPassword) {
      return res.status(401).json({ error: "Admin credentials not configured for this community" });
    }

    // Check email matches
    if (community.adminEmail !== email) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isValid = await comparePassword(password, community.adminPassword);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Find or create a User record for this community admin
    // First, try to find by email (in case user exists but communityId is wrong)
    let user = await prisma.user.findFirst({
      where: {
        email: community.adminEmail,
        role: "community_admin",
      },
    });

    if (user) {
      // Update communityId if it doesn't match (in case it was changed or set incorrectly)
      if (user.communityId !== community.id) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { communityId: community.id },
        });
      }
    } else {
      // Create a new user record for this community admin
      const hashedPassword = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          username: `community_admin_${community.id}`,
          email: community.adminEmail,
          password: hashedPassword,
          role: "community_admin",
          communityId: community.id,
        },
      });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        sportId: user.sportId,
        communityId: user.communityId,
      },
      token,
      community: {
        id: community.id,
        name: community.name,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

// Volunteer Login (using email and password from User table)
router.post("/volunteer/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = volunteerLoginSchema.parse(req.body);

    // Find user by email with volunteer role
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: "volunteer",
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Find volunteer record
    const volunteer = await prisma.volunteer.findUnique({
      where: { email },
      include: {
        sport: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        sportId: user.sportId,
        communityId: user.communityId,
      },
      token,
      volunteer: volunteer
        ? {
            id: volunteer.id,
            firstName: volunteer.firstName,
            middleName: volunteer.middleName,
            lastName: volunteer.lastName,
            email: volunteer.email,
            sportId: volunteer.sportId,
            sport: volunteer.sport,
          }
        : null,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    res.status(500).json({ error: error.message || "Login failed" });
  }
});

export default router;



