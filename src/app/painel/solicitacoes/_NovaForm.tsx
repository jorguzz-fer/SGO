"use client";

import { useActionState, useState } from "react";
import { criarSolicitacao } from "./actions";
import type { SolFormState } from "./types";

type Funcionario = { id: string; nome: string; cidade: string | null; uf: string | null };

const TIPOS: [string, string][] = [
  ["ADMISSIONAL", "Admissional"],
  ["PERIODICO", "Periódico"],
  ["RETORNO_AO_TRABALHO", "Retorno ao trabalho"],
  ["MUDANCA_DE_FUNCAO", "Mudança de função"],
  ["DEMISSIONAL", "Demissional"],
];

const EXAMES: [string, string][] = [
  ["CLINICO", "Clínico"],
  ["AUDIOMETRIA", "Audiometria"],
  ["ACUIDADE_VISUAL", "Acuidade visual"],
  ["ESPIROMETRIA", "Espirometria"],
  ["RAIO_X", "Raio-X"],
  ["HEMOGRAMA", "Hemograma"],
  ["GLICEMIA", "Glicemia"],
  ["ELETROCARDIOGRAMA", "Eletrocardiograma"],
  ["ELETROENCEFALOGRAMA", "Eletroencefalograma"],
  ["OUTROS", "Outros"],
];

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function NovaForm({ funcionarios }: { funcionarios: Funcionario[] }) {
  const [state, action, pending] = useActionState<SolFormState, FormData>(
    criarSolicitacao,
    null,
  );
  const [outros, setOutros] = useState(false);

  return (
    <form action={action} className="max-w-2xl space-y-4">
      <label className="block text-sm">
        Funcionário *
        <select name="funcionarioId" required className={field}>
          <option value="">Selecione…</option>
          {funcionarios.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
              {f.cidade ? ` — ${f.cidade}/${f.uf ?? ""}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Tipo de exame *
          <select name="tipoExame" required className={field}>
            {TIPOS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Modalidade *
          <select name="modalidade" required defaultValue="TELEMEDICINA" className={field}>
            <option value="TELEMEDICINA">Telemedicina</option>
            <option value="PRESENCIAL">Presencial</option>
          </select>
        </label>
      </div>

      <fieldset className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
        <legend className="px-1 text-sm font-medium">Exames necessários *</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EXAMES.map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="exames"
                value={v}
                onChange={v === "OUTROS" ? (e) => setOutros(e.target.checked) : undefined}
              />
              {l}
            </label>
          ))}
        </div>
        {outros && (
          <input
            name="outrosDetalhe"
            placeholder="Descreva (ex.: trabalho em altura)"
            className={field}
          />
        )}
      </fieldset>

      <label className="block text-sm">
        Observações
        <textarea name="observacoes" rows={3} className={field} />
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Enviando…" : "Enviar solicitação"}
      </button>
    </form>
  );
}
