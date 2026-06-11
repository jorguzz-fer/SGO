import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope, isCoordenacao } from "@/lib/session";

export const dynamic = "force-dynamic";

const STATUS = ["", "ATIVO", "AFASTADO", "DEMITIDO"];

export default async function FuncionariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tomador?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const coordenacao = isCoordenacao(user.role);

  const where: Prisma.FuncionarioWhereInput = { ...tenantScope(user) };
  if (sp.q) {
    where.OR = [
      { nome: { contains: sp.q, mode: "insensitive" } },
      { cpf: { contains: sp.q } },
    ];
  }
  if (sp.status && sp.status !== "") {
    where.status = sp.status as Prisma.FuncionarioWhereInput["status"];
  }
  if (sp.tomador) where.tomador = { contains: sp.tomador, mode: "insensitive" };

  const funcionarios = await prisma.funcionario.findMany({
    where,
    orderBy: { nome: "asc" },
    take: 200,
    include: { empresaCliente: { select: { razaoSocial: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Funcionários</h1>
        <div className="flex gap-2">
          <Link
            href="/painel/funcionarios/importar"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Importar CSV
          </Link>
          <Link
            href="/painel/funcionarios/novo"
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            Novo
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap gap-2" action="/painel/funcionarios">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por nome ou CPF"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <input
          name="tomador"
          defaultValue={sp.tomador ?? ""}
          placeholder="Tomador/Posto"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s === "" ? "Todos os status" : s}
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
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">CPF</th>
              <th className="px-3 py-2">Função</th>
              <th className="px-3 py-2">Tomador/Posto</th>
              <th className="px-3 py-2">Cidade/UF</th>
              <th className="px-3 py-2">Status</th>
              {coordenacao && <th className="px-3 py-2">Empresa</th>}
            </tr>
          </thead>
          <tbody>
            {funcionarios.length === 0 && (
              <tr>
                <td colSpan={coordenacao ? 7 : 6} className="px-3 py-6 text-center text-zinc-500">
                  Nenhum funcionário. Importe a base ou cadastre um novo.
                </td>
              </tr>
            )}
            {funcionarios.map((f) => (
              <tr key={f.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 font-medium">{f.nome}</td>
                <td className="px-3 py-2">{f.cpf}</td>
                <td className="px-3 py-2">{f.funcao ?? "—"}</td>
                <td className="px-3 py-2">{f.tomador ?? "—"}</td>
                <td className="px-3 py-2">
                  {[f.cidade, f.uf].filter(Boolean).join("/") || "—"}
                </td>
                <td className="px-3 py-2">{f.status}</td>
                {coordenacao && (
                  <td className="px-3 py-2 text-zinc-500">
                    {f.empresaCliente?.razaoSocial}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">Exibindo até 200 registros.</p>
    </div>
  );
}
