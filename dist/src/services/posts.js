import { Router } from "express";
import { authenticateToken, } from "../middlewares/auth.middleware.js";
import prisma from "../lib/prisma.js";
const router = Router();
// Apply auth middleware for protected endpoints
router.use(authenticateToken);
// 1. GET MY POSTS (Must be defined BEFORE /:id)
router.get("/my", async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            where: {
                userId: req.user.id,
                isDeleted: false,
            },
            orderBy: { createdAt: "desc" },
        });
        return res.json({
            success: true,
            message: "Posts retrieved",
            data: posts,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve posts",
            error: error.message,
        });
    }
});
// 2. GET ALL USER POSTS
router.get("/", async (req, res) => {
    try {
        const where = { isDeleted: false };
        if (req.user?.id) {
            where.userId = req.user.id;
        }
        const posts = await prisma.post.findMany({ where });
        return res.json({ success: true, message: "Posts retrieved", data: posts });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve posts",
            error: error.message,
        });
    }
});
// 3. GET POST BY ID
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const post = await prisma.post.findFirst({
            where: { id, isDeleted: false },
        });
        if (!post) {
            return res
                .status(404)
                .json({ success: false, message: "Post not found", data: null });
        }
        return res.json({ success: true, message: "Post retrieved", data: post });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve post",
            error: error.message,
        });
    }
});
// 4. CREATE POST
router.post("/", async (req, res) => {
    try {
        const { title, shortDescription, generatedContent, platform, tone, length, imageUrl, status, } = req.body;
        const userId = req.user?.id;
        if (!userId || !title || !generatedContent || !platform || !tone || !length) {
            return res.status(400).json({
                success: false,
                message: "Missing required post fields",
                data: null,
            });
        }
        const post = await prisma.post.create({
            data: {
                title,
                shortDescription,
                generatedContent,
                platform,
                tone,
                length,
                imageUrl,
                status,
                userId,
            },
        });
        return res
            .status(201)
            .json({ success: true, message: "Post created", data: post });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create post",
            error: error.message,
        });
    }
});
// 5. UPDATE POST
router.patch("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const post = await prisma.post.findFirst({
            where: { id, isDeleted: false },
        });
        if (!post) {
            return res
                .status(404)
                .json({ success: false, message: "Post not found", data: null });
        }
        if (post.userId !== req.user?.id) {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden", data: null });
        }
        const updated = await prisma.post.update({
            where: { id },
            data: req.body,
        });
        return res.json({ success: true, message: "Post updated", data: updated });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update post",
            error: error.message,
        });
    }
});
// 6. DELETE POST (SOFT OR PERMANENT)
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const permanent = req.query.permanent === "true";
        const post = await prisma.post.findFirst({
            where: { id },
        });
        if (!post) {
            return res
                .status(404)
                .json({ success: false, message: "Post not found", data: null });
        }
        if (post.userId !== req.user?.id) {
            return res
                .status(403)
                .json({ success: false, message: "Forbidden", data: null });
        }
        if (permanent) {
            await prisma.post.delete({ where: { id } });
            return res.json({
                success: true,
                message: "Post permanently deleted",
                data: null,
            });
        }
        await prisma.post.update({
            where: { id },
            data: { isDeleted: true },
        });
        return res.json({
            success: true,
            message: "Post soft deleted",
            data: null,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete post",
            error: error.message,
        });
    }
});
export default router;
