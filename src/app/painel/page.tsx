import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PainelHome() {
  const user = await requireUser();
  const scope = tenantScope(user);

  const [total, ativos, solicitacoes] = await Promise.all([
    prisma.funcionario.count({ where: scope }),
    prisma.funcionario.count({ where: { ...scope, status: "ATIVO" } }),
    prisma.solicitacao.count({ where: scope }),
  ]);

  const cards = [
    { label: "Vidas ativas", value: ativos },
    { label: "Funcionários (total)", value: total },
    { label: "Solicitações", value: solicitacoes },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Visão geral</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-sm text-zinc-500">{c.label}</div>
            <div className="mt-1 text-3xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Link
          href="/painel/funcionarios"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Ver funcionários
        </Link>
        <Link
          href="/painel/funcionarios/importar"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Importar base
        </Link>
      </div>
    </div>
  );
}
