import Link from "next/link";
import { CLUB } from "@/config/club";
import Escudo from "@/components/Escudo";

export const dynamic = "force-dynamic";

export default function TorneoGraciasPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="min-h-screen bg-tiro-gris py-8">
      <div className="mx-auto max-w-lg px-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow">
          <Escudo size={56} />
        </span>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-tiro-azul">
          {CLUB.nombre}
        </p>

        <div className="card mt-6">
          <h1 className="text-2xl font-bold text-tiro-azul">¡Gracias! 🎯</h1>
          <p className="mt-3 text-sm text-tiro-grisTexto">
            Recibimos tu inscripción. Si pagaste con Mercado Pago, tu lugar queda
            confirmado apenas se acredite el pago. Si elegiste efectivo o
            transferencia, coordiná el pago con el club para confirmar tu lugar.
          </p>
          <Link
            href={`/torneo/${params.id}`}
            className="btn-secondary mt-4 inline-block"
          >
            Volver al torneo
          </Link>
        </div>
      </div>
    </main>
  );
}
