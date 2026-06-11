/**
 * Ponto único de notificação (régua de comunicação).
 * Hoje só registra no log; vira e-mail transacional + webhook p/ o Wow+
 * (WebhookOutbox) nas próximas sprints. Falha de notificação nunca derruba a ação.
 */
export async function notify(
  evento: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    console.log(`[notify] ${evento}`, JSON.stringify(payload));
  } catch {
    // no-op
  }
}
