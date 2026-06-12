// Smoke do faturamento por vida. Uso: DATABASE_URL=... tsx scripts/smoke-faturamento.ts
import { PrismaClient } from "@prisma/client";
import { calcularFatura, parseCompetencia, formatBRL } from "../src/lib/faturamento";

const prisma = new PrismaClient();

function check(nome: string, cond: boolean) {
  console.log(`${cond ? "OK " : "FALHOU"} - ${nome}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const dcas = await prisma.empresaCliente.findUniqueOrThrow({ where: { slug: "dcas" } });
  const comp = parseCompetencia("2026-06");

  // base controlada para a competência 2026-06
  await prisma.funcionario.deleteMany({
    where: { empresaClienteId: dcas.id, cpf: { startsWith: "999.FAT" } },
  });
  await prisma.funcionario.createMany({
    data: [
      // conta: admitido antes do fim do mês, sem demissão
      { empresaClienteId: dcas.id, cpf: "999.FAT-1", nome: "FAT Ativo", dataAdmissao: new Date("2025-01-10") },
      // conta: demitido DENTRO do mês (esteve ativo na competência)
      { empresaClienteId: dcas.id, cpf: "999.FAT-2", nome: "FAT Demitido no mês", dataAdmissao: new Date("2025-01-10"), dataDemissao: new Date("2026-06-15"), status: "DEMITIDO" },
      // NÃO conta: demitido antes do mês
      { empresaClienteId: dcas.id, cpf: "999.FAT-3", nome: "FAT Demitido antes", dataAdmissao: new Date("2025-01-10"), dataDemissao: new Date("2026-04-01"), status: "DEMITIDO" },
      // NÃO conta: admitido depois do mês
      { empresaClienteId: dcas.id, cpf: "999.FAT-4", nome: "FAT Futuro", dataAdmissao: new Date("2026-08-01") },
    ],
  });

  const fatura = await calcularFatura(dcas.id, comp);
  console.log("Fatura:", fatura.competencia, "| vidas:", fatura.vidas, "| total:", formatBRL(fatura.totalCentavos));
  console.log("Exames no mês:", fatura.totalExames, fatura.examesPorTipo);

  // os 4 de teste: 2 contam. (+ eventuais funcionários pré-existentes sem admissão e ativos)
  const extras = await prisma.funcionario.count({
    where: {
      empresaClienteId: dcas.id,
      cpf: { not: { startsWith: "999.FAT" } },
      dataAdmissao: null,
      status: { not: "DEMITIDO" },
    },
  });
  check(`vidas = extras(${extras}) + 2 do teste`, fatura.vidas === extras + 2);
  check("valor/vida default 19,90", fatura.valorVidaCentavos === 1990);
  check("total = vidas x valor", fatura.totalCentavos === fatura.vidas * 1990);

  await prisma.funcionario.deleteMany({
    where: { empresaClienteId: dcas.id, cpf: { startsWith: "999.FAT" } },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
