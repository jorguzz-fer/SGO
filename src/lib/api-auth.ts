import { NextResponse } from "next/server";

/**
 * Auth server-to-server da API v1 (consumida pelo app Wow+).
 * Bearer token estático via env SGO_API_TOKEN (rotacionável no Coolify).
 */
export function requireApiToken(req: Request): NextResponse | null {
  const expected = process.env.SGO_API_TOKEN;
  if (!expected) {
    // Falhe seguro: sem token configurado, a API fica fechada.
    return problem(503, "api_disabled", "API não configurada (SGO_API_TOKEN ausente).");
  }
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !timingSafeEqualStr(token, expected)) {
    return problem(401, "unauthorized", "Token inválido.");
  }
  return null;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Erro no formato RFC 7807 (application/problem+json). */
export function problem(
  status: number,
  type: string,
  detail: string,
): NextResponse {
  return NextResponse.json(
    { type, title: type, status, detail },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}
