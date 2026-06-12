import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiToken, problem } from "@/lib/api-auth";

/** Status e dados de uma solicitação (consumida pelo app Wow+). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = requireApiToken(req);
  if (deny) return deny;

  const { id } = await params;
  const sol = await prisma.solicitacao.findFirst({
    where: { OR: [{ id }, { externalId: id }] },
    include: {
      funcionario: { select: { id: true, externalId: true, nome: true } },
      aso: { select: { parecer: true, emitidoEm: true } },
      historico: { orderBy: { ocorridoEm: "asc" }, select: { paraStatus: true, ocorridoEm: true } },
    },
  });
  if (!sol) return problem(404, "solicitacao_not_found", "Solicitação não encontrada.");

  return NextResponse.json({
    id: sol.id,
    externalId: sol.externalId,
    status: sol.status,
    tipoExame: sol.tipoExame,
    modalidade: sol.modalidade,
    parecer: sol.parecer,
    funcionario: sol.funcionario,
    aso: sol.aso
      ? { parecer: sol.aso.parecer, emitidoEm: sol.aso.emitidoEm.toISOString() }
      : null,
    historico: sol.historico.map((h) => ({
      status: h.paraStatus,
      em: h.ocorridoEm.toISOString(),
    })),
  });
}
