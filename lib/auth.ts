import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email e senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        try {
          const usuario = await prisma.usuario.findUnique({
            where: { email: credentials.email }
          });

          if (!usuario?.ativo) return null;

          const senhaValida = await bcrypt.compare(credentials.password, usuario.senhaHash);
          if (!senhaValida) return null;

          return {
            id: usuario.id,
            name: usuario.nome,
            email: usuario.email
          };
        } catch {
          const usandoCredencialDemo =
            process.env.NODE_ENV !== "production" &&
            credentials.email === "aluno@cbmo.test" &&
            credentials.password === "123456";

          if (!usandoCredencialDemo) return null;

          return {
            id: "usuario-demo",
            name: "Aluno Operacional",
            email: "aluno@cbmo.test"
          };
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = String(token.id);
      return session;
    }
  }
};
