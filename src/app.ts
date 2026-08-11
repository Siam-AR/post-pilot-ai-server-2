import express from "express";
import cors from "cors";
import path from "node:path";
import routes from "./routes/index.js";
import authRouter from "./services/auth.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);
app.use("/auth", authRouter);

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
