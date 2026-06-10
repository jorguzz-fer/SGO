# Análise dos Materiais da DCAS → Automação no SGO

> Base: conversa com o Samuel (`DEMANDA-Produto3-Gestao-Ocupacional.md`) + materiais reais da
> operação DCAS (6 guias, ASOs, Ficha Clínica, PGR, PCMSO, relatório de cidades).
> Status: **análise para validação com a Lidiane**.

---

## 1. O que cada material é (e o que revela)

| Material | Formato | Achado-chave |
|---|---|---|
| **6 Guias de Encaminhamento** (Demissional, Periódico, Retorno, Presencial, Telemedicina, + Mudança) | .xls/.xlsx | **Template idêntico**. Diferem só pelo *tipo de exame marcado* e pelo *bloco da clínica de destino*. |
| **ASO** (Atestado de Saúde Ocupacional) | PDF | Gerado pelo **SOC – sistema.soc.com.br** (clínica "Consult Eng. & Medicina"); assinado pelo **Dr. Maurício Tanabe – CRM 134244/SP**. Há versões "com informação" (camada de texto) e "sem informação" (escaneado/imagem). |
| **FC – Ficha Clínica** | PDF | Anamnese / registro clínico do funcionário. |
| **PGR – DCAS** | PDF | NR-1/GRO. Grau de risco **3**, ~1.224 funcionários (jul/2025). Inventário de riscos por setor; revisão anual. |
| **PCMSO – DCAS** | PDF | **Rulebook** dos exames: o que é obrigatório e a periodicidade (ver §4). 721 funcionários (jan/2026). ASO em 3 vias, guarda por 20 anos. |
| **relatório de cidades** | PDF | Demanda presencial por região → mapa de **onde credenciar clínicas** (ver §5). |

### Clínicas usadas hoje
- **SATMED** — Rua Dr. Samuel Porto, Saúde/SP → clínico / telemedicina
- **Consult (Matriz Guarulhos)** — Rua Luiz Turri 120 → presencial; filiais Aeroporto GRU T2 e Arujá

---

## 2. A descoberta central
As **6 guias são o mesmo formulário**. O que muda entre elas:
1. **Tipo de exame** marcado (Admissional / Periódico / Retorno / Mudança de Função / Demissional)
2. **Bloco da clínica de destino** (SATMED telemedicina × Consult presencial)

Ou seja: hoje há 6 arquivos Excel sendo preenchidos à mão, quando na verdade é **1 formulário
com 2 campos de escolha**. Esse é o maior ganho imediato de simplificação.

---

## 3. Mapa de automação (material → dor atual → automação no SGO)

| # | Hoje (dor) | No SGO (automação) | Insumo |
|---|---|---|---|
| 1 | 6 planilhas preenchidas à mão | **1 formulário digital único**; PDF no layout atual gerado automático p/ a clínica | 6 guias |
| 2 | Redigitam os dados do funcionário em toda guia | **Importa a base 1x**; ao escolher o funcionário, campos já vêm preenchidos | campos da guia |
| 3 | Controle de quem precisa de exame na planilha (reativo) | **Motor de regras do PCMSO**: calcula vencimentos (periódico anual, demissional, retorno) e alerta | PCMSO |
| 4 | "Achar clínica" na mão por região | **Roteamento por cidade/UF** → clínica credenciada mais próxima; telemedicina direto ao médico | relatório de cidades + setor |
| 5 | ASO espalhado em PDF/e-mail | **Captura + histórico por funcionário** (guarda 20 anos), DCAS baixa pelo portal | ASOs |
| 6 | Gestão em planilha | **Dashboard**: vidas ativas, exames/mês por tipo, turnover, pendências, custo (R$/vida), boleto | tudo |

---

## 4. Regras do PCMSO a codificar (motor de eventos)
- **Admissional** — antes de assumir a função.
- **Periódico** — anual (ou a critério médico p/ risco/doença crônica).
- **Retorno ao Trabalho** — 1º dia após afastamento ≥ 30 dias (doença/acidente).
- **Mudança de Risco Ocupacional** — troca de atividade/posto/setor que gere novo risco.
- **Demissional** — até a homologação, se o último exame tiver **> 90 dias** (risco 3-4) / > 135 dias (risco 1-2).

Detalhamento operacional em `regras-pcmso-eventos.md`.

---

## 5. Mapa de demanda presencial (onde credenciar clínicas)
- **Maior fluxo**: Machado-MG, Osasco-SP, Sorocaba-SP, Poços de Caldas-MG, Brasília-DF, Campinas-SP, Louveira-SP
- **Grande SP (shoppings)**: Pátio Paulista, Eldorado, Morumbi, Santa Cruz, Shopping JK, Granja Viana; hospitais Oswaldo Cruz e A.C. Camargo
- **RJ**: Leblon, Gávea, Rio Sul
- **Jardinagem (~2 colaboradores/cidade)**: Betim, Uberlândia, Contagem, Machado (MG); Joinville (SC); Goiânia (GO); Itaporanga (SE); Caieiras, Jaguariúna, Louveira, Campinas, Cajamar, Carvalho Pinto, Jacareí, Osasco (SP); Duque de Caxias, São Gonçalo, Mesquita, Araruama (RJ)

→ Prioridade de credenciamento da rede "clínica-mãe" da O+.

---

## 6. Decisões em aberto
- **SOC (sistema.soc.com.br)** é o software da clínica que emite os ASOs. **Fase 1: apenas armazenar
  o PDF** enviado; avaliar integração via API depois.
- **Dr. Maurício Tanabe (CRM 134244/SP)** é o médico que assina os ASOs — **pessoa diferente** do Maurício sócio.
- ASOs "sem informação" são **imagens escaneadas** → exigir upload do PDF com texto ou prever OCR.

---

## Documentos relacionados
- `spec-guia-unificada.md` — formulário digital único, campo a campo
- `template-importacao-funcionarios.md` — colunas da planilha de importação da base
- `regras-pcmso-eventos.md` — regras de periodicidade prontas p/ virar lógica
- `DEMANDA-Produto3-Gestao-Ocupacional.md` — demanda geral do Produto 3
