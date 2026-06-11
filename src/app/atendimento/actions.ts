"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { uploadObject } from "@/lib/storage";
import { verificarTokenAtendimento } from "@/lib/token";
import type { AtendState } from "./types";

const parecerEnum = z.enum(["APTO", "INAPTO"]);

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** Clínica agenda o atendimento presencial → AGENDADO. */
export async function agendarAtendimento(
  _prev: AtendState,
  fd: FormData,
): Promise<AtendState> {
  const token = str(fd, "token");
  const auth = token ? await verificarTokenAtendimento(token) : null;
  if (!auth) return { ok: false, error: "Link inválido ou expirado." };

  const sol = await prisma.solicitacao.findUnique({
    where: { id: auth.solicitacaoId },
    select: { id: true, status: true },
  });
  if (!sol) return { ok: false, error: "Solicitação não encontrada." };
  if (sol.status !== "ROTEADO") {
    return { ok: false, error: "Esta solicitação não está aguardando agendamento." };
  }

  const dataStr = str(fd, "dataAgendada");
  const dataAgendada = dataStr ? new Date(dataStr) : null;

  await prisma.$transaction(async (tx) => {
    await tx.solicitacao.update({
      where: { id: sol.id },
      data: { status: "AGENDADO", dataAgendada },
    });
    await tx.statusEvento.create({
      data: { solicitacaoId: sol.id, deStatus: "ROTEADO", paraStatus: "AGENDADO" },
    });
  });

  await notify("solicitacao.agendada", { solicitacaoId: sol.id, dataAgendada });
  revalidatePath(`/atendimento/${token}`);
  return { ok: true };
}

/** Médico/Clínica emite o ASO (upload do PDF) → REALIZADO + ASO_EMITIDO. */
export async function emitirAso(
  _prev: AtendState,
  fd: FormData,
): Promise<AtendState> {
  const token = str(fd, "token");
  const auth = token ? await verificarTokenAtendimento(token) : null;
  if (!auth) return { ok: false, error: "Link inválido ou expirado." };

  const sol = await prisma.solicitacao.findUnique({
    where: { id: auth.solicitacaoId },
    select: { id: true, status: true, funcionarioId: true },
  });
  if (!sol) return { ok: false, error: "Solicitação não encontrada." };
  if (sol.status === "ASO_EMITIDO" || sol.status === "CONCLUIDO") {
    return { ok: false, error: "ASO já emitido." };
  }

  const parecer = parecerEnum.safeParse(str(fd, "parecer"));
  if (!parecer.success) return { ok: false, error: "Informe o parecer (Apto/Inapto)." };

  const file = fd.get("aso");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Anexe o PDF do ASO." };
  }

  let arquivoKey: string;
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    arquivoKey = `asos/${sol.id}/${Date.now()}-${safe}`;
    await uploadObject(arquivoKey, buf, file.type || "application/pdf");
  } catch {
    return { ok: false, error: "Falha ao enviar o arquivo. Tente novamente." };
  }

  await prisma.$transaction(async (tx) => {
    if (sol.status !== "REALIZADO") {
      await tx.statusEvento.create({
        data: { solicitacaoId: sol.id, deStatus: sol.status, paraStatus: "REALIZADO" },
      });
    }
    await tx.aso.create({
      data: {
        solicitacaoId: sol.id,
        funcionarioId: sol.funcionarioId,
        arquivoKey,
        parecer: parecer.data,
      },
    });
    await tx.solicitacao.update({
      where: { id: sol.id },
      data: { status: "ASO_EMITIDO", parecer: parecer.data },
    });
    await tx.statusEvento.create({
      data: { solicitacaoId: sol.id, deStatus: "REALIZADO", paraStatus: "ASO_EMITIDO" },
    });
  });

  await notify("aso.emitido", { solicitacaoId: sol.id, parecer: parecer.data });
  revalidatePath(`/atendimento/${token}`);
  revalidatePath(`/painel/solicitacoes/${sol.id}`);
  return { ok: true };
}
