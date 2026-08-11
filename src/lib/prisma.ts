// import "dotenv/config";
// import pg from "pg";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "../generated/prisma/index.js";

// const pool = new pg.Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// const adapter = new PrismaPg(pool);

// export const prisma = new PrismaClient({ adapter });
// export default prisma;

import dotenv from "dotenv";
import path from "node:path";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

const connectionStringWithSsl = connectionString
  ? ensureSslModeNoVerify(connectionString)
  : connectionString;

let prisma: PrismaClient;

if (connectionStringWithSsl) {
  process.env.DATABASE_URL = connectionStringWithSsl;
  process.env.DIRECT_URL = connectionStringWithSsl;
}

try {
  const pool = new pg.Pool({
    connectionString: connectionStringWithSsl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} catch (error) {
  console.warn("Falling back to PrismaClient without adapter-pg:", error);
  prisma = new PrismaClient();
}

function ensureSslModeNoVerify(url: string) {
  if (process.env.NODE_ENV !== "production") {
    return url;
  }

  const lower = url.toLowerCase();
  if (lower.includes("sslmode=") || lower.includes("sslaccept=")) {
    return url;
  }

  return url.includes("?")
    ? `${url}&sslmode=no-verify`
    : `${url}?sslmode=no-verify`;
}

export { prisma };
export default prisma;
