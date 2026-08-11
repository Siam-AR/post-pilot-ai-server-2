import { Router, Response } from "express";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middlewares/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = Router();

// 1. GET ALL IDEAS (Public)
router.get("/", async (req, res: Response) => {
  try {
    const { userId, categoryId, status } = req.query;
    const where: any = { isDeleted: false };

    if (userId) where.userId = String(userId);
    if (categoryId) where.categoryId = String(categoryId);
    if (status) where.status = String(status);

    const ideas = await prisma.idea.findMany({
      where,
      include: { user: true, category: true },
    });

    return res.json({ success: true, message: "Ideas retrieved", data: ideas });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ideas",
      error: error.message,
    });
  }
});

// 2. GET IDEA BY ID (Public)
router.get("/:id", async (req, res: Response) => {
  try {
    const id = req.params.id as string;
    const idea = await prisma.idea.findFirst({
      where: { id, isDeleted: false },
      include: { user: true, category: true },
    });

    if (!idea) {
      return res
        .status(404)
        .json({ success: false, message: "Idea not found", data: null });
    }

    return res.json({ success: true, message: "Idea retrieved", data: idea });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve idea",
      error: error.message,
    });
  }
});

// Protect all write routes below
router.use(authenticateToken);

// 3. CREATE IDEA (Protected)
router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      shortDescription,
      detailedDescription,
      targetAudience,
      estimatedBudget,
      categoryId,
      status,
    } = req.body;
    const userId = req.user?.id;

    if (
      !userId ||
      !title ||
      !shortDescription ||
      !detailedDescription ||
      !categoryId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required idea fields",
        data: null,
      });
    }

    const idea = await prisma.idea.create({
      data: {
        title,
        shortDescription,
        detailedDescription,
        targetAudience,
        estimatedBudget: estimatedBudget ? Number(estimatedBudget) : undefined,
        categoryId,
        userId,
        status: status || undefined,
      },
    });

    return res
      .status(201)
      .json({ success: true, message: "Idea created", data: idea });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to create idea",
      error: error.message,
    });
  }
});

// 4. UPDATE IDEA (Protected)
router.patch("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const idea = await prisma.idea.findFirst({
      where: { id, isDeleted: false },
    });

    if (!idea) {
      return res
        .status(404)
        .json({ success: false, message: "Idea not found", data: null });
    }

    const updated = await prisma.idea.update({
      where: { id },
      data,
    });

    return res.json({ success: true, message: "Idea updated", data: updated });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to update idea",
      error: error.message,
    });
  }
});

// 5. DELETE IDEA (Protected - Soft or Permanent)
router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const permanent = req.query.permanent === "true";

    if (permanent) {
      await prisma.idea.deleteMany({ where: { id } });
      return res.json({
        success: true,
        message: "Idea permanently deleted",
        data: null,
      });
    }

    const idea = await prisma.idea.updateMany({
      where: { id, isDeleted: false },
      data: { isDeleted: true },
    });

    if (idea.count === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Idea not found", data: null });
    }

    return res.json({
      success: true,
      message: "Idea soft deleted",
      data: null,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete idea",
      error: error.message,
    });
  }
});

export default router;