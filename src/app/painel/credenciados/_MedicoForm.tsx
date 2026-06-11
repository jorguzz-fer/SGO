"use client";

import { useActionState } from "react";
import { createMedico } from "./actions";
import type { CredState } from "./types";

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function MedicoForm() {
  const [state, action, pending] = useActionState<CredState, FormData>(createMedico, null);

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block text-sm">
        Nome *<input name="nome" required className={field} />
      </label>
      <label className="block text-sm">
        CRM *<input name="crm" required className={field} />
      </label>
      <label className="block text-sm">
        Especialidade<input name="especialidade" className={field} />
      </label>
      <label className="flex items-center gap-2 text-sm sm:mt-6">
        <input type="checkbox" name="telemedicina" defaultChecked /> Atende telemedicina
      </label>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Salvando…" : "Credenciar médico"}
        </button>
      </div>
    </form>
  );
}
