"use client";

import { useActionState } from "react";
import { uploadDocumento } from "./actions";
import type { DocState } from "./types";

type Empresa = { id: string; razaoSocial: string };

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function UploadForm({ empresas }: { empresas: Empresa[] }) {
  const [state, action, pending] = useActionState<DocState, FormData>(
    uploadDocumento,
    null,
  );

  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <label className="block text-sm">
        Tipo *
        <select name="tipo" required className={field}>
          <option value="PCMSO">PCMSO</option>
          <option value="PGR">PGR</option>
          <option value="OUTRO">Outro</option>
        </select>
      </label>
      <label className="block text-sm sm:col-span-2">
        Arquivo (PDF) *
        <input type="file" name="arquivo" accept="application/pdf,.pdf" required className={field} />
      </label>
      <label className="block text-sm">
        Vigência início
        <input type="date" name="vigenciaInicio" className={field} />
      </label>
      <label className="block text-sm">
        Vigência fim
        <input type="date" name="vigenciaFim" className={field} />
      </label>
      <label className="block text-sm">
        Versão
        <input name="versao" placeholder="ex.: 2026.1" className={field} />
      </label>
      {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-600 sm:col-span-2">Documento publicado. ✅</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Enviando…" : "Publicar documento"}
        </button>
      </div>
    </form>
  );
}
