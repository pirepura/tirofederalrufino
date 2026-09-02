import Link from "next/link";
import { CLUB } from "@/config/club";
import Escudo from "@/components/Escudo";

export const dynamic = "force-dynamic";

export default function GraciasRifaPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-tiro-gris px-4 py-10">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white p-1 shadow">
          <Escudo size={56} />
        </span>
        <div className="mt-4 text-5xl">🎟️</div>
        <h1 className="mt-2 text-2xl font-bold text-tiro-azul">¡Gracias!</h1>
        <p className="mt-2 text-tiro-grisTexto">
          Estamos procesando tu pago. Cuando Mercado Pago lo confirme, tu número
          queda reservado a tu nombre y vas a poder descargar tu comprobante.
        </p>
        <p className="mt-2 text-sm text-tiro-grisTexto">
          Si el pago fue aprobado, guardá tu comprobante de Mercado Pago como
          respaldo.
        </p>
        <div className="mt-6">
          <Link href={`/rifa/${params.slug}`} className="btn-primary">
            Volver a la rifa
          </Link>
        </div>
        <p className="mt-6 text-xs text-tiro-grisTexto">{CLUB.nombre}</p>
      </div>
    </main>
  );
}
