import Link from "next/link";
import { requireSocio } from "@/lib/session";
import { prisma } from "@/lib/db";
import CambiarPasswordForm from "@/components/CambiarPasswordForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await requireSocio();
  const socio = await prisma.socio.findUnique({
    where: { id: session.user.socioId! },
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/socio" className="text-sm text-tiro-azul hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tiro-azul">Mi cuenta</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-tiro-azul">Mis datos</h2>
        <div className="card space-y-1 text-sm">
          <p>
            <span className="text-tiro-grisTexto">Socio N°:</span>{" "}
            <span className="font-medium">{socio?.numeroSocio}</span>
          </p>
          <p>
            <span className="text-tiro-grisTexto">Nombre:</span>{" "}
            <span className="font-medium">
              {socio?.apellido}, {socio?.nombre}
            </span>
          </p>
          <p>
            <span className="text-tiro-grisTexto">Email:</span>{" "}
            <span className="font-medium">{socio?.user.email}</span>
          </p>
          <p className="text-xs text-tiro-grisTexto">
            Para modificar tus datos personales, comunicate con la administración
            del club.
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
