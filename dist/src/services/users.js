import { Router } from "express";
import { authenticateToken, } from "@/middlewares/auth.middleware";
import prisma from "@/lib/prisma";
const router = Router();
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Admin access required",
            data: null,
        });
    }
    next();
};
router.use(authenticateToken, requireAdmin);
router.get("/", async (_req, res) => {
    const users = await prisma.user.findMany({
        where: { isDeleted: false },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    res.json({ success: true, message: "Users retrieved", data: users });
});
router.get("/:id", async (req, res) => {
    const user = await prisma.user.findFirst({
        where: { id: req.params.id, isDeleted: false },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        return res
            .status(404)
            .json({ success: false, message: "User not found", data: null });
    }
    res.json({ success: true, message: "User retrieved", data: user });
});
router.post("/", async (req, res) => {
    const { name, email, password, image, role } = req.body;
    if (!name || !email || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Missing required fields", data: null });
    }
    try {
        const user = await prisma.user.create({
            data: { name, email, password, image, role },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res
            .status(201)
            .json({ success: true, message: "User created", data: user });
    }
    catch (error) {
        if (error.code === "P2002") {
            return res
                .status(409)
                .json({ success: false, message: "Email already exists", data: null });
        }
        return res
            .status(500)
            .json({ success: false, message: "Failed to create user", data: null });
    }
});
router.patch("/:id", async (req, res) => {
    const { name, email, image, role } = req.body;
    const user = await prisma.user.updateMany({
        where: { id: req.params.id, isDeleted: false },
        data: { name, email, image, role },
    });
    if (user.count === 0) {
        return res
            .status(404)
            .json({ success: false, message: "User not found", data: null });
    }
    res.json({ success: true, message: "User updated", data: null });
});
router.delete("/:id", async (req, res) => {
    const permanent = req.query.permanent === "true";
    if (permanent) {
        await prisma.user.deleteMany({ where: { id: req.params.id } });
        return res.json({
            success: true,
            message: "User permanently deleted",
            data: null,
        });
    }
    const user = await prisma.user.updateMany({
        where: { id: req.params.id, isDeleted: false },
        data: { isDeleted: true },
    });
    if (user.count === 0) {
        return res
            .status(404)
            .json({ success: false, message: "User not found", data: null });
    }
    res.json({ success: true, message: "User soft deleted", data: null });
});
export default router;
