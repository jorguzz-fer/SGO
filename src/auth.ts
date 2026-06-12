import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { $Enums } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.usuario.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.senhaHash) return null;

        const ok = await bcrypt.compare(parsed.data.senha, user.senhaHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          role: user.role,
          empresaClienteId: user.empresaClienteId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.empresaClienteId = user.empresaClienteId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as $Enums.Role;
        session.user.empresaClienteId =
          (token.empresaClienteId as string | null) ?? null;
      }
      return session;
    },
  },
});
