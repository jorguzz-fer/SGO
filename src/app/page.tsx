export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-8 text-center">
      <h1 className="text-3xl font-bold">SGO</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        Sistema de Gestão Ocupacional — Produto 3 da Wow+
      </p>
      <a
        href="/login"
        className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
      >
        Entrar
      </a>
      <p className="text-xs text-gray-500">
        Saúde do sistema:{" "}
        <a className="underline" href="/api/health">
          /api/health
        </a>
      </p>
    </main>
  );
}

