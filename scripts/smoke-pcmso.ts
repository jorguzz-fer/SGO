// Smoke das regras do PCMSO (funções puras). Uso: tsx scripts/smoke-pcmso.ts
import {
  vencimentoPeriodico,
  classificarVencimento,
  demissionalPendente,
  addMeses,
} from "../src/lib/pcmso";

const hoje = new Date("2026-06-11");
const meses = (n: number) => addMeses(hoje, -n);

function check(nome: string, cond: boolean) {
  console.log(`${cond ? "OK " : "FALHOU"} - ${nome}`);
  if (!cond) process.exitCode = 1;
}

// Periódico
check(
  "sem exame, admitido há 24m -> VENCIDO",
  classificarVencimento(vencimentoPeriodico(meses(24), null), hoje) === "VENCIDO",
);
check(
  "último exame há 11,5m -> VENCENDO",
  classificarVencimento(vencimentoPeriodico(meses(36), addMeses(hoje, -11)), hoje, 35) === "VENCENDO",
);
check(
  "último exame há 1m -> EM_DIA",
  classificarVencimento(vencimentoPeriodico(meses(36), meses(1)), hoje) === "EM_DIA",
);
check("sem datas -> SEM_DATA", classificarVencimento(vencimentoPeriodico(null, null), hoje) === "SEM_DATA");

// Demissional (grau 3 = 90 dias)
const cem = new Date(hoje); cem.setDate(cem.getDate() - 100);
const trinta = new Date(hoje); trinta.setDate(trinta.getDate() - 30);
check("demissão + último exame 100d (grau 3) -> pendente", demissionalPendente(hoje, cem, 3, hoje) === true);
check("demissão + último exame 30d (grau 3) -> não pendente", demissionalPendente(hoje, trinta, 3, hoje) === false);
check("sem demissão -> não pendente", demissionalPendente(null, cem, 3, hoje) === false);
