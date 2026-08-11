import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";
// Force load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const databaseUrl = process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres.lztcqredgumxwcpcyksz:Ss%2A224865317999@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: databaseUrl,
    },
});
