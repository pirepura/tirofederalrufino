import Link from "next/link";
import { requireSocio } from "@/lib/session";
import { lineasActivas } from "@/lib/alquileres";
import { formatearPesos } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Vista preliminar del módulo de alquiler de líneas de tiro.
// La reserva y el cobro se habilitarán en una próxima etapa.
export default async function AlquilerPage() {
  await requireSocio();
  const lineas = await lineasActivas();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/socio" className="text-sm text-tiro-azul hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tiro-azul">
          Alquiler de líneas de tiro
        </h1>
      </div>

      <div className="rounded-xl border border-tiro-celeste/40 bg-tiro-celeste/10 p-5">
        <p className="text-sm font-semibold text-tiro-azul">
          🎯 Próximamente
        </p>
        <p className="mt-1 text-sm text-tiro-grisTexto">
          Pronto vas a poder reservar y pagar tu turno en la línea de tiro desde
          acá. La funcionalidad está en preparación.
        </p>
      </div>

      {lineas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-tiro-azul">
            Líneas disponibles
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lineas.map((l) => (
              <div key={l.id} className="card">
                <p className="font-semibold text-tiro-azul">
                  Línea {l.numero} — {l.nombre}
                </p>
                {l.descripcion && (
                  <p className="text-sm text-tiro-grisTexto">{l.descripcion}</p>
                )}
                <p className="mt-2 text-sm">
                  Turno: {formatearPesos(l.precioTurno)}
                </p>
                <button className="btn-mp mt-3 opacity-60" disabled>
                  Reservar (próximamente)
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
