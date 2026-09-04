import { notFound } from "next/navigation";
import { obtenerRifaPublica } from "@/lib/rifas";
import { ESTADO_RIFA, formatearPesos } from "@/lib/constants";
import { CLUB } from "@/config/club";
import Escudo from "@/components/Escudo";
import ComprarNumeroRifa from "@/components/ComprarNumeroRifa";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const data = await obtenerRifaPublica(params.slug);
  return { title: data ? `${data.rifa.titulo} — ${CLUB.nombre}` : "Rifa" };
}

export default async function RifaPublicaPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await obtenerRifaPublica(params.slug);
  if (!data) notFound();

  const { rifa, ocupados } = data;
  const finalizada = rifa.estado === ESTADO_RIFA.FINALIZADA;

  return (
    <main className="min-h-screen bg-tiro-gris py-8">
      <div className="mx-auto max-w-3xl px-4">
        {/* Encabezado del club */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow">
            <Escudo size={56} />
          </span>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-tiro-azul">
            {CLUB.nombre}
          </p>
        </div>

        {/* Imagen/portada de la rifa */}
        {rifa.imagenData && (
          <div className="mb-6 overflow-hidden rounded-xl shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rifa.imagenData}
              alt={rifa.titulo}
              className="max-h-80 w-full object-cover"
            />
          </div>
        )}

        {/* Título y descripción */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-tiro-azul">{rifa.titulo}</h1>
          {rifa.descripcion && (
            <p className="mt-2 text-tiro-grisTexto">{rifa.descripcion}</p>
          )}
          <p className="mt-3 text-lg font-semibold text-tiro-celeste">
            Número: {formatearPesos(rifa.precioNumero)}
          </p>
        </div>

        {/* Premios */}
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          {rifa.premios.map((p) => (
            <div key={p.id} className="card text-center">
              <p className="text-sm font-bold text-tiro-dorado">
                {p.posicion}° premio
              </p>
              {p.fotoData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.fotoData}
                  alt={`${p.posicion}° premio`}
                  className="mx-auto mt-2 max-h-40 rounded-lg object-contain"
                />
              )}
              <p className="mt-2 font-semibold text-tiro-azul">{p.titulo}</p>
            </div>
          ))}
        </section>

        {finalizada ? (
          <div className="card text-center text-tiro-grisTexto">
            Esta rifa ya está finalizada. ¡Gracias por participar!
          </div>
        ) : (
          <ComprarNumeroRifa
            slug={rifa.slug}
            cantidadNumeros={rifa.cantidadNumeros}
            cifras={rifa.cifras}
            ocupados={ocupados}
            precioNumero={rifa.precioNumero}
          />
        )}

        <p className="mt-6 text-center text-xs text-tiro-grisTexto">
          El sorteo se realiza por la Lotería Nacional.
        </p>
      </div>
    </main>
  );
}
