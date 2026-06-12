import { prisma } from "@/lib/prisma";
import { requireUser, isCoordenacao } from "@/lib/session";
import {
  calcularFatura,
  competenciaStr,
  formatBRL,
  parseCompetencia,
} from "@/lib/faturamento";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FaturamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ competencia?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const comp = parseCompetencia(sp.competencia);
  const compStr = competenciaStr(comp);

  const empresas = isCoordenacao(user.role)
    ? await prisma.empresaCliente.findMany({
        orderBy: { razaoSocial: "asc" },
        select: { id: true, razaoSocial: true },
      })
    : user.empresaClienteId
      ? await prisma.empresaCliente.findMany({
          where: { id: user.empresaClienteId },
          select: { id: true, razaoSocial: true },
        })
      : [];

  if (empresas.length === 0) redirect("/painel");

  const faturas = await Promise.all(
    empresas.map(async (e) => ({
      empresa: e,
      fatura: await calcularFatura(e.id, comp),
    })),
  );

  const totalGeral = faturas.reduce((s, f) => s + f.fatura.totalCentavos, 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Faturamento por vida</h1>

      <form className="flex flex-wrap items-end gap-2" action="/painel/faturamento">
        <label className="block text-sm">
          Competência
          <input
            type="month"
            name="competencia"
            defaultValue={compStr}
            className="mt-1 block rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
          Calcular
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2">Vidas faturáveis</th>
              <th className="px-3 py-2">Valor/vida</th>
              <th className="px-3 py-2">Exames no mês</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {faturas.map(({ empresa, fatura }) => (
              <tr key={empresa.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 font-medium">{empresa.razaoSocial}</td>
                <td className="px-3 py-2">{fatura.vidas}</td>
                <td className="px-3 py-2">{formatBRL(fatura.valorVidaCentavos)}</td>
                <td className="px-3 py-2">{fatura.totalExames}</td>
                <td className="px-3 py-2 font-medium">{formatBRL(fatura.totalCentavos)}</td>
                <td className="px-3 py-2">
                  <a
                    href={`/painel/faturamento/${empresa.id}/fatura?competencia=${compStr}`}
                    target="_blank"
                    className="underline"
                  >
                    Fatura (PDF)
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
          {faturas.length > 1 && (
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 font-medium dark:border-zinc-800 dark:bg-zinc-900">
                <td className="px-3 py-2">Total geral</td>
                <td className="px-3 py-2" colSpan={3}></td>
                <td className="px-3 py-2">{formatBRL(totalGeral)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-zinc-500">
        Vida faturável: admitido até o fim da competência e não demitido antes do início dela.
      </p>
    </div>
  );
}
