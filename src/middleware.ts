export { auth as middleware } from "@/auth";

// Protege as áreas autenticadas. Rotas públicas (home, login, health, assets)
// ficam de fora. Os route groups por papel entram aqui conforme forem criados.
export const config = {
  matcher: ["/painel/:path*"],
};
