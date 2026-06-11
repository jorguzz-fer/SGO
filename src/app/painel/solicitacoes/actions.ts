"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { requireUser, tenantScope, isCoordenacao } from "@/lib/session";
import { tipoExameEnum, modalidadeEnum, exameEnum } from "@/lib/validations";
import type { SolFormState } from "./types";

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

type ExameItem = { tipo: string; detalhe?: string };

/** Cria uma solicitação (guia única) → status SOLICITADO + evento. */
export async function criarSolicitacao(
  _prev: SolFormState,
  fd: FormData,
): Promise<SolFormState> {
  const user = await requireUser();

  const funcionarioId = str(fd, "funcionarioId");
  if (!funcionarioId) return { ok: false, error: "Selecione o funcionário." };

  const funcionario = await prisma.funcionario.findFirst({
    where: { id: funcionarioId, ...tenantScope(user) },
    select: { id: true, empresaClienteId: true },
  });
  if (!funcionario) return { ok: false, error: "Funcionário inválido." };

  const tipo = tipoExameEnum.safeParse(str(fd, "tipoExame"));
  if (!tipo.success) return { ok: false, error: "Tipo de exame inválido." };

  const mod = modalidadeEnum.safeParse(str(fd, "modalidade"));
  if (!mod.success) return { ok: false, error: "Modalidade inválida." };

  const exames: ExameItem[] = [];
  for (const raw of fd.getAll("exames")) {
    if (typeof raw !== "string") continue;
    const e = exameEnum.safeParse(raw);
    if (!e.success) continue;
    if (e.data === "OUTROS") {
      exames.push({ tipo: "OUTROS", detalhe: str(fd, "outrosDetalhe") });
    } else {
      exames.push({ tipo: e.data });
    }
  }
  if (exames.length === 0) {
    return { ok: false, error: "Selecione ao menos um exame." };
  }

  const sol = await prisma.$transaction(async (tx) => {
    const s = await tx.solicitacao.create({
      data: {
        empresaClienteId: funcionario.empresaClienteId,
        funcionarioId: funcionario.id,
        tipoExame: tipo.data,
        modalidade: mod.data,
        examesNecessarios: exames,
        observacoes: str(fd, "observacoes"),
        criadoPorId: user.id,
        status: "SOLICITADO",
      },
    });
    await tx.statusEvento.create({
      data: { solicitacaoId: s.id, paraStatus: "SOLICITADO", autorId: user.id },
    });
    return s;
  });

  await notify("solicitacao.criada", {
    solicitacaoId: sol.id,
    funcionarioId: funcionario.id,
    modalidade: mod.data,
  });

  revalidatePath("/painel/solicitacoes");
  revalidatePath("/painel");
  redirect(`/painel/solicitacoes/${sol.id}`);
}

/** Coordenação roteia a solicitação para médico (telemedicina) ou clínica (presencial). */
export async function rotearSolicitacao(
  _prev: SolFormState,
  fd: FormData,
): Promise<SolFormState> {
  const user = await requireUser();
  if (!isCoordenacao(user.role)) {
    return { ok: false, error: "Sem permissão para rotear." };
  }

  const solicitacaoId = str(fd, "solicitacaoId");
  if (!solicitacaoId) return { ok: false, error: "Solicitação inválida." };

  const sol = await prisma.solicitacao.findUnique({
    where: { id: solicitacaoId },
    select: { id: true, status: true, modalidade: true },
  });
  if (!sol) return { ok: false, error: "Solicitação não encontrada." };

  const medicoId = str(fd, "medicoId");
  const clinicaId = str(fd, "clinicaId");

  if (sol.modalidade === "TELEMEDICINA" && !medicoId) {
    return { ok: false, error: "Selecione o médico." };
  }
  if (sol.modalidade === "PRESENCIAL" && !clinicaId) {
    return { ok: false, error: "Selecione a clínica." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.solicitacao.update({
      where: { id: sol.id },
      data: {
        status: "ROTEADO",
        medicoId: sol.modalidade === "TELEMEDICINA" ? medicoId : null,
        clinicaId: sol.modalidade === "PRESENCIAL" ? clinicaId : null,
      },
    });
    await tx.statusEvento.create({
      data: {
        solicitacaoId: sol.id,
        deStatus: sol.status,
        paraStatus: "ROTEADO",
        autorId: user.id,
      },
    });
  });

  await notify("solicitacao.roteada", {
    solicitacaoId: sol.id,
    destino: sol.modalidade === "TELEMEDICINA" ? { medicoId } : { clinicaId },
  });

  revalidatePath(`/painel/solicitacoes/${sol.id}`);
  revalidatePath("/painel/solicitacoes");
  redirect(`/painel/solicitacoes/${sol.id}`);
}

/** Cliente/Coordenação marca a solicitação como concluída (após baixar o ASO). */
export async function concluirSolicitacao(fd: FormData): Promise<void> {
  const user = await requireUser();
  const solicitacaoId = str(fd, "solicitacaoId");
  if (!solicitacaoId) return;

  const sol = await prisma.solicitacao.findFirst({
    where: { id: solicitacaoId, ...tenantScope(user) },
    select: { id: true, status: true },
  });
  if (!sol || sol.status !== "ASO_EMITIDO") return;

  await prisma.$transaction(async (tx) => {
    await tx.solicitacao.update({
      where: { id: sol.id },
      data: { status: "CONCLUIDO" },
    });
    await tx.statusEvento.create({
      data: {
        solicitacaoId: sol.id,
        deStatus: "ASO_EMITIDO",
        paraStatus: "CONCLUIDO",
        autorId: user.id,
      },
    });
  });

  await notify("solicitacao.concluida", { solicitacaoId: sol.id });
  revalidatePath(`/painel/solicitacoes/${sol.id}`);
  revalidatePath("/painel/solicitacoes");
  redirect(`/painel/solicitacoes/${sol.id}`);
}
