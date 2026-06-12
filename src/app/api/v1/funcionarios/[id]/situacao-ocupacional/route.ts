import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiToken, problem } from "@/lib/api-auth";
import {
  classificarVencimento,
  vencimentoPeriodico,
} from "@/lib/pcmso";

/** Situação ocupacional do funcionário (consumida pelo app Wow+). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = requireApiToken(req);
  if (deny) return deny;

  const { id } = await params;
  const funcionario = await prisma.funcionario.findFirst({
    where: { OR: [{ id }, { externalId: id }] },
    include: {
      solicitacoes: {
        where: { status: { in: ["ASO_EMITIDO", "CONCLUIDO"] } },
        orderBy: { criadoEm: "desc" },
        take: 1,
        select: { criadoEm: true, tipoExame: true, parecer: true },
      },
    },
  });
  if (!funcionario) return problem(404, "funcionario_not_found", "Funcionário não encontrado.");

  const ultimo = funcionario.solicitacoes[0] ?? null;
  const vencimento = vencimentoPeriodico(funcionario.dataAdmissao, ultimo?.criadoEm ?? null);
  const situacao = classificarVencimento(vencimento);

  return NextResponse.json({
    funcionarioId: funcionario.id,
    externalId: funcionario.externalId,
    status: funcionario.status,
    situacaoPeriodico: situacao, // EM_DIA | VENCENDO | VENCIDO | SEM_DATA
    proximoVencimento: vencimento?.toISOString() ?? null,
    ultimoExame: ultimo
      ? { data: ultimo.criadoEm.toISOString(), tipo: ultimo.tipoExame, parecer: ultimo.parecer }
      : null,
  });
}
