import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope, isCoordenacao } from "@/lib/session";
import {
  STATUS_SOLICITACAO_LABEL,
  TIPO_EXAME_LABEL,
} from "@/lib/validations";

export const dynamic = "force-dynamic";

const STATUS = ["", "SOLICITADO", "ROTEADO", "AGENDADO", "REALIZADO", "ASO_EMITIDO", "CONCLUIDO", "CANCELADO"];

export default async function SolicitacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; modalidade?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const coordenacao = isCoordenacao(user.role);

  const where: Prisma.SolicitacaoWhereInput = { ...tenantScope(user) };
  if (sp.status) where.status = sp.status as Prisma.SolicitacaoWhereInput["status"];
  if (sp.modalidade)
    where.modalidade = sp.modalidade as Prisma.SolicitacaoWhereInput["modalidade"];

  const solicitacoes = await prisma.solicitacao.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    take: 200,
    include: {
      funcionario: { select: { nome: true, cidade: true, uf: true } },
      empresaCliente: { select: { razaoSocial: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {coordenacao ? "Caixa de solicitações" : "Solicitações"}
        </h1>
        <Link
          href="/painel/solicitacoes/nova"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Nova solicitação
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" action="/painel/solicitacoes">
        <select name="status" defaultValue={sp.status ?? ""} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "Todos os status" : STATUS_SOLICITACAO_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="modalidade" defaultValue={sp.modalidade ?? ""} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          <option value="">Todas as modalidades</option>
          <option value="TELEMEDICINA">Telemedicina</option>
          <option value="PRESENCIAL">Presencial</option>
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
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Modalidade</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Criada</th>
              {coordenacao && <th className="px-3 py-2">Empresa</th>}
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {solicitacoes.length === 0 && (
              <tr>
                <td colSpan={coordenacao ? 7 : 6} className="px-3 py-6 text-center text-zinc-500">
                  Nenhuma solicitação.
                </td>
              </tr>
            )}
            {solicitacoes.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 font-medium">{s.funcionario.nome}</td>
                <td className="px-3 py-2">{TIPO_EXAME_LABEL[s.tipoExame]}</td>
                <td className="px-3 py-2">{s.modalidade === "TELEMEDICINA" ? "Telemedicina" : "Presencial"}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    {STATUS_SOLICITACAO_LABEL[s.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-500">
                  {s.criadoEm.toLocaleDateString("pt-BR")}
                </td>
                {coordenacao && (
                  <td className="px-3 py-2 text-zinc-500">{s.empresaCliente.razaoSocial}</td>
                )}
                <td className="px-3 py-2">
                  <Link href={`/painel/solicitacoes/${s.id}`} className="text-sm underline">
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
