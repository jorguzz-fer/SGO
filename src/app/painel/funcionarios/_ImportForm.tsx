"use client";

import { useActionState } from "react";
import { importFuncionarios } from "./actions";
import type { ImportState } from "./types";

type Empresa = { id: string; razaoSocial: string };

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function ImportForm({
  empresas,
}: {
  empresas: Empresa[] | null;
}) {
  const [state, action, pending] = useActionState<ImportState, FormData>(
    importFuncionarios,
    null,
  );

  return (
    <div className="max-w-2xl space-y-5">
      <form action={action} className="space-y-4">
        {empresas && (
          <label className="block text-sm">
            Empresa-cliente *
            <select name="empresaClienteId" required className={field}>
              <option value="">Selecione…</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.razaoSocial}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm">
          Arquivo CSV da base *
          <input
            type="file"
            name="arquivo"
            accept=".csv,text/csv"
            required
            className={field}
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Importando…" : "Importar"}
        </button>
      </form>

      {state && (
        <div className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <p className="font-medium">
            {state.ok ? "Importação concluída ✅" : "Importação concluída com avisos"}
          </p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-300">
            Criados: {state.criados} · Atualizados: {state.atualizados} · Erros:{" "}
            {state.erros.length}
          </p>
          {state.erros.length > 0 && (
            <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto text-red-600">
              {state.erros.map((e, i) => (
                <li key={i}>
                  Linha {e.linha}: {e.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
