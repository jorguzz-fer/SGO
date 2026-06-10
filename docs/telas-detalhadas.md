# Telas Detalhadas — Especificação de Interface (SGO)

> Detalhamento campo a campo de cada tela, por ator. Base: `fluxo-processo-telas.md` e
> `spec-guia-unificada.md`. Convenção: **[ação]** = botão/ação; `campo` = dado exibido/editável.

---

## A. Portal do Cliente (DECAS — Lidiane/Mayara)

### A.1 Login
- `e-mail`, `senha`, **[Entrar]**, **[Esqueci a senha]**.
- White label: logo + cores da empresa-cliente (DECAS).

### A.2 Base de Funcionários
- **Lista**: `nome` · `CPF` · `função` · `setor` · `cidade/UF` · `status` (Ativo/Afastado/Demitido) · `último exame` · `próximo vencimento`.
- Filtros: por setor, cidade, status, vencimento.
- **[Importar planilha]** → upload (ver `template-importacao-funcionarios.md`), tela de pré-visualização + relatório de erros.
- **[Novo funcionário]** (cadastro manual) · **[Abrir solicitação]** (a partir da linha).

### A.3 Abrir Solicitação (a guia unificada)
- Seleciona `funcionário` → dados auto-preenchidos (somente leitura, com **[editar]**).
- `tipo de exame` (Admissional/Periódico/Retorno/Mudança/Demissional) — dispara validação do PCMSO.
- `modalidade` (Telemedicina/Presencial) — sistema sugere default.
- `exames necessários` (Clínico/Audiometria/Outros + texto).
- `observações`.
- **[Enviar solicitação]** → status `SOLICITADO`, notifica Raquel.

### A.4 Acompanhar Solicitações
- **Lista** de eventos: `funcionário` · `tipo` · `modalidade` · `status` (badge colorido) · `clínica/médico` · `data` · `ASO`.
- Linha do tempo do evento (SOLICITADO → … → CONCLUIDO).
- **[Baixar ASO]** quando `ASO_EMITIDO`/`CONCLUIDO`.
- Alerta visual para `INAPTO` e para pendências.

### A.5 Dashboard de Gestão
- Cartões: `vidas ativas` · `exames no mês (por tipo)` · `turnover` · `pendências` · `próximos vencimentos`.
- Gráfico por tipo de exame e por mês.
- `custo` (R$/vida) e **[Ver fatura/boleto]** no fechamento.

---

## B. Painel de Coordenação (Raquel — "clínica-mãe")

### B.1 Caixa de Solicitações
- **Fila** priorizada: `funcionário` · `cliente` · `tipo` · `modalidade` · `cidade/UF` · `recebido há` · `SLA`.
- Filtros por status, modalidade, região, cliente.
- Notificação em tempo real + 📧.

### B.2 Triagem / Roteamento (abre a solicitação)
- Dados do funcionário + exame (revisão).
- **Telemedicina** → **[Atribuir médico]** (lista de médicos parceiros).
- **Presencial** → **[Escolher clínica]**: sistema **sugere clínica credenciada por cidade/UF** (ver `relatório de cidades`); lista com distância/horários.
- **[Rotear]** → status `ROTEADO`, gera link e notifica médico/clínica.
- **[Cancelar]** / **[Devolver ao cliente]** (dados faltando).

### B.3 Monitor de Pendências / SLA
- Eventos por status, com cronômetro de SLA (ex.: ASO em 24h na telemedicina).
- Destaque de atrasos → **[Cobrar médico/clínica]** (reenvia notificação).

### B.4 Cadastros (credenciamento)
- **Clínicas**: nome, endereço, cidade/UF, horários, exames oferecidos, regras (antecedência, doc. c/ foto), contato. Reutilizável no rodapé da guia.
- **Médicos**: nome, CRM, especialidade, modalidade (telemedicina).
- **Mapa de cobertura** por região (onde falta credenciar — alimentado pelo relatório de cidades).

---

## C. Painel da Clínica Credenciada (acesso por link no e-mail)

### C.1 Encaminhamentos recebidos
- Lista de solicitações roteadas: `funcionário` · `exame` · `data desejada` · `status`.

### C.2 Agendar
- `data/hora`, `unidade` (matriz/filial). **[Confirmar agendamento]** → status `AGENDADO`; notifica DECAS + funcionário.

### C.3 Atendimento / Parecer
- Marca `REALIZADO` (comparecimento).
- `parecer` (**APTO / INAPTO**) · `restrições/observações` (ex.: apto p/ trabalho em altura).
- **[Subir ASO]** (PDF) · `exames realizados`. → status `ASO_EMITIDO`; volta p/ Raquel **e** DECAS.

> Decisão registrada (`fluxo-processo-telas.md`): quem agenda no presencial é a **clínica**.
> Se for a Raquel, a ação B.2 ganha o campo de data e a C.2 some.

---

## D. Tela do Médico (Telemedicina — acesso por link)

### D.1 Atendimentos atribuídos
- Lista: `funcionário` · `tipo de exame` · `dados/anamnese` · `SLA 24h`.

### D.2 Atendimento online + ASO
- Realiza o atendimento → `REALIZADO`.
- `parecer` (APTO/INAPTO) + `observações`.
- **[Emitir/Subir ASO]** → status `ASO_EMITIDO`; notifica Raquel + DECAS.

---

## E. Componentes transversais
- **Badge de status** (cores) consistente em todas as telas: SOLICITADO · ROTEADO · AGENDADO · REALIZADO · ASO_EMITIDO · CONCLUIDO · CANCELADO.
- **Linha do tempo** do evento (auditoria: quem fez, quando).
- **Central de notificações** (sino) + e-mail com link de ação.
- **Histórico ocupacional por funcionário** (ASOs, guarda 20 anos — exigência PCMSO).
- **Geração do PDF "Guia de Encaminhamento"** no layout atual (ponte p/ clínicas em papel).

---

## Documentos relacionados
- `fluxo-processo-telas.md` — fluxo, sequência, status e régua de comunicação
- `spec-guia-unificada.md` · `template-importacao-funcionarios.md` · `regras-pcmso-eventos.md`
- `ANALISE-MATERIAIS-E-AUTOMACAO.md` · `DEMANDA-Produto3-Gestao-Ocupacional.md`
