# SGO — Sistema de Gestão Ocupacional

Produto 3 da Wow+. Plataforma de gestão de saúde ocupacional (exames admissionais,
periódicos, demissionais, retorno e mudança de função) em telemedicina e presencial.

> Contexto completo, schema e roadmap: **`PROJECT.md`** e a pasta **`docs/`**.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma 6 + PostgreSQL ·
NextAuth v5 (RBAC) · Storage S3-compatível (MinIO) · Deploy no Coolify.

## Rodar local
```bash
cp .env.example .env          # preencha DATABASE_URL, AUTH_SECRET (openssl rand -base64 32), S3_*
npm install
npx prisma migrate dev        # cria o schema no Postgres
npm run db:seed               # (opcional) cria admin + empresa DCAS
npm run dev                   # http://localhost:3000
```

## Scripts
- `npm run dev` · `npm run build` · `npm run start`
- `npm run lint` · `npm run typecheck`
- `npm run db:migrate` · `npm run db:deploy` · `npm run db:studio` · `npm run db:seed`

## Healthcheck
`GET /api/health` → `200 { status, db, service, time }` (liveness; `db` indica conexão).

## Deploy (Coolify)
1. Conectar o repositório no Coolify e habilitar auto-deploy (build via `Dockerfile`).
2. Provisionar Postgres e MinIO; setar as variáveis do `.env.example` no painel.
3. O container roda `prisma migrate deploy` antes de subir o app.
