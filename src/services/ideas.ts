import { Router } from "express";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../middlewares/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const { userId, categoryId, status } = req.query;
  const where: any = { isDeleted: false };

  if (userId) where.userId = String(userId);
  if (categoryId) where.categoryId = String(categoryId);
  if (status) where.status = String(status);

  const ideas = await prisma.idea.findMany({
    where,
    include: { user: true, category: true },
  });

  res.json({ success: true, message: "Ideas retrieved", data: ideas });
});

router.get("/:id", async (req, res) => {
  const idea = await prisma.idea.findFirst({
    where: { id: req.params.id, isDeleted: false },
    include: { user: true, category: true },
  });

  if (!idea) {
    return res
      .status(404)
      .json({ success: false, message: "Idea not found", data: null });
  }

  res.json({ success: true, message: "Idea retrieved", data: idea });
});

router.use(authenticateToken);

router.post("/", async (req: AuthenticatedRequest, res) => {
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

  res.status(201).json({ success: true, message: "Idea created", data: idea });
});

router.patch("/:id", async (req: AuthenticatedRequest, res) => {
  const data = req.body;
  const idea = await prisma.idea.findFirst({
    where: { id: req.params.id, isDeleted: false },
  });

  if (!idea) {
    return res
      .status(404)
      .json({ success: false, message: "Idea not found", data: null });
  }

  const updated = await prisma.idea.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ success: true, message: "Idea updated", data: updated });
});

router.delete("/:id", async (req, res) => {
  const permanent = req.query.permanent === "true";

  if (permanent) {
    await prisma.idea.deleteMany({ where: { id: req.params.id } });
    return res.json({
      success: true,
      message: "Idea permanently deleted",
      data: null,
    });
  }

  const idea = await prisma.idea.updateMany({
    where: { id: req.params.id, isDeleted: false },
    data: { isDeleted: true },
  });
  if (idea.count === 0) {
    return res
      .status(404)
      .json({ success: false, message: "Idea not found", data: null });
  }

  res.json({ success: true, message: "Idea soft deleted", data: null });
});

export default router;
