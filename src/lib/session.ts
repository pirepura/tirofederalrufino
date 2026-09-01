import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

// Devuelve la sesión actual (o null si no hay)
export async function getSession() {
  return getServerSession(authOptions);
}

// Exige que haya un usuario logueado; si no, redirige al login
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

// Exige rol ADMIN; si no, redirige
export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.rol !== ROLES.ADMIN) {
    redirect("/socio");
  }
  return session;
}

// Exige rol SOCIO con perfil de socio asociado
export async function requireSocio() {
  const session = await requireUser();
  if (session.user.rol !== ROLES.SOCIO || !session.user.socioId) {
    redirect("/admin");
  }
  return session;
}
