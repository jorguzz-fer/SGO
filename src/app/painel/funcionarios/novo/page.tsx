import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser, isCoordenacao } from "@/lib/session";
import FuncionarioForm from "../_FuncionarioForm";

export const dynamic = "force-dynamic";

export default async function NovoFuncionarioPage() {
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
        <h1 className="text-2xl font-bold">Novo funcionário</h1>
      </div>
      <FuncionarioForm empresas={empresas} />
    </div>
  );
}
