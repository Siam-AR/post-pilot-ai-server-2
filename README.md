# Post Pilot AI Server

Backend for Post Pilot AI: TypeScript + Express + Prisma + PostgreSQL.

## Live Links

- Live backend API: https://post-pilot-ai-server-2.vercel.app/api/v1
- Live frontend: https://post-pilot-ai-client-2.vercel.app

## Features

- JWT authentication with bcrypt password hashing
- REST CRUD APIs for users, categories, ideas, and posts
- AI generation endpoint using Groq SDK
- Soft delete support with optional `?permanent=true`
- Prisma ORM with PostgreSQL/Supabase compatibility
- Vercel-ready serverless deployment config
- API smoke test script

## Requirements

- Node.js 22+ or compatible
- npm
- PostgreSQL / Supabase / NeonDB database
- `DATABASE_URL` and `DIRECT_URL` in `.env.local`
- `JWT_SECRET`
- `GROQ_API_KEY`

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
GROQ_API_KEY=your_groq_api_key
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

## API Response Format

All API responses use this structure:

```json
{
  "success": true,
  "message": "Description",
  "data": {}
}
```

## Authentication

Use the `/api/v1/auth` routes for registration and login.

- `POST /api/v1/auth/register`
  - Body: `{ name, email, password, image? }`
  - Returns: newly created user profile

- `POST /api/v1/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ token }`

- `GET /api/v1/auth/me`
  - Requires `Authorization: Bearer <token>`
  - Returns: current user profile

## API Endpoints

### Users

- `GET /api/v1/users`
  - Admin only

- `GET /api/v1/users/:id`
  - Admin only

- `POST /api/v1/users`
  - Admin only
  - Body: `{ name, email, password, image?, role? }`

- `PATCH /api/v1/users/:id`
  - Admin only

- `DELETE /api/v1/users/:id`
  - Admin only
  - Optional: `?permanent=true`

### Categories

- `GET /api/v1/categories`
  - Public

- `GET /api/v1/categories/:id`
  - Public

- `POST /api/v1/categories`
  - Auth required
  - Body: `{ name, slug, description? }`

- `PATCH /api/v1/categories/:id`
  - Auth required

- `DELETE /api/v1/categories/:id`
  - Auth required
  - Optional: `?permanent=true`

### Ideas

- `GET /api/v1/ideas`
  - Public
  - Query params: `userId`, `categoryId`, `status`

- `GET /api/v1/ideas/:id`
  - Public

- `POST /api/v1/ideas`
  - Auth required
  - Body: `{ title, shortDescription, detailedDescription, categoryId, targetAudience?, estimatedBudget?, status? }`

- `PATCH /api/v1/ideas/:id`
  - Auth required

- `DELETE /api/v1/ideas/:id`
  - Auth required
  - Optional: `?permanent=true`

### Posts

- `GET /api/v1/posts/my`
  - Auth required
  - Returns current user posts

- `GET /api/v1/posts`
  - Auth required

- `GET /api/v1/posts/:id`
  - Auth required

- `POST /api/v1/posts`
  - Auth required
  - Body: `{ title, shortDescription?, generatedContent, platform, tone, length, imageUrl?, status? }`

- `PATCH /api/v1/posts/:id`
  - Auth required

- `DELETE /api/v1/posts/:id`
  - Auth required
  - Optional: `?permanent=true`

### AI Generation

- `POST /api/v1/ai/generate`
  - Body: `{ topic, platform?, tone?, length? }`
  - Returns: `{ generatedContent }`

## Deployment

- `vercel.json` routes all traffic to `src/server.ts`
- Production TLS support is handled in `src/lib/prisma.ts`
- Ensure the frontend URL is allowed via `CLIENT_URL` or `FRONTEND_URL`

## Scripts

- `npm run dev` — start development server
- `npm run build` — compile TypeScript
- `npm start` — run compiled server
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:migrate` — run Prisma migrations
