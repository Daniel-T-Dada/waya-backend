# Waya Backend (TypeScript + Express)

Quick start:

Install dependencies (requires pnpm):

```powershell
pnpm install
pnpm run dev
```

Build and run:

```powershell
pnpm run build
pnpm start
```

Server entry: `server.ts`

Vercel notes:

- Vercel is optimized for serverless functions. To deploy this Express app on Vercel you can either:
  - Build an API function under the `api/` folder that imports this app, or
  - Use a simple serverless adapter (for example `@vercel/node`) and configure `vercel.json` to point requests to a server entry.
- Locally the server defaults to port `5000` (change via `.env`).

Database (Prisma + Postgres):

- This repo includes a `prisma/schema.prisma` with a `User` model. Configure your `DATABASE_URL` in `.env` before running migrations.
- Generate Prisma client and run migrations:

```powershell
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
```

After migrations, the Auth module will persist users in Postgres.
