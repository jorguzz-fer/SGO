"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/storage";
import { requireUser, isCoordenacao } from "@/lib/session";
import { parseDateBR } from "@/lib/validations";
import type { DocState } from "./types";

const tipoDocEnum = z.enum(["PCMSO", "PGR", "OUTRO"]);

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** Coordenação publica um documento (PCMSO/PGR) da empresa-cliente. */
export async function uploadDocumento(
  _prev: DocState,
  fd: FormData,
): Promise<DocState> {
  const user = await requireUser();
  if (!isCoordenacao(user.role)) return { ok: false, error: "Sem permissão." };

  const empresaClienteId = str(fd, "empresaClienteId");
  if (!empresaClienteId) return { ok: false, error: "Selecione a empresa-cliente." };

  const tipo = tipoDocEnum.safeParse(str(fd, "tipo"));
  if (!tipo.success) return { ok: false, error: "Tipo de documento inválido." };

  const file = fd.get("arquivo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Anexe o arquivo (PDF)." };
  }

  let arquivoKey: string;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    arquivoKey = `documentos/${empresaClienteId}/${Date.now()}-${safe}`;
    await uploadObject(arquivoKey, buf, file.type || "application/pdf");
  } catch {
    return { ok: false, error: "Falha ao enviar o arquivo. Tente novamente." };
  }

  await prisma.documento.create({
    data: {
      empresaClienteId,
      tipo: tipo.data,
      arquivoKey,
      versao: str(fd, "versao"),
      vigenciaInicio: parseDateBR(str(fd, "vigenciaInicio")),
      vigenciaFim: parseDateBR(str(fd, "vigenciaFim")),
    },
  });

  revalidatePath("/painel/documentos");
  return { ok: true };
}
