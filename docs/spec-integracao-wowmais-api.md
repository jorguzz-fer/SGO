# Spec — Integração SGO ↔ App da Wow+ (contrato de APIs)

> Contrato **genérico** de conexão entre o SGO (gestão ocupacional) e o app da **Wow+** (`wowmais`).
> A premissa é que o app Wow+ é o "hub" (identidade + empresas + funcionários) e o SGO entrega a
> camada ocupacional. **A refinar contra o repo `wowmais`** quando liberado.
> Stack: Next.js (App Router, Route Handlers) + TypeScript + Prisma + Postgres.

---

## 1. Princípios
- **REST** versionado em `/api/v1`, JSON, `camelCase`.
- **Idempotência** em escritas (`Idempotency-Key`), via `externalId` para sincronização.
- **Erros** no padrão RFC 7807 (`type`, `title`, `status`, `detail`, `instance`).
- **Paginação** por cursor (`?limit=&cursor=`).
- **Datas** ISO-8601 (UTC).
- **Multi-tenant**: todo recurso pertence a uma `empresa` (cliente); o token define o escopo.

## 2. Autenticação
Dois modos, conforme o caso:
- **Server-to-server** (Wow+ ↔ SGO): **OAuth2 client credentials** → `Bearer` token (JWT) com
  `scope`. Alternativa: API Key + assinatura **HMAC-SHA256** no header `X-Signature`.
- **Usuário (SSO)**: **OIDC** — Wow+ como Identity Provider; SGO consome `id_token` e mapeia o
  usuário para um papel (`CLIENTE`/`COORDENACAO`/...). Permite abrir o SGO "dentro" do app Wow+ sem novo login.

Headers padrão: `Authorization: Bearer <token>` · `X-Idempotency-Key` · `X-Signature` (webhooks).

## 3. Identificadores
Cada `Empresa` e `Funcionario` guarda o `externalId` (id no Wow+) → sincronização idempotente
e navegação cruzada entre os dois sistemas.

---

## 4. Endpoints que o **SGO expõe** (consumidos pelo Wow+)

### Empresas / Funcionários (sincronização vinda do Wow+)
| Método | Rota | Descrição |
|---|---|---|
| `PUT` | `/api/v1/empresas/{externalId}` | Upsert de empresa-cliente (CNPJ, razão social, CNAE, grau de risco, logo) |
| `PUT` | `/api/v1/empresas/{empresaId}/funcionarios/{externalId}` | Upsert de funcionário (campos da base — ver `template-importacao-funcionarios.md`) |
| `POST` | `/api/v1/empresas/{empresaId}/funcionarios/{externalId}/desligamento` | Sinaliza desligamento → dispara avaliação de **demissional** |
| `GET` | `/api/v1/empresas/{empresaId}/funcionarios` | Lista funcionários (paginado) |

### Situação ocupacional (consumida pelo app p/ exibir ao RH/funcionário)
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/funcionarios/{id}/situacao-ocupacional` | `EM_DIA` / `PENDENTE` / `VENCIDO` + próximos vencimentos |
| `GET` | `/api/v1/funcionarios/{id}/asos` | Histórico de ASOs |
| `GET` | `/api/v1/asos/{id}/download` | URL assinada (curta duração) p/ o PDF |

### Solicitações de exame (o Wow+ pode abrir solicitação)
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/v1/solicitacoes` | Cria solicitação (funcionário, tipo de exame, modalidade, exames) → status `SOLICITADO` |
| `GET` | `/api/v1/solicitacoes/{id}` | Status e dados do evento |
| `GET` | `/api/v1/empresas/{empresaId}/solicitacoes` | Lista/filtra eventos |

### Gestão / dashboard
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/v1/empresas/{empresaId}/dashboard` | Vidas ativas, exames do mês por tipo, turnover, pendências |
| `GET` | `/api/v1/empresas/{empresaId}/faturamento?competencia=AAAA-MM` | Vidas faturáveis e valor (por vida) |

---

## 5. Webhooks que o **SGO emite** (Wow+ assina/recebe)
`POST {wowmais_webhook_url}` com `X-Signature: hmac-sha256=...` e corpo:
```json
{
  "id": "evt_123",
  "type": "evento.status_changed",
  "occurredAt": "2026-06-11T12:00:00Z",
  "data": { "solicitacaoId": "...", "funcionarioExternalId": "...", "status": "ASO_EMITIDO" }
}
```
Tipos de evento:
- `evento.status_changed` — qualquer transição (`SOLICITADO`…`CONCLUIDO`/`CANCELADO`)
- `aso.emitido` — inclui link assinado p/ download
- `parecer.inapto` — alerta de funcionário **INAPTO**
- `exame.vencendo` — periódico/demissional dentro da janela (motor PCMSO)

Entrega com **retry exponencial** e idempotência por `id`.

---

## 6. Endpoints que o **SGO consome** do Wow+ (a confirmar contra `wowmais`)
- `GET {wow}/api/empresas/{id}` / `GET {wow}/api/funcionarios/{id}` — enriquecer cadastro.
- OIDC discovery (`/.well-known/openid-configuration`) p/ o SSO.
- (opcional) Notificações: o SGO pede ao Wow+ p/ disparar push/WhatsApp ao funcionário.

---

## 7. Mapeamento de papéis (SSO)
| Papel no Wow+ | Papel no SGO |
|---|---|
| RH/DP do cliente | `CLIENTE` |
| Equipe O+ ocupacional | `COORDENACAO` |
| Médico parceiro | `MEDICO` |
| Clínica credenciada | `CLINICA` |
| Admin plataforma | `ADMIN` |

## 8. Versionamento & evolução
- Breaking changes → `/api/v2`; `v1` mantido com período de depreciação.
- Tudo documentado via **OpenAPI** (gerar `openapi.yaml` na Fase 1).

---

## Premissas a validar contra o `wowmais`
1. Wow+ é o Identity Provider (OIDC) ou cada app tem auth própria?
2. Direção do "dono" do cadastro de empresas/funcionários (Wow+ empurra, ou SGO importa?).
3. Formato dos IDs e webhooks já usados pelo Wow+ (reaproveitar convenção).
4. Canal de notificação ao funcionário (push/WhatsApp) fica no Wow+ ou no SGO?

## Documentos relacionados
- `spec-guia-unificada.md` (§10–13: stack, segurança, LGPD)
- `fluxo-processo-telas.md` · `telas-detalhadas.md` · `regras-pcmso-eventos.md`
