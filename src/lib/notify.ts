import { enqueueWebhook } from "@/lib/webhook";

/**
 * Ponto único de notificação (régua de comunicação).
 * Registra no log e enfileira o evento no WebhookOutbox (entrega ao app Wow+
 * quando WOWMAIS_WEBHOOK_URL estiver configurada). E-mail transacional entra
 * nesta mesma função no futuro. Falha de notificação nunca derruba a ação.
 */
export async function notify(
  evento: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    console.log(`[notify] ${evento}`, JSON.stringify(payload));
    await enqueueWebhook(evento, payload);
  } catch {
    // no-op
  }
}
