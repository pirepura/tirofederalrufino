import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ESTADO_SOLICITUD } from "@/lib/constants";
import AccionesSolicitud from "@/components/AccionesSolicitud";

export const dynamic = "force-dynamic";

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-tiro-grisTexto">
        {label}
      </p>
      <p className="font-medium text-tiro-azulOscuro">{valor || "-"}</p>
    </div>
  );
}

export default async function SolicitudDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const s = await prisma.solicitudInscripcion.findUnique({
    where: { id: params.id },
  });
  if (!s) notFound();

  const esPendiente = s.estado === ESTADO_SOLICITUD.PENDIENTE;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href="/admin/solicitudes"
            className="text-sm text-tiro-azul hover:underline"
          >
            ← Volver a solicitudes
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-tiro-azul">
            {s.nombreCompleto}
          </h1>
        </div>
        <a
          href={`/api/solicitudes/${s.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Descargar / imprimir PDF
        </a>
      </div>

      <section className="card space-y-4">
        <h2 className="border-b pb-2 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Datos personales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Dato label="Nombre completo" valor={s.nombreCompleto} />
          <Dato label="DNI" valor={s.dni} />
          <Dato
            label="Fecha de nacimiento"
            valor={s.fechaNacimiento.toLocaleDateString("es-AR")}
          />
          <Dato label="Domicilio" valor={s.domicilio} />
          <Dato label="Email" valor={s.email} />
          <Dato label="Celular" valor={s.celular} />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="border-b pb-2 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Vinculación previa
        </h2>
        {s.fueSocio ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Dato label="Año en que se asoció" valor={String(s.anioAsociado ?? "-")} />
            <Dato label="Categoría previa" valor={s.categoriaPrevia ?? "-"} />
            <Dato label="Primer período de pago" valor={s.primerPeriodo ?? "-"} />
          </div>
        ) : (
          <p className="text-sm text-tiro-grisTexto">
            Primera vez que se asocia.
          </p>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="border-b pb-2 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          Declaración jurada y firma
        </h2>
        <p className="text-sm text-tiro-grisTexto">
          {s.aceptaDeclaracion
            ? "✔ Aceptó la declaración jurada de veracidad de los datos."
            : "No aceptó la declaración jurada."}
        </p>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-tiro-grisTexto">
            Firma
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.firmaDataUrl}
            alt="Firma del solicitante"
            className="max-h-40 rounded-lg border border-slate-200 bg-white"
          />
        </div>
      </section>

      {esPendiente ? (
        <section className="card space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-tiro-azul">
            Acciones
          </h2>
          <AccionesSolicitud solicitudId={s.id} />
        </section>
      ) : (
        <div className="card">
          <p className="text-sm">
            Estado:{" "}
            <span className="font-semibold">{s.estado}</span>
            {s.estado === ESTADO_SOLICITUD.APROBADA && s.socioIdCreado && (
              <>
                {" · "}
                <Link
                  href={`/admin/socios/${s.socioIdCreado}`}
                  className="text-tiro-azul hover:underline"
                >
                  Ver socio creado
                </Link>
              </>
            )}
          </p>
          {s.motivoRechazo && (
            <p className="mt-1 text-sm text-tiro-grisTexto">
              Motivo del rechazo: {s.motivoRechazo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
