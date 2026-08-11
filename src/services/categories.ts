import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    where: { isDeleted: false },
  });
  res.json({
    success: true,
    message: "Categories retrieved",
    data: categories,
  });
});

router.get("/:id", async (req, res) => {
  const category = await prisma.category.findFirst({
    where: { id: req.params.id, isDeleted: false },
  });
  if (!category) {
    return res
      .status(404)
      .json({ success: false, message: "Category not found", data: null });
  }
  res.json({ success: true, message: "Category retrieved", data: category });
});

router.use(authenticateToken);

router.post("/", async (req, res) => {
  const { name, slug, description } = req.body;

  if (!name || !slug) {
    return res.status(400).json({
      success: false,
      message: "Name and slug are required",
      data: null,
    });
  }

  try {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ slug }, { name }],
        isDeleted: false,
      },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Category already exists",
        data: existing,
      });
    }

    const category = await prisma.category.create({
      data: { name, slug, description },
    });
    return res
      .status(201)
      .json({ success: true, message: "Category created", data: category });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Category slug or name already exists",
        data: null,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      data: null,
    });
  }
});

router.patch("/:id", async (req, res) => {
  const { name, slug, description } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug, description },
    });
    res.json({ success: true, message: "Category updated", data: category });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Category slug or name already exists",
        data: null,
      });
    }
    return res
      .status(404)
      .json({ success: false, message: "Category not found", data: null });
  }
});

router.delete("/:id", async (req, res) => {
  const permanent = req.query.permanent === "true";

  if (permanent) {
    await prisma.category.deleteMany({ where: { id: req.params.id } });
    return res.json({
      success: true,
      message: "Category permanently deleted",
      data: null,
    });
  }

  const category = await prisma.category.updateMany({
    where: { id: req.params.id, isDeleted: false },
    data: { isDeleted: true },
  });

  if (category.count === 0) {
    return res
      .status(404)
      .json({ success: false, message: "Category not found", data: null });
  }

  res.json({ success: true, message: "Category soft deleted", data: null });
});

export default router;
