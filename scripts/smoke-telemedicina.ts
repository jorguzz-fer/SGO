// Smoke do ciclo de telemedicina: criar -> rotear -> token -> emitir ASO -> concluir.
// Upload real ao MinIO é substituído por chave "stub" (sem storage local).
// Uso: DATABASE_URL=... AUTH_SECRET=... tsx scripts/smoke-telemedicina.ts
import { PDFDocument } from "pdf-lib";
import { PrismaClient } from "@prisma/client";
import {
  criarTokenAtendimento,
  verificarTokenAtendimento,
} from "../src/lib/token";

const prisma = new PrismaClient();

async function main() {
  const dcas = await prisma.empresaCliente.findUniqueOrThrow({ where: { slug: "dcas" } });
  const func = await prisma.funcionario.findFirstOrThrow({ where: { empresaClienteId: dcas.id } });
  const medico = await prisma.medico.findFirstOrThrow({ where: { telemedicina: true } });

  // criar + rotear
  const sol = await prisma.solicitacao.create({
    data: {
      empresaClienteId: dcas.id,
      funcionarioId: func.id,
      tipoExame: "PERIODICO",
      modalidade: "TELEMEDICINA",
      examesNecessarios: [{ tipo: "CLINICO" }],
      status: "ROTEADO",
      medicoId: medico.id,
      historico: { create: [{ paraStatus: "SOLICITADO" }, { deStatus: "SOLICITADO", paraStatus: "ROTEADO" }] },
    },
  });

  // token roundtrip
  const token = await criarTokenAtendimento({ solicitacaoId: sol.id, escopo: "MEDICO" });
  const verificado = await verificarTokenAtendimento(token);
  const tokenOk = verificado?.solicitacaoId === sol.id && verificado?.escopo === "MEDICO";

  // emitir ASO (stub key)
  await prisma.$transaction(async (tx) => {
    await tx.statusEvento.create({ data: { solicitacaoId: sol.id, deStatus: "ROTEADO", paraStatus: "REALIZADO" } });
    await tx.aso.create({
      data: { solicitacaoId: sol.id, funcionarioId: func.id, arquivoKey: `asos/${sol.id}/stub.pdf`, parecer: "APTO" },
    });
    await tx.solicitacao.update({ where: { id: sol.id }, data: { status: "ASO_EMITIDO", parecer: "APTO" } });
    await tx.statusEvento.create({ data: { solicitacaoId: sol.id, deStatus: "REALIZADO", paraStatus: "ASO_EMITIDO" } });
  });

  // concluir
  await prisma.$transaction(async (tx) => {
    await tx.solicitacao.update({ where: { id: sol.id }, data: { status: "CONCLUIDO" } });
    await tx.statusEvento.create({ data: { solicitacaoId: sol.id, deStatus: "ASO_EMITIDO", paraStatus: "CONCLUIDO" } });
  });

  const final = await prisma.solicitacao.findUniqueOrThrow({
    where: { id: sol.id },
    include: { aso: true, historico: { orderBy: { ocorridoEm: "asc" } } },
  });

  // pdf-lib sanity
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("GUIA DE ENCAMINHAMENTO");
  const bytes = await pdf.save();

  console.log("Token assinado válido:", tokenOk);
  console.log("Timeline:", final.historico.map((h) => h.paraStatus).join(" -> "));
  console.log("ASO:", final.aso?.parecer, "| key:", final.aso?.arquivoKey);
  console.log("PDF gerado (bytes):", bytes.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
