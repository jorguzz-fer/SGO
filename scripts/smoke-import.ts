// Smoke test da pipeline de importação (papaparse + zod + upsert).
// Uso: DATABASE_URL=... tsx scripts/smoke-import.ts
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";
import {
  funcionarioSchema,
  parseDateBR,
  parseSexo,
  parseStatus,
} from "../src/lib/validations";

const prisma = new PrismaClient();

const CSV = `cpf,nome,sexo,data_nascimento,funcao,setor,tomador,cidade,uf,status
142.277.878-90,MARCIA DA SILVA RODRIGUES,F,23/02/2004,AUXILIAR DE SERVICOS GERAIS,FA ROSEIRA,PRYSMIAN - SOROCABA,Sorocaba,SP,ATIVO
,SEM CPF DEVE FALHAR,M,01/01/1990,CARREGADOR,,,Osasco,SP,ATIVO
142.277.878-90,MARCIA RODRIGUES (ATUALIZADA),F,23/02/2004,AUX SERVICOS GERAIS,FA ROSEIRA,PRYSMIAN - POCOS DE CALDAS,Pocos de Caldas,MG,ATIVO`;

async function main() {
  const dcas = await prisma.empresaCliente.findUniqueOrThrow({
    where: { slug: "dcas" },
  });

  const parsed = Papa.parse<Record<string, string>>(CSV, {
    header: true,
    skipEmptyLines: true,
  });

  let criados = 0;
  let atualizados = 0;
  const erros: string[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const r = parsed.data[i];
    const get = (k: string) => (r[k] && r[k].length > 0 ? r[k] : undefined);
    const result = funcionarioSchema.safeParse({
      nome: get("nome"),
      cpf: get("cpf"),
      sexo: parseSexo(get("sexo")),
      funcao: get("funcao"),
      setor: get("setor"),
      tomador: get("tomador"),
      cidade: get("cidade"),
      uf: get("uf"),
      dataNascimento: parseDateBR(get("data_nascimento")) ?? undefined,
      status: parseStatus(get("status")),
    });
    if (!result.success) {
      erros.push(`linha ${i + 2}: ${result.error.issues.map((x) => x.message).join("; ")}`);
      continue;
    }
    const existing = await prisma.funcionario.findUnique({
      where: { empresaClienteId_cpf: { empresaClienteId: dcas.id, cpf: result.data.cpf } },
      select: { id: true },
    });
    await prisma.funcionario.upsert({
      where: { empresaClienteId_cpf: { empresaClienteId: dcas.id, cpf: result.data.cpf } },
      create: { empresaClienteId: dcas.id, ...result.data },
      update: { ...result.data },
    });
    if (existing) atualizados++;
    else criados++;
  }

  const total = await prisma.funcionario.count({ where: { empresaClienteId: dcas.id } });
  const m = await prisma.funcionario.findFirst({ where: { cpf: "142.277.878-90" } });

  console.log("RESULTADO:", { criados, atualizados, erros });
  console.log("TOTAL na DCAS:", total);
  console.log("Upsert aplicado (nome/tomador atualizados):", m?.nome, "|", m?.tomador);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
