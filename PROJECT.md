# SGO — Sistema de Gestão Ocupacional

> **One-liner:** Plataforma que digitaliza a gestão de saúde ocupacional (exames admissionais,
> periódicos, demissionais, retorno e mudança de função) ligando o RH das empresas, a coordenação
> "clínica-mãe", médicos de telemedicina e clínicas credenciadas — tirando a operação da planilha
> e do WhatsApp.

> **Construído por:** Wow+ (Fernando Jorge). **Produto 3** da plataforma Wow+. Primeiro
> cliente/beta: **DECAS Serviços** (grau de risco 3, ~800–1.200 vidas); na esteira: Only Plenos, Alumine.

> **Status:** Sprint 0 — especificação concluída (ver `docs/`), pré-scaffolding.

---

## Contexto estratégico (leia antes de codar)

### O problema real
Empresas não-tecnológicas gerenciam saúde ocupacional **na planilha, no e-mail e no WhatsApp**:

1. **6 guias de encaminhamento em Excel** preenchidas à mão (na prática, o mesmo formulário 6×).
2. Sem visibilidade de **quem vence exame** (periódico/demissional/retorno) — controle reativo.
3. **ASO** espalhado em e-mail/PDF, sem histórico organizado (a lei exige guardar 20 anos).
4. Escolha de clínica por região feita manualmente, caso a caso.

**Resultado:** retrabalho, risco de não-conformidade (NR-7/PCMSO) e zero gestão. Para o cliente,
uma dashboard simples já "encanta".

### A tese
Existe demanda paga por uma ferramenta vertical de gestão ocupacional que:
- Substitui as 6 guias por **um formulário digital único** + PDF automático para quem ainda usa papel.
- Importa a base 1× e **preenche tudo sozinho** depois.
- Usa as regras do **PCMSO** para avisar vencimentos **proativamente**.
- Roteia telemedicina (~80%) e presencial por região, com **ASO baixável** pelo RH.
- Cobra **por vida** (ex.: R$ 19,90/vida/mês) ou mensalidade — fatura no fechamento.

### O que NÃO é o produto na fase 1
- ❌ Integração com o sistema **SOC** das clínicas (fase 1 só armazena o PDF do ASO).
- ❌ Self-service de clínicas/clientes (onboarding é manual).
- ❌ Gateway de pagamento automático (boleto/fatura gerada, cobrança operacional no início).
- ❌ Régua de comunicação completa de marketing (entra depois — ver DEMANDA).

### Metas dos primeiros 60 dias
| Métrica | Meta |
|---|---|
| Cliente em produção | DECAS (telemedicina ponta a ponta) |
| Volume suportado | 5–10 exames/dia, ~80% telemedicina |
| Base importada | ~800 vidas |
| Tempo p/ abrir solicitação | < 1 min (vs preencher guia Excel) |
| ASO disponível ao RH | ≤ 24h (telemedicina) |

### Critério para repensar
Se a DECAS não adotar o fluxo digital no lugar das planilhas em 60 dias, revisar usabilidade/onboarding.

---

## Arquitetura técnica

### Stack
Stack de costume (Next.js + Prisma), deploy self-hosted no Coolify.

| Camada | Tecnologia |
|---|---|
| App (front+back) | Next.js 14+ (App Router, Route Handlers) + TypeScript |
| UI | Tailwind CSS (design system Wow+ quando aplicável) |
| ORM / Banco | Prisma + PostgreSQL |
| Auth | NextAuth — RBAC (CLIENTE, COORDENACAO, MEDICO, CLINICA, ADMIN) |
| Storage (ASO/PDF) | S3-compatível (MinIO) — URLs assinadas |
| Validação | zod |
| E-mail | transacional (régua de comunicação) |
| Geração de PDF | guia no layout atual (transição p/ clínicas em papel) |
| Deploy | Coolify (VPS própria) |
| Observabilidade | Pino + logs estruturados |

### Estrutura (app Next.js único)
```
sgo/
├── prisma/
│   └── schema.prisma           # modelo de dados (abaixo)
├── src/
│   ├── app/
│   │   ├── (cliente)/          # Portal do Cliente (DECAS)
│   │   ├── (coordenacao)/      # Painel da Raquel
│   │   ├── (clinica)/          # Painel da Clínica (acesso por link)
│   │   ├── (medico)/           # Tela do Médico (telemedicina, por link)
│   │   └── api/v1/             # Route Handlers (REST + integração Wow+)
│   ├── lib/                    # prisma, auth, storage, email, pdf, rbac
│   ├── server/                 # serviços de domínio (solicitação, motor PCMSO)
│   └── components/             # UI compartilhada
├── docs/                       # specs de produto (já existentes)
├── Dockerfile
├── .env.example
└── package.json
```

### Modelo de dados (Prisma)
```prisma
// ============ EMPRESAS / USUÁRIOS (multi-tenant) ============

model EmpresaCliente {
  id           String   @id @default(cuid())
  externalId   String?  @unique            // id no app Wow+
  slug         String   @unique            // "dcas"
  razaoSocial  String
  cnpj         String   @unique
  cnae         String?
  grauRisco    Int?                         // DCAS = 3
  logoUrl      String?                      // white label
  status       EmpresaStatus @default(ATIVO)
  plano        String   @default("piloto")
  criadoEm     DateTime @default(now())

  funcionarios Funcionario[]
  solicitacoes Solicitacao[]
  usuarios     Usuario[]
  documentos   Documento[]

  @@map("empresas_cliente")
}

enum EmpresaStatus { ATIVO INATIVO TRIAL }

model Usuario {
  id               String  @id @default(cuid())
  externalId       String? @unique          // SSO Wow+
  email            String  @unique
  nome             String
  role             Role    @default(CLIENTE)
  empresaClienteId String?                   // null = equipe Wow+ (COORDENACAO/ADMIN)
  medicoId         String? @unique
  clinicaId        String?

  empresaCliente   EmpresaCliente? @relation(fields: [empresaClienteId], references: [id])
  medico           Medico?  @relation(fields: [medicoId], references: [id])
  clinica          Clinica? @relation(fields: [clinicaId], references: [id])

  @@map("usuarios")
}

enum Role { CLIENTE COORDENACAO MEDICO CLINICA ADMIN }

// ============ FUNCIONÁRIOS ============

model Funcionario {
  id               String   @id @default(cuid())
  externalId       String?                   // id no Wow+
  empresaClienteId String
  nome             String
  cpf              String
  rg               String?
  pis              String?
  ctps             String?
  ctpsSerie        String?
  matriculaEsocial String?
  dataNascimento   DateTime?
  dataAdmissao     DateTime?
  dataDemissao     DateTime?
  sexo             Sexo?
  funcao           String?
  cbo              String?                   // código da função (ASO/eSocial)
  setor            String?                   // setor interno
  tomador          String?                   // cliente final / posto (Prysmian, Infracommerce) — pode virar entidade
  centroCusto      String?                   // contrato p/ faturamento
  cidade           String?
  uf               String?
  foneCelular      String?
  foneResidencial  String?
  email            String?
  status           FuncionarioStatus @default(ATIVO)
  criadoEm         DateTime @default(now())

  empresaCliente   EmpresaCliente @relation(fields: [empresaClienteId], references: [id], onDelete: Cascade)
  solicitacoes     Solicitacao[]
  asos             Aso[]
  afastamentos     Afastamento[]

  @@unique([empresaClienteId, cpf])
  @@index([empresaClienteId, status])
  @@map("funcionarios")
}

enum FuncionarioStatus { ATIVO AFASTADO DEMITIDO }
enum Sexo { MASCULINO FEMININO OUTRO }

// ============ REDE CREDENCIADA ============

model Clinica {
  id           String  @id @default(cuid())
  nome         String
  cnpj         String?
  endereco     String?
  cidade       String?
  uf           String?
  horarios     String?
  exames       Json?                         // exames oferecidos
  regras       String?                       // antecedência, doc c/ foto, etc.
  contato      String?
  ativo        Boolean @default(true)

  solicitacoes Solicitacao[]
  usuarios     Usuario[]

  @@index([cidade, uf])
  @@map("clinicas")
}

model Medico {
  id            String  @id @default(cuid())
  nome          String
  crm           String
  especialidade String?
  telemedicina  Boolean @default(true)
  ativo         Boolean @default(true)

  solicitacoes  Solicitacao[]
  usuario       Usuario?

  @@map("medicos")
}

// ============ SOLICITAÇÃO (guia unificada = evento ocupacional) ============

model Solicitacao {
  id                String   @id @default(cuid())
  externalId        String?
  empresaClienteId  String
  funcionarioId     String
  tipoExame         TipoExame
  modalidade        Modalidade
  examesNecessarios Json                     // [{tipo:"AUDIOMETRIA"},{tipo:"OUTROS",detalhe:"trabalho em altura"}]
  observacoes       String?
  status            StatusSolicitacao @default(SOLICITADO)
  clinicaId         String?
  medicoId          String?
  dataAgendada      DateTime?
  parecer           Parecer?
  criadoPorId       String?
  criadoEm          DateTime @default(now())

  empresaCliente    EmpresaCliente @relation(fields: [empresaClienteId], references: [id], onDelete: Cascade)
  funcionario       Funcionario @relation(fields: [funcionarioId], references: [id])
  clinica           Clinica? @relation(fields: [clinicaId], references: [id])
  medico            Medico?  @relation(fields: [medicoId], references: [id])
  aso               Aso?
  historico         StatusEvento[]

  @@index([empresaClienteId, status])
  @@index([funcionarioId])
  @@map("solicitacoes")
}

enum TipoExame { ADMISSIONAL PERIODICO RETORNO_AO_TRABALHO MUDANCA_DE_FUNCAO DEMISSIONAL }
enum Modalidade { TELEMEDICINA PRESENCIAL }
enum StatusSolicitacao { SOLICITADO ROTEADO AGENDADO REALIZADO ASO_EMITIDO CONCLUIDO CANCELADO }
enum Parecer { APTO INAPTO }

// ============ ASO / DOCUMENTOS / AUDITORIA ============

model Aso {
  id               String   @id @default(cuid())
  solicitacaoId    String   @unique
  funcionarioId    String
  arquivoKey       String                    // chave no storage; download via URL assinada
  parecer          Parecer
  examesRealizados Json?
  emitidoEm        DateTime @default(now())
  validadeAte      DateTime?

  solicitacao      Solicitacao @relation(fields: [solicitacaoId], references: [id])
  funcionario      Funcionario @relation(fields: [funcionarioId], references: [id])

  @@index([funcionarioId])
  @@map("asos")
}

model StatusEvento {                          // timeline imutável (auditoria LGPD)
  id            String   @id @default(cuid())
  solicitacaoId String
  deStatus      StatusSolicitacao?
  paraStatus    StatusSolicitacao
  autorId       String?
  meta          Json?
  ocorridoEm    DateTime @default(now())

  solicitacao   Solicitacao @relation(fields: [solicitacaoId], references: [id], onDelete: Cascade)

  @@index([solicitacaoId, ocorridoEm])
  @@map("status_eventos")
}

model Afastamento {                           // dispara RETORNO_AO_TRABALHO se >= 30 dias
  id            String   @id @default(cuid())
  funcionarioId String
  inicio        DateTime
  fim           DateTime?
  motivo        String?

  funcionario   Funcionario @relation(fields: [funcionarioId], references: [id], onDelete: Cascade)

  @@map("afastamentos")
}

model Documento {                             // PCMSO, PGR
  id               String   @id @default(cuid())
  empresaClienteId String
  tipo             TipoDocumento
  arquivoKey       String
  vigenciaInicio   DateTime?
  vigenciaFim      DateTime?
  versao           String?
  criadoEm         DateTime @default(now())

  empresaCliente   EmpresaCliente @relation(fields: [empresaClienteId], references: [id], onDelete: Cascade)

  @@map("documentos")
}

enum TipoDocumento { PCMSO PGR OUTRO }

// ============ INTEGRAÇÃO (Wow+) ============

model WebhookOutbox {                          // entrega de eventos p/ o app Wow+
  id          String   @id @default(cuid())
  tipo        String                          // "evento.status_changed", "aso.emitido"...
  payload     Json
  entregue    Boolean  @default(false)
  tentativas  Int      @default(0)
  criadoEm    DateTime @default(now())

  @@index([entregue, criadoEm])
  @@map("webhook_outbox")
}
```

---

## Sprints — plano de execução

### Sprint 0 — Setup (2–3 dias)
- [ ] Scaffolding Next.js (App Router) + TypeScript + Tailwind + ESLint/Prettier
- [ ] Prisma + Postgres (cole o schema acima) + migrations + `prisma studio`
- [ ] NextAuth com RBAC (5 papéis) + middleware de escopo por tenant
- [ ] Storage S3/MinIO (helper de upload + URL assinada)
- [ ] `GET /api/health` 200 · `.env.example` · Dockerfile · deploy no Coolify

**Aceite:** app loga como ADMIN em `sgo.wowmais...`; `/api/health` retorna 200.

### Sprint 1 — Cadastro & Importação (4 dias)
- [ ] CRUD de `EmpresaCliente` + seed **DECAS**
- [ ] CRUD de `Funcionario` + **importação por planilha** (ver `docs/template-importacao-funcionarios.md`), preview + relatório de erros, upsert por CPF
- [ ] Listagem/filtros da base (setor, cidade, status, vencimento)

**Aceite:** importar a base da DECAS gera os funcionários sem redigitação.

### Sprint 2 — Solicitação + Coordenação + Roteamento (5 dias)
- [ ] **Formulário único** (`docs/spec-guia-unificada.md`) → cria `Solicitacao` (`SOLICITADO`)
- [ ] **Painel da Raquel**: caixa de solicitações + triagem/roteamento (`ROTEADO`)
- [ ] Roteamento telemedicina (atribui médico) e presencial (sugere clínica por cidade/UF)
- [ ] `StatusEvento` (timeline) + notificação por e-mail com link

**Aceite:** DECAS abre solicitação → Raquel roteia → médico/clínica é notificado.

### Sprint 3 — Telemedicina ponta a ponta (4 dias)
- [ ] **Tela do médico** por magic-link → atende → `REALIZADO`
- [ ] Upload do **ASO** (`ASO_EMITIDO`) + parecer APTO/INAPTO
- [ ] Cliente **baixa o ASO** (URL assinada) → `CONCLUIDO`
- [ ] Geração do **PDF da guia** no layout atual

**Aceite:** ciclo telemedicina completo com ASO baixável em ≤ 24h.

### Sprint 4 — Presencial + Painel da Clínica (5 dias)
- [ ] Credenciamento de **Clínicas** (cadastro + cobertura por região — `docs/...relatório de cidades`)
- [ ] **Painel da Clínica** por link: agenda (`AGENDADO`), realiza, parecer + sobe ASO
- [ ] Resultado volta p/ Raquel **e** DECAS ao mesmo tempo

**Aceite:** ciclo presencial completo (ex.: admissional + audiometria).

### Sprint 5 — Motor de regras PCMSO + Dashboard (5 dias)
- [ ] Motor de eventos (`docs/regras-pcmso-eventos.md`): periódico anual, demissional (90d), retorno (afastamento ≥30d)
- [ ] Alertas/pendências proativos + `Afastamento`
- [ ] **Dashboard de gestão** DECAS: vidas ativas, exames/mês por tipo, turnover, próximos vencimentos

**Aceite:** sistema diz "quantas vidas precisam de exame este mês" sem planilha.

### Sprint 6 — Documentos + Faturamento (4 dias)
- [ ] Gestão de **PCMSO/PGR** (`Documento`): upload, vigência, acesso fácil
- [ ] **Faturamento por vida** (competência mensal) + geração de fatura/boleto

### Sprint 7 — Integração Wow+ + Polimento (5 dias)
- [ ] API `/api/v1` + **webhooks** (`WebhookOutbox`) + SSO OIDC (ver `docs/spec-integracao-wowmais-api.md`)
- [ ] OpenAPI gerado; hardening de segurança/LGPD; auditoria

---

## Variáveis de ambiente (.env)
```bash
# Database
DATABASE_URL="postgresql://sgo:senha@postgres:5432/sgo"

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://sgo.wowmais.com.br

# Storage (MinIO / S3)
S3_ENDPOINT=...
S3_BUCKET=sgo-asos
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# E-mail transacional
SMTP_URL=...
EMAIL_FROM="SGO <nao-responda@wowmais.com.br>"

# Criptografia de campos sensíveis (CPF/RG/saúde)
FIELD_ENCRYPTION_KEY=...

# Integração Wow+ (a confirmar contra o repo wowmais)
WOWMAIS_API_URL=...
WOWMAIS_WEBHOOK_URL=...
WOWMAIS_WEBHOOK_SECRET=...

NODE_ENV=development
```

---

## Decisões arquiteturais (ADRs resumidos)

### ADR-001: Multi-tenant desde o dia 1
Toda tabela com dado de cliente tem `empresaClienteId`; todas as queries filtram por ele. Refatorar depois custa caro e a tese de SaaS (Wow+) exige.

### ADR-002: App Next.js full-stack (não monorepo NestJS)
Diferente do padrão RadarVet/Histocell (Turborepo + NestJS), o SGO é **um app Next.js** (App Router + Route Handlers). Mais simples, deploy single-app no Coolify, alinhado à stack escolhida. Revisitar se a escala exigir um serviço separado.

### ADR-003: Dado de saúde é sensível (LGPD)
Criptografia de campos sensíveis (CPF/RG/saúde), ASO só por URL assinada, auditoria imutável (`StatusEvento`), retenção de 20 anos. Base legal: obrigação regulatória (NR-7/PCMSO).

### ADR-004: Guia unificada (1 formulário, não 6)
As 6 guias Excel são o mesmo template; viram **um formulário** com `tipoExame` + `modalidade` como campos, e o PDF é gerado no layout atual para clínicas em papel.

### ADR-005: Acesso de médico/clínica por magic-link
Sem onboarding pesado: link assinado (JWT), escopo a 1 evento, com expiração.

### ADR-006: ASO armazenado como PDF (sem SOC na fase 1)
Os ASOs vêm do sistema SOC das clínicas; na fase 1 apenas armazenamos o PDF. Integração via API fica para depois.

### ADR-007: Self-host no Coolify
Controle total da infra e dos dados (favorece manter no Brasil — LGPD).

---

## Primeira mensagem para Claude Code
```
Olá! Vou construir o SGO — Sistema de Gestão Ocupacional (Produto 3 da Wow+).

Leia PROJECT.md e a pasta docs/ neste repositório para o contexto completo:
- Visão/estratégia e o problema real (planilhas → dashboard)
- Stack (Next.js App Router + TypeScript + Prisma + Postgres + NextAuth, deploy Coolify)
- Schema Prisma completo
- Sprints (estamos no Sprint 0 — Setup)
- Specs de produto em docs/ (guia única, fluxo, telas, regras PCMSO, integração Wow+)

No Sprint 0 quero que você:
1. Confirme que leu, com um resumo de 5 linhas
2. Liste pré-requisitos da máquina (Node, pnpm/npm, Docker)
3. Proponha o primeiro commit com o scaffolding (Next.js + Prisma + NextAuth + health)
4. NÃO comece a codar antes de eu aprovar o plano

Importante: multi-tenant desde a 1ª tabela; dados de saúde são sensíveis (LGPD);
nada de over-engineering — MVP da DECAS (telemedicina ponta a ponta) primeiro.
```

---

## Próximos checkpoints comigo (no chat)
1. **Após Sprint 0:** app vazio rodando no Coolify + migrations ok — valido o setup.
2. **Após Sprint 1:** base da DECAS importada — reviso campos/qualidade.
3. **Após Sprint 2/3:** primeira solicitação telemedicina ponta a ponta — valido o fluxo e a régua de e-mail.
4. **Após Sprint 5:** dashboard de gestão + alertas de vencimento — valido com a Lidiane.
5. **Antes do Sprint 7:** contrato de integração refinado contra o repo `wowmais`.

---

**Disciplina de escopo:** se algo começar a fugir do plano (integração SOC, self-service,
multi-cliente automático, marketing), volte aqui antes. MVP da DECAS primeiro.

— Wow+ (Fernando Jorge)
