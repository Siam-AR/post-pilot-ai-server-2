# Post Pilot AI Server

A TypeScript Express API server using Prisma and Supabase/Postgres for authentication, categories, ideas, and posts.

## Features

- JWT-based authentication
- CRUD endpoints for users, categories, ideas, and posts
- Soft delete with optional permanent delete via `?permanent=true`
- Prisma ORM with PostgreSQL via Supabase
- Vercel-ready serverless deployment config
- Test script for end-to-end API validation

## Requirements

- Node.js 22+ or compatible
- npm
- Supabase/Postgres database
- `DATABASE_URL` and `DIRECT_URL` in `.env.local`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with your connection details:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_TLS_REJECT_UNAUTHORIZED=0
```

> Keep `.env.local` out of version control. It is ignored by `.gitignore`.

3. Sync Prisma schema and generate the client:

```bash
npx prisma db push --accept-data-loss
npx prisma generate
```

4. Start the development server:

```bash
npm run dev
```

5. Run the API smoke tests:

```bash
npx tsx src/scripts/test-api.ts
```

## Testing

The repository includes an end-to-end smoke test script for the main API flows.

```bash
npx tsx src/scripts/test-api.ts
```

This validates:

- health endpoint
- JWT authentication
- category creation and retrieval
- idea creation, update, and delete behavior
- post creation, retrieval, and deletion
- soft delete and permanent delete flows

## Build for Production

```bash
npm run build
```

Then start the compiled server:

```bash
npm start
```

## Vercel Deployment

The project includes `vercel.json` configured for a single serverless entrypoint at `src/server.ts`.

### Recommended steps

- Ensure all environment variables are configured in Vercel
- Remove local insecure SSL override for production if possible
- Set `DATABASE_URL` to use `sslmode=verify-full` in production

## Notes

- `src/lib/prisma.ts` currently falls back to standard `PrismaClient` if `@prisma/adapter-pg` cannot initialize.
- The test script already validates authentication, category, idea, post, and delete flows.

## Scripts

- `npm run dev` — start development server
- `npm run build` — compile TypeScript
- `npm start` — run compiled server
- `npm run prisma:generate` — regenerate Prisma client
- `npm run prisma:migrate` — run Prisma migrations
