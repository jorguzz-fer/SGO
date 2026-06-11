# SGO — Sistema de Gestão Ocupacional

Plataforma de gestão de saúde ocupacional (Produto 3 da Wow+). Gerencia exames ocupacionais
(admissional, periódico, retorno, mudança de função, demissional) em **telemedicina** e
**presencial**, conectando empresas-cliente (RH), a coordenação ("clínica-mãe"), médicos e
clínicas credenciadas. Domínio sensível: **dados de saúde + LGPD**.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- NextAuth — RBAC: `CLIENTE`, `COORDENACAO`, `MEDICO`, `CLINICA`, `ADMIN`
- Storage S3-compatível (MinIO) p/ ASOs, via URLs assinadas
- Deploy: **Coolify** (self-hosted)

## Comandos
- `npm run dev` — ambiente local
- `npm run build` · `npm run start`
- `npm run lint` · `npm run typecheck`
- `npm test`
- `npx prisma migrate dev` · `npx prisma studio`

## Convenções
- TypeScript estrito; **nunca use `any`**.
- Valide TODA entrada com `zod`, **no servidor** (nunca confie no client).
- Multi-tenant: **SEMPRE** filtre por `empresaClienteId` — cliente só vê os próprios dados.
- Autorização por papel (RBAC) em toda rota/ação; médico/clínica só veem o evento roteado a eles.
- Prisma parametrizado; nunca concatene SQL.
- Reuse componentes/utilitários existentes antes de criar novos.

## Domínio & docs (leia quando for relevante ao que está fazendo)
- **Contexto completo, schema Prisma, sprints e ADRs → `PROJECT.md`** (leia primeiro)
- Visão geral e fases → `docs/DEMANDA-Produto3-Gestao-Ocupacional.md`
- Formulário/guia única + stack/segurança/LGPD → `docs/spec-guia-unificada.md`
- Quando cada exame vence (motor de regras) → `docs/regras-pcmso-eventos.md`
- Fluxo, status e régua de comunicação → `docs/fluxo-processo-telas.md`
- Telas campo a campo → `docs/telas-detalhadas.md`
- Integração com o app Wow+ → `docs/spec-integracao-wowmais-api.md`
- Importação da base de funcionários → `docs/template-importacao-funcionarios.md`

## Segurança & LGPD (dados de saúde = sensíveis)
- Nunca commite segredos; use variáveis de ambiente.
- Criptografe campos sensíveis em repouso (CPF, RG, dados de saúde).
- ASOs só por URL assinada de curta duração; histórico guardado por 20 anos (PCMSO).
- Log de auditoria imutável por evento (quem acessou/alterou).
- Nunca exponha PII em logs, erros ou respostas de API.
- Acesso de médico/clínica por token assinado, com escopo a 1 evento e expiração.
- Falhe seguro: negue por padrão. Sinalize falhas de segurança explicitamente.
