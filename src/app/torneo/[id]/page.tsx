import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ESTADO_TORNEO } from "@/lib/constants";
import { mercadoPagoConfigurado } from "@/lib/mercadopago";
import { CLUB } from "@/config/club";
import Escudo from "@/components/Escudo";
import InscripcionPublicaTorneo from "@/components/InscripcionPublicaTorneo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const torneo = await prisma.torneo.findUnique({ where: { id: params.id } });
  return {
    title: torneo ? `${torneo.nombre} — ${CLUB.nombre}` : "Torneo",
  };
}

export default async function TorneoPublicoPage({
  params,
}: {
  params: { id: string };
}) {
  const torneo = await prisma.torneo.findUnique({
    where: { id: params.id },
    include: { categorias: { orderBy: { nombre: "asc" } } },
  });
  if (!torneo) notFound();

  const abierto = torneo.estado === ESTADO_TORNEO.ABIERTO;
  const mpDisponible = mercadoPagoConfigurado();

  return (
    <main className="min-h-screen bg-tiro-gris py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow">
            <Escudo size={56} />
          </span>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-tiro-azul">
            {CLUB.nombre}
          </p>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-tiro-azul">{torneo.nombre}</h1>
          <p className="mt-2 text-tiro-grisTexto">
            {torneo.fecha.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {torneo.disciplina}
          </p>
        </div>

        {torneo.categorias.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
              Categorías
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2 text-sm">
              {torneo.categorias.map((c) => (
                <li
                  key={c.id}
                  className="rounded-full bg-tiro-azul/10 px-3 py-1 text-tiro-azul"
                >
                  {c.nombre}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!abierto ? (
          <div className="card text-center text-tiro-grisTexto">
            La inscripción a este torneo está cerrada. ¡Gracias por tu interés!
          </div>
        ) : torneo.categorias.length === 0 ? (
          <div className="card text-center text-tiro-grisTexto">
            La inscripción todavía no está disponible.
          </div>
        ) : (
          <InscripcionPublicaTorneo
            torneoId={torneo.id}
            categorias={torneo.categorias}
            precioNoSocio={torneo.precioNoSocio}
            mpDisponible={mpDisponible}
          />
        )}
      </div>
    </main>
  );
}
