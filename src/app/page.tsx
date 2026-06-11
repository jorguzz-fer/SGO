export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">SGO</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        Sistema de Gestão Ocupacional — Produto 3 da Wow+
      </p>
      <p className="text-sm text-gray-500">
        Sprint 0 — ambiente no ar. Saúde:{" "}
        <a className="underline" href="/api/health">
          /api/health
        </a>
      </p>
    </main>
  );
}
