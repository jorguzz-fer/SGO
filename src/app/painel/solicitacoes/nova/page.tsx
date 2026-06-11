import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope } from "@/lib/session";
import NovaForm from "../_NovaForm";

export const dynamic = "force-dynamic";

export default async function NovaSolicitacaoPage() {
  const user = await requireUser();
  const funcionarios = await prisma.funcionario.findMany({
    where: { ...tenantScope(user), status: "ATIVO" },
    orderBy: { nome: "asc" },
    take: 500,
    select: { id: true, nome: true, cidade: true, uf: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/painel/solicitacoes" className="text-sm text-zinc-500 hover:underline">
          ← Solicitações
        </Link>
        <h1 className="text-2xl font-bold">Nova solicitação</h1>
      </div>
      {funcionarios.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nenhum funcionário ativo. <Link href="/painel/funcionarios/importar" className="underline">Importe a base</Link> primeiro.
        </p>
      ) : (
        <NovaForm funcionarios={funcionarios} />
      )}
    </div>
  );
}
