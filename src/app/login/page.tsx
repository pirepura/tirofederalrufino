import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { CLUB } from "@/config/club";
import LoginForm from "./LoginForm";
import Escudo from "@/components/Escudo";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect(session.user.rol === ROLES.ADMIN ? "/admin" : "/socio");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-tiro-azul to-tiro-azulOscuro px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <span className="flex h-28 w-28 items-center justify-center rounded-full bg-white p-2 shadow-lg">
            <Escudo size={100} />
          </span>
          <h1 className="mt-3 text-2xl font-bold uppercase tracking-wide">
            {CLUB.nombre}
          </h1>
          <p className="text-sm text-tiro-celesteClaro">
            Gestión de socios y pagos
          </p>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-tiro-azul">
            Iniciar sesión
          </h2>
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-sm text-white">
          ¿Querés asociarte?{" "}
          <a
            href="/inscripcion"
            className="font-semibold text-tiro-celesteClaro underline"
          >
            Completá la solicitud de inscripción
          </a>
        </p>

        <p className="mt-4 text-center text-xs text-tiro-celesteClaro">
          Acceso exclusivo para socios y administración del club.
        </p>
      </div>
    </main>
  );
}
