import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiToken, problem } from "@/lib/api-auth";
import { notify } from "@/lib/notify";
import { tipoExameEnum, modalidadeEnum, exameEnum } from "@/lib/validations";

const schema = z.object({
  funcionarioId: z.string().trim().min(1), // id interno ou externalId
  tipoExame: tipoExameEnum,
  modalidade: modalidadeEnum,
  exames: z
    .array(z.object({ tipo: exameEnum, detalhe: z.string().optional() }))
    .min(1),
  observacoes: z.string().optional(),
  externalId: z.string().optional(), // id da solicitação no Wow+ (idempotência)
});

/** Cria uma solicitação de exame vinda do app Wow+. */
export async function POST(req: Request) {
  const deny = requireApiToken(req);
  if (deny) return deny;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return problem(400, "invalid_body", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  const data = parsed.data;

  // idempotência por externalId
  if (data.externalId) {
    const existente = await prisma.solicitacao.findFirst({
      where: { externalId: data.externalId },
      select: { id: true, status: true },
    });
    if (existente) {
      return NextResponse.json({ id: existente.id, status: existente.status }, { status: 200 });
    }
  }

  const funcionario = await prisma.funcionario.findFirst({
    where: { OR: [{ id: data.funcionarioId }, { externalId: data.funcionarioId }] },
    select: { id: true, empresaClienteId: true },
  });
  if (!funcionario) return problem(404, "funcionario_not_found", "Funcionário não encontrado.");

  const sol = await prisma.$transaction(async (tx) => {
    const s = await tx.solicitacao.create({
      data: {
        empresaClienteId: funcionario.empresaClienteId,
        funcionarioId: funcionario.id,
        tipoExame: data.tipoExame,
        modalidade: data.modalidade,
        examesNecessarios: data.exames,
        observacoes: data.observacoes,
        externalId: data.externalId,
        status: "SOLICITADO",
      },
    });
    await tx.statusEvento.create({
      data: { solicitacaoId: s.id, paraStatus: "SOLICITADO", meta: { origem: "api-wowmais" } },
    });
    return s;
  });

  await notify("solicitacao.criada", {
    solicitacaoId: sol.id,
    funcionarioId: funcionario.id,
    modalidade: data.modalidade,
    origem: "api",
  });

  return NextResponse.json({ id: sol.id, status: sol.status }, { status: 201 });
}
