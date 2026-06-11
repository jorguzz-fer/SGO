import { z } from "zod";

export const sexoEnum = z.enum(["MASCULINO", "FEMININO", "OUTRO"]);
export const statusEnum = z.enum(["ATIVO", "AFASTADO", "DEMITIDO"]);

export const tipoExameEnum = z.enum([
  "ADMISSIONAL",
  "PERIODICO",
  "RETORNO_AO_TRABALHO",
  "MUDANCA_DE_FUNCAO",
  "DEMISSIONAL",
]);
export const modalidadeEnum = z.enum(["TELEMEDICINA", "PRESENCIAL"]);
export const exameEnum = z.enum([
  "CLINICO",
  "AUDIOMETRIA",
  "ACUIDADE_VISUAL",
  "ESPIROMETRIA",
  "RAIO_X",
  "HEMOGRAMA",
  "GLICEMIA",
  "ELETROCARDIOGRAMA",
  "ELETROENCEFALOGRAMA",
  "OUTROS",
]);

export const TIPO_EXAME_LABEL: Record<string, string> = {
  ADMISSIONAL: "Admissional",
  PERIODICO: "Periódico",
  RETORNO_AO_TRABALHO: "Retorno ao trabalho",
  MUDANCA_DE_FUNCAO: "Mudança de função",
  DEMISSIONAL: "Demissional",
};

export const EXAME_LABEL: Record<string, string> = {
  CLINICO: "Clínico",
  AUDIOMETRIA: "Audiometria",
  ACUIDADE_VISUAL: "Acuidade visual",
  ESPIROMETRIA: "Espirometria",
  RAIO_X: "Raio-X",
  HEMOGRAMA: "Hemograma",
  GLICEMIA: "Glicemia",
  ELETROCARDIOGRAMA: "Eletrocardiograma",
  ELETROENCEFALOGRAMA: "Eletroencefalograma",
  OUTROS: "Outros",
};

export const STATUS_SOLICITACAO_LABEL: Record<string, string> = {
  SOLICITADO: "Solicitado",
  ROTEADO: "Roteado",
  AGENDADO: "Agendado",
  REALIZADO: "Realizado",
  ASO_EMITIDO: "ASO emitido",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

/** Schema do funcionário (campos validados na guia/importação). */
export const funcionarioSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  cpf: z.string().trim().min(1, "CPF é obrigatório"),
  rg: optionalText,
  sexo: sexoEnum.optional(),
  pis: optionalText,
  ctps: optionalText,
  ctpsSerie: optionalText,
  matriculaEsocial: optionalText,
  funcao: optionalText,
  cbo: optionalText,
  setor: optionalText,
  tomador: optionalText,
  centroCusto: optionalText,
  cidade: optionalText,
  uf: z.string().trim().max(2).optional().transform((v) => (v ? v.toUpperCase() : undefined)),
  foneCelular: optionalText,
  foneResidencial: optionalText,
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  dataNascimento: z.date().optional(),
  dataAdmissao: z.date().optional(),
  dataDemissao: z.date().optional(),
  status: statusEnum.optional(),
});

export type FuncionarioInput = z.infer<typeof funcionarioSchema>;

/** Aceita dd/mm/aaaa, aaaa-mm-dd ou ISO. Retorna null se vazio/ inválido. */
export function parseDateBR(input?: string | null): Date | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseSexo(input?: string | null): "MASCULINO" | "FEMININO" | "OUTRO" | undefined {
  if (!input) return undefined;
  const s = input.trim().toUpperCase();
  if (s === "M" || s === "MASCULINO") return "MASCULINO";
  if (s === "F" || s === "FEMININO") return "FEMININO";
  if (s === "OUTRO" || s === "O") return "OUTRO";
  return undefined;
}

export function parseStatus(input?: string | null): "ATIVO" | "AFASTADO" | "DEMITIDO" {
  const s = (input ?? "").trim().toUpperCase();
  if (s === "AFASTADO") return "AFASTADO";
  if (s === "DEMITIDO") return "DEMITIDO";
  return "ATIVO";
}
