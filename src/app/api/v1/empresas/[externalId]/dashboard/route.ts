import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiToken, problem } from "@/lib/api-auth";
import { classificarVencimento, vencimentoPeriodico } from "@/lib/pcmso";
import { calcularFatura, parseCompetencia } from "@/lib/faturamento";

/** Indicadores de gestão da empresa (consumidos pelo app Wow+). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ externalId: string }> },
) {
  const deny = requireApiToken(req);
  if (deny) return deny;

  const { externalId } = await params;
  const empresa = await prisma.empresaCliente.findFirst({
    where: { OR: [{ externalId }, { id: externalId }] },
    select: { id: true },
  });
  if (!empresa) return problem(404, "empresa_not_found", "Empresa não encontrada.");

  const comp = parseCompetencia(new URL(req.url).searchParams.get("competencia"));
  const hoje = new Date();

  const [ativos, base, fatura] = await Promise.all([
    prisma.funcionario.count({ where: { empresaClienteId: empresa.id, status: "ATIVO" } }),
    prisma.funcionario.findMany({
      where: { empresaClienteId: empresa.id, status: "ATIVO" },
      take: 5000,
      select: {
        dataAdmissao: true,
        solicitacoes: {
          where: { status: { in: ["ASO_EMITIDO", "CONCLUIDO"] } },
          orderBy: { criadoEm: "desc" },
          take: 1,
          select: { criadoEm: true },
        },
      },
    }),
    calcularFatura(empresa.id, comp),
  ]);

  let vencidos = 0;
  let vencendo = 0;
  for (const f of base) {
    const s = classificarVencimento(
      vencimentoPeriodico(f.dataAdmissao, f.solicitacoes[0]?.criadoEm ?? null),
      hoje,
    );
    if (s === "VENCIDO") vencidos++;
    else if (s === "VENCENDO") vencendo++;
  }

  return NextResponse.json({
    vidasAtivas: ativos,
    periodicosVencidos: vencidos,
    periodicosVencendo30d: vencendo,
    competencia: fatura.competencia,
    examesNaCompetencia: fatura.totalExames,
    examesPorTipo: fatura.examesPorTipo,
    faturamento: {
      vidasFaturaveis: fatura.vidas,
      valorVidaCentavos: fatura.valorVidaCentavos,
      totalCentavos: fatura.totalCentavos,
    },
  });
}
