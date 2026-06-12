/**
 * Motor de regras do PCMSO (vencimentos de exames ocupacionais).
 * Ver docs/regras-pcmso-eventos.md.
 */
const MS_DIA = 86_400_000;

export type SituacaoExame = "EM_DIA" | "VENCENDO" | "VENCIDO" | "SEM_DATA";

export function addMeses(d: Date, meses: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + meses);
  return r;
}

export function diffDias(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / MS_DIA);
}

/** Periódico vence 12 meses após o último exame (ou a admissão, se nunca houve). */
export function vencimentoPeriodico(
  dataAdmissao: Date | null,
  ultimoExame: Date | null,
): Date | null {
  const base = ultimoExame ?? dataAdmissao;
  return base ? addMeses(base, 12) : null;
}

export function classificarVencimento(
  vencimento: Date | null,
  hoje: Date = new Date(),
  janelaDias = 30,
): SituacaoExame {
  if (!vencimento) return "SEM_DATA";
  const dias = diffDias(vencimento, hoje);
  if (dias < 0) return "VENCIDO";
  if (dias <= janelaDias) return "VENCENDO";
  return "EM_DIA";
}

/**
 * Demissional: obrigatório se houver demissão e o último exame estiver fora da
 * janela legal (90 dias p/ grau 3-4; 135 dias p/ grau 1-2).
 */
export function demissionalPendente(
  dataDemissao: Date | null,
  ultimoExame: Date | null,
  grauRisco: number | null = 3,
  hoje: Date = new Date(),
): boolean {
  if (!dataDemissao) return false;
  if (!ultimoExame) return true;
  const limite = (grauRisco ?? 3) >= 3 ? 90 : 135;
  return diffDias(hoje, ultimoExame) > limite;
}

export const SITUACAO_LABEL: Record<SituacaoExame, string> = {
  EM_DIA: "Em dia",
  VENCENDO: "Vencendo",
  VENCIDO: "Vencido",
  SEM_DATA: "Sem data",
};
