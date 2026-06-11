import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope, isCoordenacao } from "@/lib/session";
import {
  EXAME_LABEL,
  STATUS_SOLICITACAO_LABEL,
  TIPO_EXAME_LABEL,
} from "@/lib/validations";
import { criarTokenAtendimento, linkAtendimento } from "@/lib/token";
import RoteamentoForm from "../_RoteamentoForm";
import { concluirSolicitacao } from "../actions";

export const dynamic = "force-dynamic";

type ExameItem = { tipo: string; detalhe?: string };

export default async function SolicitacaoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const coordenacao = isCoordenacao(user.role);

  const sol = await prisma.solicitacao.findFirst({
    where: { id, ...tenantScope(user) },
    include: {
      funcionario: true,
      empresaCliente: { select: { razaoSocial: true } },
      medico: true,
      clinica: true,
      aso: { select: { id: true } },
      historico: { orderBy: { ocorridoEm: "asc" } },
    },
  });
  if (!sol) notFound();

  const exames = (sol.examesNecessarios as ExameItem[] | null) ?? [];

  const podeRotear = ["ROTEADO", "AGENDADO", "REALIZADO"].includes(sol.status);
  const magicLink =
    coordenacao && podeRotear
      ? linkAtendimento(
          await criarTokenAtendimento({
            solicitacaoId: sol.id,
            escopo: sol.modalidade === "TELEMEDICINA" ? "MEDICO" : "CLINICA",
          }),
        )
      : null;

  const [medicos, clinicas] =
    coordenacao && sol.status === "SOLICITADO"
      ? await Promise.all([
          prisma.medico.findMany({
            where: { ativo: true, telemedicina: true },
            select: { id: true, nome: true, crm: true },
          }),
          prisma.clinica.findMany({
            where: { ativo: true },
            orderBy: { cidade: "asc" },
            select: { id: true, nome: true, cidade: true, uf: true },
          }),
        ])
      : [[], []];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/painel/solicitacoes" className="text-sm text-zinc-500 hover:underline">
          ← Solicitações
        </Link>
        <h1 className="text-2xl font-bold">Solicitação</h1>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
          {STATUS_SOLICITACAO_LABEL[sol.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Funcionário" value={sol.funcionario.nome} />
              <Info label="CPF" value={sol.funcionario.cpf} />
              <Info label="Função" value={sol.funcionario.funcao ?? "—"} />
              <Info label="Tomador/Posto" value={sol.funcionario.tomador ?? "—"} />
              <Info label="Tipo de exame" value={TIPO_EXAME_LABEL[sol.tipoExame]} />
              <Info label="Modalidade" value={sol.modalidade === "TELEMEDICINA" ? "Telemedicina" : "Presencial"} />
              <Info label="Cidade/UF" value={[sol.funcionario.cidade, sol.funcionario.uf].filter(Boolean).join("/") || "—"} />
              <Info label="Empresa" value={sol.empresaCliente.razaoSocial} />
              {sol.parecer && (
                <Info label="Parecer" value={sol.parecer === "APTO" ? "Apto" : "Inapto"} />
              )}
            </dl>
            <div className="mt-3 text-sm">
              <div className="text-zinc-500">Exames</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {exames.map((e, i) => (
                  <span key={i} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    {EXAME_LABEL[e.tipo] ?? e.tipo}
                    {e.detalhe ? `: ${e.detalhe}` : ""}
                  </span>
                ))}
              </div>
            </div>
            {sol.observacoes && (
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{sol.observacoes}</p>
            )}
            {(sol.medico || sol.clinica) && (
              <p className="mt-3 text-sm">
                <span className="text-zinc-500">Roteado para: </span>
                {sol.medico ? `Dr. ${sol.medico.nome}` : sol.clinica?.nome}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="mb-3 font-medium">Ações</h2>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/painel/solicitacoes/${sol.id}/guia`}
                target="_blank"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Guia (PDF)
              </a>
              {sol.aso && (
                <a
                  href={`/painel/solicitacoes/${sol.id}/aso`}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Baixar ASO
                </a>
              )}
              {sol.status === "ASO_EMITIDO" && (
                <form action={concluirSolicitacao}>
                  <input type="hidden" name="solicitacaoId" value={sol.id} />
                  <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900">
                    Concluir
                  </button>
                </form>
              )}
            </div>
            {magicLink && (
              <div className="mt-3 text-sm">
                <div className="text-zinc-500">
                  Link de atendimento ({sol.modalidade === "TELEMEDICINA" ? "médico" : "clínica"}):
                </div>
                <code className="mt-1 block break-all rounded-md bg-zinc-100 p-2 text-xs dark:bg-zinc-800">
                  {magicLink}
                </code>
              </div>
            )}
          </div>

          {coordenacao && sol.status === "SOLICITADO" && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="mb-3 font-medium">Rotear ({sol.modalidade === "TELEMEDICINA" ? "telemedicina" : "presencial"})</h2>
              <RoteamentoForm
                solicitacaoId={sol.id}
                modalidade={sol.modalidade}
                medicos={medicos}
                clinicas={clinicas}
              />
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-3 font-medium">Linha do tempo</h2>
          <ol className="space-y-3">
            {sol.historico.map((h) => (
              <li key={h.id} className="text-sm">
                <div className="font-medium">{STATUS_SOLICITACAO_LABEL[h.paraStatus]}</div>
                <div className="text-xs text-zinc-500">
                  {h.ocorridoEm.toLocaleString("pt-BR")}
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
