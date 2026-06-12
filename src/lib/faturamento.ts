import { prisma } from "@/lib/prisma";

/** Faturamento por vida (competência mensal). Ver PROJECT.md / DEMANDA. */

export type Competencia = { ano: number; mes: number }; // mes 1-12

export function parseCompetencia(input?: string | null): Competencia {
  const m = input?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const ano = Number(m[1]);
    const mes = Number(m[2]);
    if (mes >= 1 && mes <= 12) return { ano, mes };
  }
  const hoje = new Date();
  return { ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 };
}

export function competenciaStr({ ano, mes }: Competencia): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export function competenciaRange({ ano, mes }: Competencia): {
  inicio: Date;
  fim: Date;
} {
  return { inicio: new Date(ano, mes - 1, 1), fim: new Date(ano, mes, 1) };
}

export type Fatura = {
  empresaClienteId: string;
  competencia: string;
  vidas: number;
  valorVidaCentavos: number;
  totalCentavos: number;
  examesPorTipo: { tipo: string; quantidade: number }[];
  totalExames: number;
};

/**
 * Vida faturável na competência: admitido até o fim do mês (ou sem data de
 * admissão) e não demitido antes do início do mês. Funcionário sem data de
 * admissão só conta se não estiver DEMITIDO.
 */
export async function calcularFatura(
  empresaClienteId: string,
  comp: Competencia,
): Promise<Fatura> {
  const { inicio, fim } = competenciaRange(comp);

  const empresa = await prisma.empresaCliente.findUniqueOrThrow({
    where: { id: empresaClienteId },
    select: { valorVidaCentavos: true },
  });

  const vidas = await prisma.funcionario.count({
    where: {
      empresaClienteId,
      AND: [
        { OR: [{ dataAdmissao: null }, { dataAdmissao: { lt: fim } }] },
        { OR: [{ dataDemissao: null }, { dataDemissao: { gte: inicio } }] },
      ],
      NOT: { AND: [{ dataAdmissao: null }, { status: "DEMITIDO" }] },
    },
  });

  const grupos = await prisma.solicitacao.groupBy({
    by: ["tipoExame"],
    where: {
      empresaClienteId,
      criadoEm: { gte: inicio, lt: fim },
      status: { not: "CANCELADO" },
    },
    _count: { _all: true },
  });

  const examesPorTipo = grupos
    .map((g) => ({ tipo: g.tipoExame as string, quantidade: g._count._all }))
    .sort((a, b) => b.quantidade - a.quantidade);

  return {
    empresaClienteId,
    competencia: competenciaStr(comp),
    vidas,
    valorVidaCentavos: empresa.valorVidaCentavos,
    totalCentavos: vidas * empresa.valorVidaCentavos,
    examesPorTipo,
    totalExames: examesPorTipo.reduce((s, e) => s + e.quantidade, 0),
  };
}

export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
