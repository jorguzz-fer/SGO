import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope, isCoordenacao } from "@/lib/session";
import UploadForm from "./_UploadForm";

export const dynamic = "force-dynamic";

const TIPO_LABEL: Record<string, string> = {
  PCMSO: "PCMSO",
  PGR: "PGR",
  OUTRO: "Outro",
};

function fmt(d: Date | null): string {
  return d ? d.toLocaleDateString("pt-BR") : "—";
}

export default async function DocumentosPage() {
  const user = await requireUser();
  const coordenacao = isCoordenacao(user.role);
  const hoje = new Date();

  const [documentos, empresas] = await Promise.all([
    prisma.documento.findMany({
      where: tenantScope(user),
      orderBy: { criadoEm: "desc" },
      take: 200,
      include: { empresaCliente: { select: { razaoSocial: true } } },
    }),
    coordenacao
      ? prisma.empresaCliente.findMany({
          orderBy: { razaoSocial: "asc" },
          select: { id: true, razaoSocial: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documentos (PCMSO / PGR)</h1>

      {coordenacao && (
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-medium">Publicar documento</h2>
          <UploadForm empresas={empresas} />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Versão</th>
              <th className="px-3 py-2">Vigência</th>
              <th className="px-3 py-2">Situação</th>
              {coordenacao && <th className="px-3 py-2">Empresa</th>}
              <th className="px-3 py-2">Publicado em</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {documentos.length === 0 && (
              <tr>
                <td colSpan={coordenacao ? 7 : 6} className="px-3 py-6 text-center text-zinc-500">
                  Nenhum documento publicado.
                </td>
              </tr>
            )}
            {documentos.map((d) => {
              const vencido = d.vigenciaFim !== null && d.vigenciaFim < hoje;
              return (
                <tr key={d.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2 font-medium">{TIPO_LABEL[d.tipo]}</td>
                  <td className="px-3 py-2">{d.versao ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-500">
                    {fmt(d.vigenciaInicio)} – {fmt(d.vigenciaFim)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        vencido
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      }`}
                    >
                      {vencido ? "Vencido" : "Vigente"}
                    </span>
                  </td>
                  {coordenacao && (
                    <td className="px-3 py-2 text-zinc-500">{d.empresaCliente.razaoSocial}</td>
                  )}
                  <td className="px-3 py-2 text-zinc-500">{fmt(d.criadoEm)}</td>
                  <td className="px-3 py-2">
                    <a href={`/painel/documentos/${d.id}/arquivo`} className="underline">
                      Baixar
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">
        Histórico ocupacional: documentos e ASOs ficam guardados por 20 anos (PCMSO).
      </p>
    </div>
  );
}
