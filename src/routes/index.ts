import { Router } from "express";
import authRouter from "../services/auth.js";
import userRouter from "../services/users.js";
import categoryRouter from "../services/categories.js";
import ideaRouter from "../services/ideas.js";
import postRouter from "../services/posts.js";
import aiRouter from "../services/ai.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/categories", categoryRouter);
router.use("/ideas", ideaRouter);
router.use("/posts", postRouter);
router.use("/ai", aiRouter);

export default router;
