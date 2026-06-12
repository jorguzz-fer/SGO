import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope, isCoordenacao } from "@/lib/session";
import {
  classificarVencimento,
  vencimentoPeriodico,
  SITUACAO_LABEL,
  type SituacaoExame,
} from "@/lib/pcmso";

export const dynamic = "force-dynamic";

const ORDEM: Record<SituacaoExame, number> = { VENCIDO: 0, VENCENDO: 1, SEM_DATA: 2, EM_DIA: 3 };
const COR: Record<SituacaoExame, string> = {
  VENCIDO: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  VENCENDO: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  EM_DIA: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  SEM_DATA: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export default async function PendenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const coordenacao = isCoordenacao(user.role);
  const hoje = new Date();

  const funcionarios = await prisma.funcionario.findMany({
    where: { ...tenantScope(user), status: "ATIVO" },
    take: 1000,
    include: {
      empresaCliente: { select: { razaoSocial: true } },
      solicitacoes: {
        where: { status: { in: ["ASO_EMITIDO", "CONCLUIDO"] } },
        orderBy: { criadoEm: "desc" },
        take: 1,
        select: { criadoEm: true },
      },
    },
  });

  let linhas = funcionarios.map((f) => {
    const ultimoExame = f.solicitacoes[0]?.criadoEm ?? null;
    const vencimento = vencimentoPeriodico(f.dataAdmissao, ultimoExame);
    const situacao = classificarVencimento(vencimento, hoje);
    return { f, ultimoExame, vencimento, situacao };
  });

  if (sp.situacao) linhas = linhas.filter((l) => l.situacao === sp.situacao);
  linhas.sort((a, b) => {
    const o = ORDEM[a.situacao] - ORDEM[b.situacao];
    if (o !== 0) return o;
    return (a.vencimento?.getTime() ?? Infinity) - (b.vencimento?.getTime() ?? Infinity);
  });

  const SITUACOES: ["", ...SituacaoExame[]] = ["", "VENCIDO", "VENCENDO", "EM_DIA", "SEM_DATA"];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pendências (periódico)</h1>
        <Link
          href="/painel/solicitacoes/nova"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Nova solicitação
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" action="/painel/pendencias">
        <select name="situacao" defaultValue={sp.situacao ?? ""} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          {SITUACOES.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "Todas as situações" : SITUACAO_LABEL[s]}
            </option>
          ))}
        </select>
        <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Funcionário</th>
              <th className="px-3 py-2">Tomador/Posto</th>
              <th className="px-3 py-2">Último exame</th>
              <th className="px-3 py-2">Vence em</th>
              <th className="px-3 py-2">Situação</th>
              {coordenacao && <th className="px-3 py-2">Empresa</th>}
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 && (
              <tr>
                <td colSpan={coordenacao ? 6 : 5} className="px-3 py-6 text-center text-zinc-500">
                  Nenhum funcionário nessa situação.
                </td>
              </tr>
            )}
            {linhas.map(({ f, ultimoExame, vencimento, situacao }) => (
              <tr key={f.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 font-medium">{f.nome}</td>
                <td className="px-3 py-2">{f.tomador ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-500">
                  {ultimoExame ? ultimoExame.toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-3 py-2">
                  {vencimento ? vencimento.toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${COR[situacao]}`}>
                    {SITUACAO_LABEL[situacao]}
                  </span>
                </td>
                {coordenacao && (
                  <td className="px-3 py-2 text-zinc-500">{f.empresaCliente.razaoSocial}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">
        Regra: periódico vence 12 meses após o último exame (ou a admissão). Janela de alerta: 30 dias.
      </p>
    </div>
  );
}
