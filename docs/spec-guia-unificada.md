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
