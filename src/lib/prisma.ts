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

let prisma: PrismaClient;

try {
  const pool = new pg.Pool({
    connectionString,
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

export { prisma };
export default prisma;
