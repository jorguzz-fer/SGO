"use client";

import { useActionState } from "react";
import { createFuncionario } from "./actions";
import type { FormState } from "./types";

type Empresa = { id: string; razaoSocial: string };

const field =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export default function FuncionarioForm({
  empresas,
}: {
  empresas: Empresa[] | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createFuncionario,
    null,
  );

  return (
    <form action={action} className="max-w-3xl space-y-4">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          Nome *<input name="nome" required className={field} />
        </label>
        <label className="block text-sm">
          CPF *<input name="cpf" required className={field} />
        </label>
        <label className="block text-sm">
          Sexo
          <select name="sexo" className={field}>
            <option value="">—</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
            <option value="OUTRO">Outro</option>
          </select>
        </label>
        <label className="block text-sm">
          RG<input name="rg" className={field} />
        </label>
        <label className="block text-sm">
          Data de nascimento<input type="date" name="dataNascimento" className={field} />
        </label>
        <label className="block text-sm">
          Função<input name="funcao" className={field} />
        </label>
        <label className="block text-sm">
          CBO<input name="cbo" className={field} />
        </label>
        <label className="block text-sm">
          Setor<input name="setor" className={field} />
        </label>
        <label className="block text-sm">
          Tomador / Posto<input name="tomador" className={field} />
        </label>
        <label className="block text-sm">
          Centro de custo<input name="centroCusto" className={field} />
        </label>
        <label className="block text-sm">
          Cidade<input name="cidade" className={field} />
        </label>
        <label className="block text-sm">
          UF<input name="uf" maxLength={2} className={field} />
        </label>
        <label className="block text-sm">
          Fone celular<input name="foneCelular" className={field} />
        </label>
        <label className="block text-sm">
          E-mail<input type="email" name="email" className={field} />
        </label>
        <label className="block text-sm">
          Data de admissão<input type="date" name="dataAdmissao" className={field} />
        </label>
        <label className="block text-sm">
          Status
          <select name="status" defaultValue="ATIVO" className={field}>
            <option value="ATIVO">Ativo</option>
            <option value="AFASTADO">Afastado</option>
            <option value="DEMITIDO">Demitido</option>
          </select>
        </label>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}
