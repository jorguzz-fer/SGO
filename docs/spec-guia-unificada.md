# Spec — Guia de Encaminhamento Unificada (formulário digital único)

> Substitui as **6 guias Excel** (Admissional/Periódico/Retorno/Mudança/Demissional ×
> Telemedicina/Presencial) por **um único formulário**. Derivado campo a campo das planilhas reais
> da DCAS. O sistema gera o **PDF no layout atual** para clínicas que ainda exigem papel.

## 1. Cabeçalho (fixo por empresa-cliente)
| Campo | Origem | Obs |
|---|---|---|
| Empresa (razão social) | cadastro do cliente | ex.: DCAS SERVIÇOS LTDA |
| CNPJ | cadastro do cliente | ex.: 24.715.289/0001-93 |
| Logo | cadastro do cliente | p/ white label |

## 2. Funcionário (auto-preenchido pela base — ver `template-importacao-funcionarios.md`)
| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Nome | texto | sim | |
| Matrícula eSocial | texto | não | aparece na guia presencial |
| Data de nascimento | data | sim | |
| Data de admissão | data | condicional | obrigatória p/ admissional/periódico |
| Data de demissão | data | condicional | obrigatória p/ demissional |
| RG | texto | sim | |
| PIS | texto | não | |
| CTPS + Série | texto | não | |
| CPF | texto | sim | chave do funcionário |
| Fone celular | texto | sim | usado p/ telemedicina/notificação |
| Fone residencial | texto | não | |
| Função / Cargo | texto | sim | determina exames necessários |
| Setor | texto | sim | usado p/ riscos (PGR) e roteamento |

## 3. Tipo de exame (seleção única) — enum
`ADMISSIONAL` · `PERIODICO` · `RETORNO_AO_TRABALHO` · `MUDANCA_DE_FUNCAO` · `DEMISSIONAL`
> A escolha dispara as regras de `regras-pcmso-eventos.md` (validação de janelas/prazos).

## 4. Modalidade (seleção única) — enum
`TELEMEDICINA` · `PRESENCIAL`
> Default sugerido pelo sistema: ~80% telemedicina; presencial quando houver exame que exige
> presença física (ex.: audiometria) ou função de risco.

## 5. Exames necessários (múltipla escolha) — enum + texto
`CLINICO` · `AUDIOMETRIA` · `OUTROS` (texto livre — ex.: "trabalho em altura",
"amarração e organização de cargas", espirometria, raio-X)

## 6. Clínica de destino (roteamento)
- Selecionada automaticamente por **cidade/UF do funcionário/setor** (rede credenciada).
- Telemedicina → médico responsável (ex.: PCMSO).
- Campos: nome, endereço, horários de atendimento, regras (antecedência 24h, doc. com foto, etc.).
- Cadastro de clínica reutilizável (não redigitar o rodapé em toda guia).

## 7. Rodapé / controle
- Responsável pelo preenchimento (usuário logado) + data/hora (automático).
- Carimbo/assinatura (clínica) — no fluxo de retorno do ASO.

## 8. Saídas do formulário
1. **Registro no banco** (evento ocupacional vinculado ao funcionário).
2. **PDF "Guia de Encaminhamento"** no layout atual (transição p/ clínicas em papel).
3. **Notificação** (e-mail/portal) para a Raquel e/ou clínica, com link de ação.
4. Estado inicial do evento p/ o **dashboard** e o **motor de regras**.

## 9. Estados do evento (ciclo de vida)
`SOLICITADO` → `ROTEADO` (médico/clínica) → `AGENDADO` → `REALIZADO` →
`ASO_EMITIDO` (PDF anexado) → `CONCLUIDO` (apto/inapto) · ramo `CANCELADO`.

---

## 10. Stack & Arquitetura
- **Front+back**: Next.js (App Router) + **TypeScript** · **Tailwind CSS** (design system Wow+ quando aplicável).
- **ORM/Banco**: **Prisma** + **PostgreSQL**.
- **Auth**: **NextAuth** (sessão JWT) com **RBAC** por papel: `CLIENTE` (DECAS), `COORDENACAO` (Raquel), `MEDICO`, `CLINICA`, `ADMIN`.
- **Multi-tenant**: isolamento por `empresaClienteId` em todas as queries (cliente só enxerga seus dados).
- **Storage de arquivos** (ASO/PDF): bucket S3-compatível, acesso via **URLs assinadas com expiração**.
- **E-mail transacional** (régua de comunicação) + central de notificações in-app.
- **Validação**: `zod` em toda entrada (forms e API).
- **Hosting/Deploy**: **Coolify** (self-hosted) — app Next.js + **Postgres** + bucket S3-compatível
  (ex.: MinIO) no mesmo ambiente. Vantagem LGPD: dados no servidor próprio (Brasil). Build via Nixpacks/Dockerfile.

## 11. Segurança
- **HTTPS/TLS** obrigatório + HSTS; headers seguros (CSP, X-Frame-Options).
- **Senhas** com hash forte (argon2/bcrypt); **2FA** para `COORDENACAO`/`ADMIN`.
- **Autorização**: RBAC + escopo por tenant (row-level). Médico/Clínica só veem o **evento roteado a eles**.
- **Acesso por link** (médico/clínica no e-mail): **token assinado (JWT)** com escopo a 1 evento e **expiração** (magic-link); revogável.
- **Criptografia de campos sensíveis** em repouso (CPF, RG, dados de saúde — categoria especial).
- **ASOs**: armazenados criptografados; download só por URL assinada de curta duração.
- **Auditoria imutável**: log de quem acessou/alterou cada evento (alimenta a linha do tempo).
- **API/Webhooks**: tokens, **HMAC** nos webhooks, **rate limiting**, idempotência.
- **Segredos** em variáveis de ambiente (nunca no repo); princípio do menor privilégio; backups com retenção.
- Proteções padrão: CSRF, XSS, SQL-injection (Prisma parametrizado), validação `zod`.

## 12. LGPD
- **Dados de saúde = dado pessoal sensível** (LGPD art. 11). **Base legal**: cumprimento de obrigação
  legal/regulatória (NR-7/PCMSO) e tutela da saúde — *não* depende de consentimento, mas exige transparência.
- **Papéis**: DECAS (empregador) = **controlador**; O+/SGO = **operador**; clínicas/médicos = sub-operadores
  ou controladores conjuntos → formalizar em **DPA** (acordo de tratamento) no contrato.
- **Minimização & finalidade**: coletar só os campos da guia, usar exclusivamente p/ gestão ocupacional.
- **Retenção**: ASO/histórico **20 anos** (exigência legal do PCMSO) com base legal específica; demais dados pelo tempo necessário.
- **Direitos do titular** (funcionário): acesso/correção via canal definido; **aviso de privacidade**.
- **ROPA** (registro das operações de tratamento) + **plano de resposta a incidentes** (notificação ANPD/titular).
- **Segurança técnica** (art. 46): ver §11. Relatórios/dashboards **agregados/anonimizados** quando possível.
- **Localidade**: dados hospedados no servidor próprio via **Coolify** (controle total, facilita manter no Brasil).

## 13. Integração com o App da Wow+
Contrato de APIs (REST + webhooks, auth por token, SSO) detalhado em
**`spec-integracao-wowmais-api.md`**. Premissa: SGO **expõe** dados ocupacionais para o app Wow+ e
**recebe** sincronização de empresas/funcionários (refinar contra o repo `wowmais`).
