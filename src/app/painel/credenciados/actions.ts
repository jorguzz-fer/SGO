"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, isCoordenacao } from "@/lib/session";
import type { CredState } from "./types";

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export async function createClinica(
  _prev: CredState,
  fd: FormData,
): Promise<CredState> {
  const user = await requireUser();
  if (!isCoordenacao(user.role)) return { ok: false, error: "Sem permissão." };

  const nome = str(fd, "nome");
  if (!nome) return { ok: false, error: "Informe o nome da clínica." };

  await prisma.clinica.create({
    data: {
      nome,
      cnpj: str(fd, "cnpj"),
      endereco: str(fd, "endereco"),
      cidade: str(fd, "cidade"),
      uf: str(fd, "uf")?.toUpperCase(),
      horarios: str(fd, "horarios"),
      contato: str(fd, "contato"),
    },
  });

  revalidatePath("/painel/credenciados");
  return { ok: true };
}

export async function createMedico(
  _prev: CredState,
  fd: FormData,
): Promise<CredState> {
  const user = await requireUser();
  if (!isCoordenacao(user.role)) return { ok: false, error: "Sem permissão." };

  const nome = str(fd, "nome");
  const crm = str(fd, "crm");
  if (!nome || !crm) return { ok: false, error: "Informe nome e CRM." };

  await prisma.medico.create({
    data: {
      nome,
      crm,
      especialidade: str(fd, "especialidade"),
      telemedicina: fd.get("telemedicina") === "on",
    },
  });

  revalidatePath("/painel/credenciados");
  return { ok: true };
}
