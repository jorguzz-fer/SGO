# Regras do PCMSO → Motor de Eventos Ocupacionais

> Traduz as regras do **PCMSO da DCAS** (grau de risco 3) em lógica de agendamento proativo.
> Objetivo: o SGO calcular sozinho **quem precisa de exame e quando** — substituindo o controle
> reativo em planilha. Responde direto ao "quantas vidas precisam fazer exame esse mês".

## 1. Tipos de evento e gatilhos

| Tipo | Quando é obrigatório | Gatilho no SGO |
|---|---|---|
| **Admissional** | Antes de o funcionário assumir a função | Cadastro de novo funcionário / nova contratação |
| **Periódico** | Anual (ou a critério médico p/ risco/doença crônica) | `data_admissao` ou `ultimo_exame_data` + 12 meses |
| **Retorno ao Trabalho** | 1º dia após afastamento ≥ 30 dias (doença/acidente) | Marcação de afastamento ≥ 30 dias → fim do afastamento |
| **Mudança de Função / Risco** | Troca de atividade/posto/setor com novo risco | Alteração de `funcao`/`setor` do funcionário |
| **Demissional** | Até a homologação | Início de processo de demissão (ver janela §2) |

## 2. Janela do Demissional (grau de risco)
- **Grau 3 e 4** (DCAS = 3): dispensa o exame se o **último exame ocupacional ≤ 90 dias**.
- **Grau 1 e 2**: janela de **135 dias**.
- Lógica: ao iniciar a demissão, se `hoje - ultimo_exame_data > 90` (risco 3-4) → **exige demissional**;
  senão, sinaliza que pode ser dispensado.

## 3. Periodicidade do Periódico
- Padrão anual. O sistema gera **alerta de vencimento** com antecedência configurável (ex.: 30 dias).
- Exposição a risco / doença crônica → periodicidade pode ser menor (campo por funcionário/setor,
  alimentado pelo PCMSO/PGR).

## 4. Saídas do motor
- **Fila de pendências** por tipo e por vencimento (hoje/semana/mês).
- **Alertas proativos** (periódico vencendo, retorno após afastamento, demissional fora da janela).
- Números p/ o **dashboard** e o **faturamento por vida** (vidas ativas × eventos do mês).

## 5. Conformidade (do PCMSO)
- ASO emitido em **3 vias**; guarda do histórico ocupacional por **20 anos**.
- O SGO deve manter o **histórico de ASOs por funcionário** acessível (portal DCAS + auditoria).
