import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, isCoordenacao } from "@/lib/session";
import ClinicaForm from "./_ClinicaForm";
import MedicoForm from "./_MedicoForm";

export const dynamic = "force-dynamic";

export default async function CredenciadosPage() {
  const user = await requireUser();
  if (!isCoordenacao(user.role)) redirect("/painel");

  const [clinicas, medicos] = await Promise.all([
    prisma.clinica.findMany({ orderBy: { nome: "asc" } }),
    prisma.medico.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Credenciados</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Clínicas ({clinicas.length})</h2>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <ClinicaForm />
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Cidade/UF</th>
                <th className="px-3 py-2">Endereço</th>
                <th className="px-3 py-2">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {clinicas.map((c) => (
                <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2 font-medium">{c.nome}</td>
                  <td className="px-3 py-2">{[c.cidade, c.uf].filter(Boolean).join("/") || "—"}</td>
                  <td className="px-3 py-2 text-zinc-500">{c.endereco ?? "—"}</td>
                  <td className="px-3 py-2">{c.ativo ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Médicos ({medicos.length})</h2>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <MedicoForm />
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">CRM</th>
                <th className="px-3 py-2">Especialidade</th>
                <th className="px-3 py-2">Telemedicina</th>
              </tr>
            </thead>
            <tbody>
              {medicos.map((m) => (
                <tr key={m.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2 font-medium">{m.nome}</td>
                  <td className="px-3 py-2">{m.crm}</td>
                  <td className="px-3 py-2 text-zinc-500">{m.especialidade ?? "—"}</td>
                  <td className="px-3 py-2">{m.telemedicina ? "Sim" : "Não"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
