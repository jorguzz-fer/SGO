export type FormState = { ok: boolean; error?: string } | null;

export type ImportError = { linha: number; motivo: string };

export type ImportState = {
  ok: boolean;
  criados: number;
  atualizados: number;
  erros: ImportError[];
} | null;
