import dotenv from "dotenv";
import path from "node:path";
import app from "./app.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type EnvCheck = {
  key: string;
  present: boolean;
};

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
const envChecks: EnvCheck[] = [
  { key: "JWT_SECRET", present: Boolean(process.env.JWT_SECRET) },
  { key: "DATABASE_URL or DIRECT_URL", present: Boolean(databaseUrl) },
];

const missing = envChecks
  .filter((item) => !item.present)
  .map((item) => item.key);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export const handler = app;
export default app;
