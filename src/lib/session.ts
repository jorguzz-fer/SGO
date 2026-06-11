import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  role: Role;
  empresaClienteId: string | null;
  name?: string | null;
  email?: string | null;
};

/** Garante usuário autenticado em rotas/ações do servidor. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

export function isCoordenacao(role: Role): boolean {
  return role === "COORDENACAO" || role === "ADMIN";
}

/**
 * Multi-tenant: CLIENTE só enxerga a própria empresa.
 * COORDENACAO/ADMIN enxergam todas.
 */
export function tenantScope(user: SessionUser): { empresaClienteId?: string } {
  if (user.role === "CLIENTE") {
    return { empresaClienteId: user.empresaClienteId ?? "__sem_empresa__" };
  }
  return {};
}

/** Resolve a empresa-cliente alvo de uma operação. */
export function resolveEmpresaId(
  user: SessionUser,
  picked?: string | null,
): string | null {
  if (user.role === "CLIENTE") return user.empresaClienteId;
  return picked && picked.length > 0 ? picked : null;
}
