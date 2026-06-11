"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, resolveEmpresaId } from "@/lib/session";
import {
  funcionarioSchema,
  parseDateBR,
  parseSexo,
  parseStatus,
} from "@/lib/validations";
import type { FormState, ImportError, ImportState } from "./types";

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** Cria/atualiza um funcionário (upsert por CPF dentro da empresa). */
export async function createFuncionario(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const empresaClienteId = resolveEmpresaId(user, str(fd, "empresaClienteId"));
  if (!empresaClienteId) {
    return { ok: false, error: "Selecione a empresa-cliente." };
  }

  const parsed = funcionarioSchema.safeParse({
    nome: str(fd, "nome"),
    cpf: str(fd, "cpf"),
    rg: str(fd, "rg"),
    sexo: parseSexo(str(fd, "sexo")),
    funcao: str(fd, "funcao"),
    cbo: str(fd, "cbo"),
    setor: str(fd, "setor"),
    tomador: str(fd, "tomador"),
    centroCusto: str(fd, "centroCusto"),
    cidade: str(fd, "cidade"),
    uf: str(fd, "uf"),
    foneCelular: str(fd, "foneCelular"),
    email: str(fd, "email"),
    dataNascimento: parseDateBR(str(fd, "dataNascimento")) ?? undefined,
    dataAdmissao: parseDateBR(str(fd, "dataAdmissao")) ?? undefined,
    status: parseStatus(str(fd, "status")),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  await prisma.funcionario.upsert({
    where: {
      empresaClienteId_cpf: { empresaClienteId, cpf: parsed.data.cpf },
    },
    create: { empresaClienteId, ...parsed.data },
    update: { ...parsed.data },
  });

  revalidatePath("/painel/funcionarios");
  revalidatePath("/painel");
  redirect("/painel/funcionarios");
}

function norm(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.trim().toLowerCase()] = typeof v === "string" ? v.trim() : "";
  }
  return out;
}

/** Importa a base de funcionários a partir de um CSV (upsert por CPF). */
export async function importFuncionarios(
  _prev: ImportState,
  fd: FormData,
): Promise<ImportState> {
  const user = await requireUser();
  const empresaClienteId = resolveEmpresaId(user, str(fd, "empresaClienteId"));
  if (!empresaClienteId) {
    return { ok: false, criados: 0, atualizados: 0, erros: [{ linha: 0, motivo: "Selecione a empresa-cliente." }] };
  }

  const file = fd.get("arquivo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, criados: 0, atualizados: 0, erros: [{ linha: 0, motivo: "Envie um arquivo CSV." }] };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const erros: ImportError[] = [];
  let criados = 0;
  let atualizados = 0;

  for (let i = 0; i < parsed.data.length; i++) {
    const linha = i + 2; // +1 cabeçalho, +1 base 1
    const r = norm(parsed.data[i]);
    const get = (k: string) => (r[k] && r[k].length > 0 ? r[k] : undefined);

    const result = funcionarioSchema.safeParse({
      nome: get("nome"),
      cpf: get("cpf"),
      rg: get("rg"),
      sexo: parseSexo(get("sexo")),
      pis: get("pis"),
      ctps: get("ctps"),
      ctpsSerie: get("ctps_serie"),
      matriculaEsocial: get("matricula_esocial"),
      funcao: get("funcao"),
      cbo: get("cbo"),
      setor: get("setor"),
      tomador: get("tomador"),
      centroCusto: get("centro_custo"),
      cidade: get("cidade"),
      uf: get("uf"),
      foneCelular: get("fone_celular"),
      foneResidencial: get("fone_residencial"),
      email: get("email"),
      dataNascimento: parseDateBR(get("data_nascimento")) ?? undefined,
      dataAdmissao: parseDateBR(get("data_admissao")) ?? undefined,
      dataDemissao: parseDateBR(get("data_demissao")) ?? undefined,
      status: parseStatus(get("status")),
    });

    if (!result.success) {
      erros.push({
        linha,
        motivo: result.error.issues.map((x) => x.message).join("; "),
      });
      continue;
    }

    try {
      const existing = await prisma.funcionario.findUnique({
        where: {
          empresaClienteId_cpf: { empresaClienteId, cpf: result.data.cpf },
        },
        select: { id: true },
      });
      await prisma.funcionario.upsert({
        where: {
          empresaClienteId_cpf: { empresaClienteId, cpf: result.data.cpf },
        },
        create: { empresaClienteId, ...result.data },
        update: { ...result.data },
      });
      if (existing) atualizados++;
      else criados++;
    } catch {
      erros.push({ linha, motivo: "Falha ao gravar no banco." });
    }
  }

  revalidatePath("/painel/funcionarios");
  revalidatePath("/painel");
  return { ok: erros.length === 0, criados, atualizados, erros };
}
