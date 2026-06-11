"use client";

import { useActionState } from "react";
import { emitirAso } from "./actions";
import type { AtendState } from "./types";

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function EmitirAsoForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AtendState, FormData>(
    emitirAso,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm">
        Parecer *
        <select name="parecer" required className={field}>
          <option value="">Selecione…</option>
          <option value="APTO">Apto</option>
          <option value="INAPTO">Inapto</option>
        </select>
      </label>
      <label className="block text-sm">
        ASO (PDF) *
        <input type="file" name="aso" accept="application/pdf,.pdf" required className={field} />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Enviando…" : "Emitir ASO"}
      </button>
    </form>
  );
}
