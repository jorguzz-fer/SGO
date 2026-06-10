# Demanda — Produto 3: SGO (Sistema de Gestão Ocupacional)

> Documento de planejamento gerado a partir da conversa entre **Fernando Jorge (Fê)** e **Samuel (Sam)**.
> Data: junho/2026. Status: **rascunho para validação**.

---

## 1. Contexto

A **O+** já tem uma plataforma com **Produto 1** e **Produto 2** no sistema. O **Produto 3**
— **gestão ocupacional / saúde ocupacional (NR)** — hoje só existe em PowerPoint e está sendo
operado "por fora" para o cliente **Decas**. A ideia é estruturar esse Produto 3 como software,
começar pela Decas (e Only Plenos) como **beta testers**, e depois incorporá-lo à plataforma
da O+ e integrá-lo ao **PS (sistema do Pedro)**.

O problema do cliente é claro: empresas **não tecnológicas** que controlam **tudo por planilha**
e por isso sofrem. Uma dashboard simples já "encanta" e tira a dor de cabeça deles.

### Marcas / sistemas envolvidos
- **O+** — empresa principal.
- **SGO** — Sistema de Gestão Ocupacional (este Produto 3).
- **Plataforma de treinamentos (estilo Hotmart)** — produto correlato já no ar, em beta com
  O+, Alumine, Decas e Only Plenos (upload de treinamentos de NR1, NR2, etc.).
- **PS** — sistema do Pedro, com integração já prevista.

### Pessoas / papéis
| Pessoa | Papel |
|---|---|
| **Fernando (Fê)** | Sócio — estratégia, contratos, financeiro |
| **Samuel (Sam)** | Desenvolvedor — constrói as ferramentas |
| **Pedro (Pedrão)** | Desenvolvedor — migração + NR1 (entra daqui ~30–60 dias) |
| **Maurício** | Sócio — documentação (PCMSO/PGR), assinatura |
| **Raquel** | Coordenadora ocupacional interna ("clínica mãe") — recebe solicitações, credencia clínicas, organiza médicos |
| **Lidiane (Lidi)** | Decas — operacional/financeiro, conduz o dia a dia (principal ponto de contato para mapear o processo) |
| **Mayara** | Decas — operacional/financeiro |
| **Kátia** | Decas — testando, pressionando por entrega |

---

## 2. Fluxo do negócio (exames ocupacionais)

**Tipos de evento/exame:** Admissional · Periódico · Demissional · Retorno ao Trabalho · Outros (mudança de função, etc.).

**Modalidades:**
- **Telemedicina** (~80% dos casos) — médico online, ASO em até 24h. Ex. de custo: R$ 38/exame.
- **Presencial** — quando exige exame físico (ex.: audiometria), em **clínica credenciada da região** do funcionário.

**Volume estimado:** 5–10 exames/dia · ~80% telemedicina · Decas tem ~800 funcionários na base.

### Fluxo atual (manual — o que dói)
A pessoa do RH/DP da Decas preenche uma **guia/formulário em Excel** e envia por **WhatsApp/e-mail**
para a clínica. Controle todo em planilha.

### Fluxo desejado

```
[DECAS — RH/DP]
   cadastra funcionário no SGO (ou importa planilha da base)
   clica no funcionário → abre SOLICITAÇÃO (tipo + modalidade)
        │
        ▼
[RAQUEL — coordenação / "clínica mãe"]
   recebe na dashboard E/OU por notificação de e-mail (com link)
        │
        ├── TELEMEDICINA (~80%) ──────────────────────────────┐
        │     organiza com o médico → médico faz o ASO        │
        │     sobe o ASO no sistema (≤24h)                    │
        │     Decas baixa o PDF no dia seguinte               │
        │                                                     │
        └── PRESENCIAL ───────────────────────────────────────┤
              Raquel identifica a região do funcionário       │
              agenda com CLÍNICA CREDENCIADA da região        │
                    │                                         │
                    ▼                                         │
            [CLÍNICA CREDENCIADA]                             │
              recebe e-mail com LINK → tela de gestão         │
              agenda, recebe o funcionário, aprova/reprova    │
                    │                                         │
                    ▼                                         │
        resultado/ASO volta para RAQUEL **e** DECAS ◄─────────┘
        (ambas ao mesmo tempo — a O+ é a "clínica mãe")
```

---

## 3. Módulos do sistema

1. **Portal do Cliente (Decas)** — login/senha
   - Importar planilha da base de funcionários → banco de dados (último evento: admissional/periódico/etc.)
   - Cadastro de funcionário
   - Abrir solicitação (tipo de exame + modalidade), com "corpo padrão" pré-preenchido
   - Acompanhar status; baixar ASO/documentos (PDF)
   - **Dashboard de controle**: vidas ativas, exames do mês, turnover, por tipo

2. **Painel da Raquel (coordenação)**
   - Caixa de solicitações (dashboard + notificação por e-mail)
   - Roteamento: telemedicina (médico) × presencial (clínica por região)
   - Agendamento com clínica credenciada; upload do ASO

3. **Painel da Clínica Credenciada**
   - Acesso via link no e-mail → tela de gestão da clínica
   - Agenda, recebe, aprova/reprova, devolve resultado
   - (futuro) vender o sistema para as próprias clínicas

4. **Gestão de Documentos** — PCMSO, PGR (Raquel/Maurício): armazenar, fácil acesso, assinatura

5. **Faturamento / Billing** — por vida ou mensalidade; geração automática de boleto no fechamento do mês

6. **Notificações / E-mail** — toda solicitação inicial por e-mail, com link de ação

7. **Integração com PS** (sistema do Pedro)

8. **Régua de comunicação** (correlato) — jornada/experiência do cliente (cadastro → comunicação por WhatsApp/post). Pedido antigo do Fernando, alvo julho/agosto.

---

## 4. Modelo de monetização (EM ABERTO — decisão de negócio)

Opções levantadas na conversa, ainda não decididas:
- **Por vida**: ex. R$ 19,90 por cabeça/mês (R$ 19,90 × vidas ativas, boleto no fechamento).
- **Mensalidade fixa**: ex. R$ 100/mês para uso da plataforma de treinamentos.
- **White label** (caso Decas, uso mais interno).
- Definir **split** de quanto entra para a O+.

> Decisão postergada conscientemente: enquanto a ferramenta está em **beta**, os clientes usam de
> graça "ajudando a testar". Cobrança definida quando estiver redonda.

---

## 5. Plano por fases

### Fase 0 — Começar HOJE (operação manual, sem bloquear o cliente)
- Solicitação inicial **por e-mail** com **corpo/modelo padrão** para a Raquel selecionar tipo/modalidade.
- Raquel credenciando clínicas (onde há postos de trabalho) e alinhando médicos.
- Fernando: contrato + financeiro.

### Fase 1 — MVP da Dashboard (telemedicina ponta a ponta)
- Portal Decas com login; cadastro + **importação da planilha** da base.
- Abrir solicitação; **painel da Raquel**; fluxo de **telemedicina** completo (upload/download do ASO).

### Fase 2 — Fluxo presencial
- **Painel da clínica credenciada** via link no e-mail; agendamento; devolução de resultado para Raquel + Decas.

### Fase 3 — Gestão & faturamento
- Dashboards de controle para a Decas (vidas, turnover, por tipo) + **faturamento/boleto**.

### Fase 4 — Documentos
- Gestão de PCMSO/PGR, armazenamento e assinatura.

### Fase 5 — Integração & incorporação
- Integração com **PS**; incorporar como **Produto 3** dentro da plataforma O+ (~30–60 dias, quando o Pedro liberar da migração/NR1).
- **Régua de comunicação** (julho/agosto).

---

## 6. Decisões pendentes (precisam de você / Lidiane)

1. **Modelo de cobrança** (por vida × mensalidade × white label) e split para a O+.
2. **Modelo de guia**: usar a guia de cada clínica ou criar um **modelo SGO padrão**? (depende de validar com as clínicas — cada uma tem o seu controle).
3. **Escopo do "entregável de hoje"**: apenas Fase 0 (e-mail + modelo padrão) ou já adiantar parte da Fase 1?
4. **Mapeamento do processo real**: confirmar com a **Lidiane** as particularidades do fluxo da Decas.
5. **Stack/tecnologia** do SGO (este repo está vazio) — definir base antes de codar a Fase 1.

---

## 7. Pontos de processo (entre sócios)
- Samuel constrói "por fora". Combinado: **avisar antes** quando algo pode **impactar negativamente**;
  melhorias/incrementos podem seguir sem trava.
- Sexta-feira reservada (3–4h) para o Fernando revisar isto. Prazo de entrega do software a ser dado até o fim do dia.
