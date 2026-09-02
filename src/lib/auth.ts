import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { ROLES, ACCION_AUDITORIA } from "@/lib/constants";
import { registrarAuditoria } from "@/lib/auditoria";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { socio: true },
        });

        if (!user) return null;

        const passwordOk = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!passwordOk) return null;

        // Registrar el inicio de sesión en la auditoría
        await registrarAuditoria({
          accion: ACCION_AUDITORIA.LOGIN,
          usuarioId: user.id,
          usuarioNombre: user.nombre ?? user.email,
          usuarioRol: user.rol,
          detalle: `Inicio de sesión (${user.email})`,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          rol: user.rol,
          socioId: user.socio?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rol = (user as { rol: string }).rol;
        token.socioId = (user as { socioId: string | null }).socioId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.rol = (token.rol as string) ?? ROLES.SOCIO;
        session.user.socioId = (token.socioId as string | null) ?? null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
