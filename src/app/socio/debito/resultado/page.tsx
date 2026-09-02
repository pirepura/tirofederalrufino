import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DebitoResultadoPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
      <div className="text-5xl">💳</div>
      <h1 className="text-2xl font-bold text-tiro-azul">
        Débito automático
      </h1>
      <p className="text-tiro-grisTexto">
        Si autorizaste el débito en Mercado Pago, tu cuota se empezará a debitar
        automáticamente cada mes. El estado se actualizará en unos instantes
        cuando Mercado Pago nos confirme la autorización.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Link href="/socio" className="btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
