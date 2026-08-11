import express from "express";
import cors from "cors";
import routes from "@/routes/index.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", routes);
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        data: null,
    });
});
export default app;
