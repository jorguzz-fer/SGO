import { SignJWT, jwtVerify } from "jose";

/** Token assinado de acesso a 1 evento (médico/clínica), com expiração. */
export type EscopoAtendimento = "MEDICO" | "CLINICA";
export type AtendimentoToken = {
  solicitacaoId: string;
  escopo: EscopoAtendimento;
};

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-troque-em-producao",
  );
}

export async function criarTokenAtendimento(
  data: AtendimentoToken,
  ttlHoras = 72,
): Promise<string> {
  return new SignJWT({ solicitacaoId: data.solicitacaoId, escopo: data.escopo })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlHoras}h`)
    .sign(secret());
}

export async function verificarTokenAtendimento(
  token: string,
): Promise<AtendimentoToken | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const escopo = payload.escopo;
    if (
      typeof payload.solicitacaoId === "string" &&
      (escopo === "MEDICO" || escopo === "CLINICA")
    ) {
      return { solicitacaoId: payload.solicitacaoId, escopo };
    }
    return null;
  } catch {
    return null;
  }
}

/** Monta a URL pública do magic-link. */
export function linkAtendimento(token: string): string {
  const base = process.env.AUTH_URL?.replace(/\/$/, "") ?? "";
  return `${base}/atendimento/${token}`;
}
