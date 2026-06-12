import { createHmac } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Outbox de webhooks p/ o app Wow+ (docs/spec-integracao-wowmais-api.md §5).
 * Grava o evento no banco (auditoria) e tenta entregar imediatamente quando
 * WOWMAIS_WEBHOOK_URL está configurada. Pendências podem ser reentregues
 * depois (tarefa agendada). Falha de entrega nunca derruba a ação de negócio.
 */
export async function enqueueWebhook(
  tipo: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const evt = await prisma.webhookOutbox.create({
      data: { tipo, payload: payload as Prisma.InputJsonValue },
    });
    // fire-and-forget: não bloqueia a ação do usuário
    void dispatchWebhook(evt.id).catch(() => undefined);
  } catch {
    // auditoria de webhook nunca derruba o fluxo
  }
}

export async function dispatchWebhook(id: string): Promise<boolean> {
  const url = process.env.WOWMAIS_WEBHOOK_URL;
  if (!url) return false;

  const evt = await prisma.webhookOutbox.findUnique({ where: { id } });
  if (!evt || evt.entregue) return evt?.entregue ?? false;

  const body = JSON.stringify({
    id: evt.id,
    type: evt.tipo,
    occurredAt: evt.criadoEm.toISOString(),
    data: evt.payload,
  });

  const secret = process.env.WOWMAIS_WEBHOOK_SECRET ?? "";
  const signature = createHmac("sha256", secret).update(body).digest("hex");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature": `hmac-sha256=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    await prisma.webhookOutbox.update({
      where: { id },
      data: { entregue: res.ok, tentativas: { increment: 1 } },
    });
    return res.ok;
  } catch {
    await prisma.webhookOutbox.update({
      where: { id },
      data: { tentativas: { increment: 1 } },
    });
    return false;
  }
}

/** Reentrega pendentes (p/ tarefa agendada futura). */
export async function dispatchPendentes(limit = 50): Promise<number> {
  const pendentes = await prisma.webhookOutbox.findMany({
    where: { entregue: false, tentativas: { lt: 10 } },
    orderBy: { criadoEm: "asc" },
    take: limit,
    select: { id: true },
  });
  let ok = 0;
  for (const p of pendentes) {
    if (await dispatchWebhook(p.id)) ok++;
  }
  return ok;
}
