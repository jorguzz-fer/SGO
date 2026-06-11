import Link from "next/link";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/session";

const PAPEL_LABEL: Record<string, string> = {
  CLIENTE: "Cliente (RH)",
  COORDENACAO: "Coordenação",
  MEDICO: "Médico",
  CLINICA: "Clínica",
  ADMIN: "Admin",
};

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/painel" className="font-bold">
              SGO
            </Link>
            <Link href="/painel/funcionarios" className="text-zinc-600 hover:underline dark:text-zinc-300">
              Funcionários
            </Link>
            <Link href="/painel/solicitacoes" className="text-zinc-600 hover:underline dark:text-zinc-300">
              Solicitações
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">
              {user.name ?? user.email} · {PAPEL_LABEL[user.role] ?? user.role}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
