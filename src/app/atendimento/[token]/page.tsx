import { prisma } from "@/lib/prisma";
import { verificarTokenAtendimento } from "@/lib/token";
import {
  EXAME_LABEL,
  STATUS_SOLICITACAO_LABEL,
  TIPO_EXAME_LABEL,
} from "@/lib/validations";
import AgendarForm from "../_AgendarForm";
import EmitirAsoForm from "../_EmitirAsoForm";

export const dynamic = "force-dynamic";

type ExameItem = { tipo: string; detalhe?: string };

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
        {children}
      </div>
    </main>
  );
}

export default async function AtendimentoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const auth = await verificarTokenAtendimento(token);
  if (!auth) {
    return (
      <Aviso>
        <h1 className="text-lg font-bold">Link inválido ou expirado</h1>
        <p className="mt-1 text-sm text-zinc-500">Solicite um novo link à coordenação.</p>
      </Aviso>
    );
  }

  const sol = await prisma.solicitacao.findUnique({
    where: { id: auth.solicitacaoId },
    include: {
      funcionario: { select: { nome: true, cpf: true, dataNascimento: true, funcao: true, cidade: true, uf: true } },
      empresaCliente: { select: { razaoSocial: true } },
    },
  });
  if (!sol) {
    return (
      <Aviso>
        <h1 className="text-lg font-bold">Solicitação não encontrada</h1>
      </Aviso>
    );
  }

  const exames = (sol.examesNecessarios as ExameItem[] | null) ?? [];
  const concluido = sol.status === "ASO_EMITIDO" || sol.status === "CONCLUIDO";
  const podeAgendar = auth.escopo === "CLINICA" && sol.status === "ROTEADO";
  const podeEmitir =
    !concluido &&
    (sol.status === "AGENDADO" ||
      sol.status === "REALIZADO" ||
      (auth.escopo === "MEDICO" && sol.status === "ROTEADO"));

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <p className="text-sm text-zinc-500">SGO · Atendimento ocupacional</p>
        <h1 className="text-2xl font-bold">
          {auth.escopo === "MEDICO" ? "Telemedicina" : "Atendimento presencial"}
        </h1>
        <span className="mt-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
          {STATUS_SOLICITACAO_LABEL[sol.status]}
        </span>
      </header>

      <section className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-zinc-500">Funcionário</div><div className="font-medium">{sol.funcionario.nome}</div></div>
          <div><div className="text-zinc-500">CPF</div><div className="font-medium">{sol.funcionario.cpf}</div></div>
          <div><div className="text-zinc-500">Empresa</div><div className="font-medium">{sol.empresaCliente.razaoSocial}</div></div>
          <div><div className="text-zinc-500">Exame</div><div className="font-medium">{TIPO_EXAME_LABEL[sol.tipoExame]}</div></div>
        </div>
        <div className="mt-3">
          <div className="text-zinc-500">Exames</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {exames.map((e, i) => (
              <span key={i} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                {EXAME_LABEL[e.tipo] ?? e.tipo}{e.detalhe ? `: ${e.detalhe}` : ""}
              </span>
            ))}
          </div>
        </div>
      </section>

      {concluido ? (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          ASO já emitido. Obrigado!
        </div>
      ) : (
        <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          {podeAgendar && (
            <div className="mb-4">
              <h2 className="mb-2 font-medium">Agendar</h2>
              <AgendarForm token={token} />
            </div>
          )}
          {podeEmitir && (
            <div>
              <h2 className="mb-2 font-medium">Realizar e emitir ASO</h2>
              <EmitirAsoForm token={token} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
