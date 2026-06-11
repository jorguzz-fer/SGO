import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, isCoordenacao } from "@/lib/session";
import ImportForm from "../_ImportForm";

export const dynamic = "force-dynamic";

const COLUNAS =
  "cpf, nome, data_nascimento, sexo, rg, pis, ctps, ctps_serie, matricula_esocial, " +
  "data_admissao, data_demissao, funcao, cbo, setor, tomador, centro_custo, cidade, uf, " +
  "fone_celular, fone_residencial, email, status";

export default async function ImportarPage() {
  const user = await requireUser();
  const empresas = isCoordenacao(user.role)
    ? await prisma.empresaCliente.findMany({
        orderBy: { razaoSocial: "asc" },
        select: { id: true, razaoSocial: true },
      })
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/painel/funcionarios" className="text-sm text-zinc-500 hover:underline">
          ← Funcionários
        </Link>
        <h1 className="text-2xl font-bold">Importar base</h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium">Formato esperado (CSV com cabeçalho)</p>
        <p className="mt-1 break-words text-zinc-600 dark:text-zinc-300">
          Obrigatórios: <strong>cpf</strong> e <strong>nome</strong>. Datas em{" "}
          <code>dd/mm/aaaa</code>. Colunas:
        </p>
        <code className="mt-2 block break-words text-xs text-zinc-500">{COLUNAS}</code>
        <p className="mt-2 text-zinc-500">
          Registros com o mesmo CPF são atualizados (upsert).
        </p>
      </div>

      <ImportForm empresas={empresas} />
    </div>
  );
}
