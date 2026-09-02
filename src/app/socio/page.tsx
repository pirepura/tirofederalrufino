import Link from "next/link";
import { requireSocio } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  actualizarCuotasVencidas,
  cuotasImpagasDeSocio,
} from "@/lib/cuotas";
import {
  ESTADO_CUOTA,
  ESTADO_SUSCRIPCION,
  formatearPesos,
  nombreMes,
} from "@/lib/constants";
import { CuotaBadge } from "@/components/EstadoBadge";
import PagarCuotaBtn from "@/components/PagarCuotaBtn";
import InformarPagoBtn from "@/components/InformarPagoBtn";
import DebitoAutomatico from "@/components/DebitoAutomatico";

export const dynamic = "force-dynamic";

export default async function SocioDashboard() {
  const session = await requireSocio();
  await actualizarCuotasVencidas();

  const socioId = session.user.socioId!;
  const socio = await prisma.socio.findUnique({
    where: { id: socioId },
    include: { categoriaRef: true },
  });
  const impagas = await cuotasImpagasDeSocio(socioId);
  const saldo = impagas.reduce((t, c) => t + c.monto, 0);

  // Cuotas con pago informado, esperando verificación del club
  const enRevision = await prisma.cuota.findMany({
    where: { socioId, estado: ESTADO_CUOTA.EN_REVISION },
    orderBy: [{ periodoAnio: "asc" }, { periodoMes: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-tiro-azul">
          Hola, {socio?.nombre} 👋
        </h1>
        <p className="text-sm text-tiro-grisTexto">
          Socio N° {socio?.numeroSocio} — {socio?.categoriaRef?.nombre ?? ""}
        </p>
      </div>

      {/* Recordatorio de cuotas impagas */}
      {impagas.length > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-800">
                Tenés {impagas.length} cuota(s) impaga(s)
              </p>
              <p className="mt-1 text-3xl font-bold text-red-700">
                {formatearPesos(saldo)}
              </p>
              <p className="text-xs text-red-600">Saldo total a pagar</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-semibold text-green-800">
            ¡Estás al día! No tenés cuotas pendientes. ✅
          </p>
        </div>
      )}

      {/* Débito automático */}
      <DebitoAutomatico
        activa={socio?.suscripcionEstado === ESTADO_SUSCRIPCION.ACTIVA}
        monto={socio?.categoriaRef?.cuotaMensual ?? 0}
      />

      {/* Detalle de cuotas impagas con botón de pago */}
      {impagas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-tiro-azul">
            Cuotas pendientes
          </h2>
          <div className="space-y-3">
            {impagas.map((c) => (
              <div
                key={c.id}
                className="card flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-tiro-azul">
                    {c.descripcion} — {nombreMes(c.periodoMes)} {c.periodoAnio}
                  </p>
                  <p className="text-sm text-tiro-grisTexto">
                    Vence el {c.fechaVencimiento.toLocaleDateString("es-AR")}
                  </p>
                  <div className="mt-1">
                    <CuotaBadge estado={c.estado} />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xl font-bold text-tiro-azul">
                    {formatearPesos(c.monto)}
                  </p>
                  <PagarCuotaBtn cuotaId={c.id} />
                  <InformarPagoBtn cuotaId={c.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cuotas con pago informado, esperando verificación del club */}
      {enRevision.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-tiro-azul">
            Pagos informados (en revisión)
          </h2>
          <div className="space-y-3">
            {enRevision.map((c) => (
              <div
                key={c.id}
                className="card flex flex-wrap items-center justify-between gap-4 border-blue-200 bg-blue-50/40"
              >
                <div>
                  <p className="font-semibold text-tiro-azul">
                    {c.descripcion} — {nombreMes(c.periodoMes)} {c.periodoAnio}
                  </p>
                  <p className="text-sm text-tiro-grisTexto">
                    Informaste el pago. La administración lo va a verificar.
                  </p>
                  <div className="mt-1">
                    <CuotaBadge estado={c.estado} />
                  </div>
                </div>
                <p className="text-xl font-bold text-tiro-azul">
                  {formatearPesos(c.monto)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link href="/socio/pagos" className="btn-secondary">
        Ver historial completo de pagos
      </Link>
    </div>
  );
}
