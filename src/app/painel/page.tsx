import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope } from "@/lib/session";
import { classificarVencimento, vencimentoPeriodico } from "@/lib/pcmso";

export const dynamic = "force-dynamic";

export default async function PainelHome() {
  const user = await requireUser();
  const scope = tenantScope(user);
  const hoje = new Date();

  const [total, ativos, solicitacoes, baseAtiva] = await Promise.all([
    prisma.funcionario.count({ where: scope }),
    prisma.funcionario.count({ where: { ...scope, status: "ATIVO" } }),
    prisma.solicitacao.count({ where: scope }),
    prisma.funcionario.findMany({
      where: { ...scope, status: "ATIVO" },
      take: 5000,
      select: {
        dataAdmissao: true,
        solicitacoes: {
          where: { status: { in: ["ASO_EMITIDO", "CONCLUIDO"] } },
          orderBy: { criadoEm: "desc" },
          take: 1,
          select: { criadoEm: true },
        },
      },
    }),
  ]);

  let vencidos = 0;
  let vencendo = 0;
  for (const f of baseAtiva) {
    const venc = vencimentoPeriodico(f.dataAdmissao, f.solicitacoes[0]?.criadoEm ?? null);
    const s = classificarVencimento(venc, hoje);
    if (s === "VENCIDO") vencidos++;
    else if (s === "VENCENDO") vencendo++;
  }

  const cards = [
    { label: "Vidas ativas", value: ativos },
    { label: "Funcionários (total)", value: total },
    { label: "Solicitações", value: solicitacoes },
    { label: "Periódicos vencidos", value: vencidos, alerta: vencidos > 0 },
    { label: "Vencendo (30 dias)", value: vencendo, aviso: vencendo > 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Visão geral</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-sm text-zinc-500">{c.label}</div>
            <div
              className={`mt-1 text-3xl font-bold ${
                c.alerta ? "text-red-600" : c.aviso ? "text-amber-600" : ""
              }`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/painel/pendencias" className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Ver pendências
        </Link>
        <Link href="/painel/funcionarios" className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Funcionários
        </Link>
        <Link href="/painel/solicitacoes/nova" className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
          Nova solicitação
        </Link>
      </div>
    </div>
  );
}
