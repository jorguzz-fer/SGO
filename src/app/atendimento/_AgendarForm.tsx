"use client";

import { useActionState } from "react";
import { agendarAtendimento } from "./actions";
import type { AtendState } from "./types";

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function AgendarForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AtendState, FormData>(
    agendarAtendimento,
    null,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm">
        Data/hora do atendimento
        <input type="datetime-local" name="dataAgendada" className={field} />
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Agendando…" : "Confirmar agendamento"}
      </button>
    </form>
  );
}
