import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiToken, problem } from "@/lib/api-auth";
import { sexoEnum, statusEnum } from "@/lib/validations";

const schema = z.object({
  nome: z.string().trim().min(1),
  cpf: z.string().trim().min(1),
  rg: z.string().trim().optional(),
  sexo: sexoEnum.optional(),
  pis: z.string().trim().optional(),
  matriculaEsocial: z.string().trim().optional(),
  funcao: z.string().trim().optional(),
  cbo: z.string().trim().optional(),
  setor: z.string().trim().optional(),
  tomador: z.string().trim().optional(),
  centroCusto: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  uf: z.string().trim().max(2).optional(),
  foneCelular: z.string().trim().optional(),
  email: z.string().email().optional(),
  dataNascimento: z.coerce.date().optional(),
  dataAdmissao: z.coerce.date().optional(),
  dataDemissao: z.coerce.date().optional(),
  status: statusEnum.optional(),
});

/** Upsert de funcionário vindo do app Wow+ (chave: empresa externalId + funcionário externalId). */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ externalId: string; funcExternalId: string }> },
) {
  const deny = requireApiToken(req);
  if (deny) return deny;

  const { externalId, funcExternalId } = await params;
  const empresa = await prisma.empresaCliente.findUnique({
    where: { externalId },
    select: { id: true },
  });
  if (!empresa) return problem(404, "empresa_not_found", "Empresa não encontrada.");

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return problem(400, "invalid_body", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }

  const existente = await prisma.funcionario.findFirst({
    where: { empresaClienteId: empresa.id, externalId: funcExternalId },
    select: { id: true },
  });

  const data = { ...parsed.data, externalId: funcExternalId };
  const funcionario = existente
    ? await prisma.funcionario.update({ where: { id: existente.id }, data })
    : await prisma.funcionario.upsert({
        // sem registro pelo externalId: casa pelo CPF (importações antigas) ou cria
        where: { empresaClienteId_cpf: { empresaClienteId: empresa.id, cpf: parsed.data.cpf } },
        create: { empresaClienteId: empresa.id, ...data },
        update: data,
      });

  return NextResponse.json({ id: funcionario.id, externalId: funcExternalId });
}
