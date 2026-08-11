import { Router } from "express";
import { authenticateToken, } from "@/middlewares/auth.middleware";
import prisma from "@/lib/prisma";
const router = Router();
router.use(authenticateToken);
router.get("/", async (req, res) => {
    const where = { isDeleted: false };
    if (req.user?.id) {
        where.userId = req.user.id;
    }
    const posts = await prisma.post.findMany({ where });
    res.json({ success: true, message: "Posts retrieved", data: posts });
});
router.get("/:id", async (req, res) => {
    const post = await prisma.post.findFirst({
        where: { id: req.params.id, isDeleted: false },
    });
    if (!post) {
        return res
            .status(404)
            .json({ success: false, message: "Post not found", data: null });
    }
    res.json({ success: true, message: "Post retrieved", data: post });
});
router.post("/", async (req, res) => {
    const { title, shortDescription, generatedContent, platform, tone, length, imageUrl, status, } = req.body;
    const userId = req.user?.id;
    if (!userId || !title || !generatedContent || !platform || !tone || !length) {
        return res
            .status(400)
            .json({
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
    res.status(201).json({ success: true, message: "Post created", data: post });
});
router.patch("/:id", async (req, res) => {
    const post = await prisma.post.findFirst({
        where: { id: req.params.id, isDeleted: false },
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
        where: { id: req.params.id },
        data: req.body,
    });
    res.json({ success: true, message: "Post updated", data: updated });
});
router.delete("/:id", async (req, res) => {
    const post = await prisma.post.findFirst({
        where: { id: req.params.id, isDeleted: false },
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
    const permanent = req.query.permanent === "true";
    if (permanent) {
        await prisma.post.deleteMany({ where: { id: req.params.id } });
        return res.json({
            success: true,
            message: "Post permanently deleted",
            data: null,
        });
    }
    await prisma.post.update({
        where: { id: req.params.id },
        data: { isDeleted: true },
    });
    res.json({ success: true, message: "Post soft deleted", data: null });
});
export default router;
