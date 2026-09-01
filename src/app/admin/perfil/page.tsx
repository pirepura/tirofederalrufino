import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import CambiarPasswordForm from "@/components/CambiarPasswordForm";

export const dynamic = "force-dynamic";

export default async function AdminPerfilPage() {
  const session = await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-tiro-azul hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tiro-azul">Mi cuenta</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">Datos</h2>
        <div className="card space-y-1 text-sm">
          <p>
            <span className="text-tiro-grisTexto">Nombre:</span>{" "}
            <span className="font-medium">{session.user.name}</span>
          </p>
          <p>
            <span className="text-tiro-grisTexto">Email:</span>{" "}
            <span className="font-medium">{session.user.email}</span>
          </p>
          <p>
            <span className="text-tiro-grisTexto">Rol:</span>{" "}
            <span className="font-medium">Administrador</span>
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">
          Cambiar contraseña
        </h2>
        <CambiarPasswordForm />
      </section>
    </div>
  );
}
