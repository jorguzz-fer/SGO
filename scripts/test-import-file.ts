// Valida um CSV pelo pipeline real de importacao (zod + upsert).
// Uso: DATABASE_URL=... tsx scripts/test-import-file.ts <caminho.csv>
import fs from "fs";
import Papa from "papaparse";
import { PrismaClient } from "@prisma/client";
import {
  funcionarioSchema,
  parseDateBR,
  parseSexo,
  parseStatus,
} from "../src/lib/validations";

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  const text = fs.readFileSync(file, "utf-8");
  const dcas = await prisma.empresaCliente.findUniqueOrThrow({ where: { slug: "dcas" } });

  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const norm = (r: Record<string, string>) => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) o[k.trim().toLowerCase()] = (v ?? "").trim();
    return o;
  };

  let criados = 0, atualizados = 0;
  const erros: string[] = [];
  for (let i = 0; i < parsed.data.length; i++) {
    const r = norm(parsed.data[i]);
    const get = (k: string) => (r[k] && r[k].length > 0 ? r[k] : undefined);
    const res = funcionarioSchema.safeParse({
      nome: get("nome"), cpf: get("cpf"), rg: get("rg"), sexo: parseSexo(get("sexo")),
      pis: get("pis"), ctps: get("ctps"), ctpsSerie: get("ctps_serie"),
      matriculaEsocial: get("matricula_esocial"), funcao: get("funcao"), cbo: get("cbo"),
      setor: get("setor"), tomador: get("tomador"), centroCusto: get("centro_custo"),
      cidade: get("cidade"), uf: get("uf"), foneCelular: get("fone_celular"),
      foneResidencial: get("fone_residencial"), email: get("email"),
      dataNascimento: parseDateBR(get("data_nascimento")) ?? undefined,
      dataAdmissao: parseDateBR(get("data_admissao")) ?? undefined,
      dataDemissao: parseDateBR(get("data_demissao")) ?? undefined,
      status: parseStatus(get("status")),
    });
    if (!res.success) {
      erros.push(`linha ${i + 2}: ${res.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
      continue;
    }
    const ex = await prisma.funcionario.findUnique({
      where: { empresaClienteId_cpf: { empresaClienteId: dcas.id, cpf: res.data.cpf } },
      select: { id: true },
    });
    await prisma.funcionario.upsert({
      where: { empresaClienteId_cpf: { empresaClienteId: dcas.id, cpf: res.data.cpf } },
      create: { empresaClienteId: dcas.id, ...res.data },
      update: { ...res.data },
    });
    ex ? atualizados++ : criados++;
  }

  const total = await prisma.funcionario.count({ where: { empresaClienteId: dcas.id } });
  const afast = await prisma.funcionario.count({ where: { empresaClienteId: dcas.id, status: "AFASTADO" } });
  console.log(`Linhas no CSV: ${parsed.data.length}`);
  console.log(`Criados: ${criados} | Atualizados: ${atualizados} | Erros: ${erros.length}`);
  console.log(`Total DCAS no banco: ${total} | Afastados: ${afast}`);
  if (erros.length) console.log("Primeiros erros:\n" + erros.slice(0, 10).join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
