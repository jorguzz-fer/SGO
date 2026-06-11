// Smoke do fluxo de solicitação: criar (SOLICITADO) -> rotear (ROTEADO) + timeline.
// Uso: DATABASE_URL=... tsx scripts/smoke-solicitacao.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dcas = await prisma.empresaCliente.findUniqueOrThrow({ where: { slug: "dcas" } });
  const func = await prisma.funcionario.findFirstOrThrow({
    where: { empresaClienteId: dcas.id },
  });
  const medico = await prisma.medico.findFirstOrThrow({ where: { telemedicina: true } });

  // 1. Criar solicitação (SOLICITADO)
  const sol = await prisma.$transaction(async (tx) => {
    const s = await tx.solicitacao.create({
      data: {
        empresaClienteId: dcas.id,
        funcionarioId: func.id,
        tipoExame: "ADMISSIONAL",
        modalidade: "TELEMEDICINA",
        examesNecessarios: [{ tipo: "CLINICO" }, { tipo: "AUDIOMETRIA" }],
        status: "SOLICITADO",
      },
    });
    await tx.statusEvento.create({
      data: { solicitacaoId: s.id, paraStatus: "SOLICITADO" },
    });
    return s;
  });

  // 2. Rotear (ROTEADO) para o médico
  await prisma.$transaction(async (tx) => {
    await tx.solicitacao.update({
      where: { id: sol.id },
      data: { status: "ROTEADO", medicoId: medico.id },
    });
    await tx.statusEvento.create({
      data: { solicitacaoId: sol.id, deStatus: "SOLICITADO", paraStatus: "ROTEADO" },
    });
  });

  const final = await prisma.solicitacao.findUniqueOrThrow({
    where: { id: sol.id },
    include: {
      funcionario: { select: { nome: true } },
      medico: { select: { nome: true } },
      historico: { orderBy: { ocorridoEm: "asc" } },
    },
  });

  console.log("Funcionário:", final.funcionario.nome);
  console.log("Status final:", final.status, "| Médico:", final.medico?.nome);
  console.log(
    "Timeline:",
    final.historico.map((h) => h.paraStatus).join(" -> "),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
