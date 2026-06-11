"use client";

import { useActionState } from "react";
import { createClinica } from "./actions";
import type { CredState } from "./types";

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function ClinicaForm() {
  const [state, action, pending] = useActionState<CredState, FormData>(createClinica, null);

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block text-sm sm:col-span-2">
        Nome *<input name="nome" required className={field} />
      </label>
      <label className="block text-sm">
        CNPJ<input name="cnpj" className={field} />
      </label>
      <label className="block text-sm">
        Contato<input name="contato" className={field} />
      </label>
      <label className="block text-sm sm:col-span-2">
        Endereço<input name="endereco" className={field} />
      </label>
      <label className="block text-sm">
        Cidade<input name="cidade" className={field} />
      </label>
      <label className="block text-sm">
        UF<input name="uf" maxLength={2} className={field} />
      </label>
      <label className="block text-sm sm:col-span-2">
        Horários<input name="horarios" className={field} />
      </label>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Salvando…" : "Credenciar clínica"}
        </button>
      </div>
    </form>
  );
}
