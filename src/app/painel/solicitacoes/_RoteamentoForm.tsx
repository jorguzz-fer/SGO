"use client";

import { useActionState } from "react";
import { rotearSolicitacao } from "./actions";
import type { SolFormState } from "./types";

type Medico = { id: string; nome: string; crm: string };
type Clinica = { id: string; nome: string; cidade: string | null; uf: string | null };

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function RoteamentoForm({
  solicitacaoId,
  modalidade,
  medicos,
  clinicas,
}: {
  solicitacaoId: string;
  modalidade: "TELEMEDICINA" | "PRESENCIAL";
  medicos: Medico[];
  clinicas: Clinica[];
}) {
  const [state, action, pending] = useActionState<SolFormState, FormData>(
    rotearSolicitacao,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="solicitacaoId" value={solicitacaoId} />
      {modalidade === "TELEMEDICINA" ? (
        <label className="block text-sm">
          Médico (telemedicina)
          <select name="medicoId" required className={field}>
            <option value="">Selecione…</option>
            {medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} — {m.crm}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="block text-sm">
          Clínica credenciada
          <select name="clinicaId" required className={field}>
            <option value="">Selecione…</option>
            {clinicas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.cidade ? ` — ${c.cidade}/${c.uf ?? ""}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Roteando…" : "Rotear"}
      </button>
    </form>
  );
}
