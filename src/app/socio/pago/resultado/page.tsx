import Link from "next/link";

export const dynamic = "force-dynamic";

const MENSAJES: Record<
  string,
  { titulo: string; detalle: string; color: string; emoji: string }
> = {
  exito: {
    titulo: "¡Pago realizado!",
    detalle:
      "Tu pago fue aprobado. La cuota se actualizará en unos instantes cuando confirmemos la operación.",
    color: "text-green-700",
    emoji: "✅",
  },
  pendiente: {
    titulo: "Pago pendiente",
    detalle:
      "Tu pago está en proceso. Cuando Mercado Pago lo confirme, la cuota quedará al día automáticamente.",
    color: "text-amber-700",
    emoji: "⏳",
  },
  error: {
    titulo: "El pago no se completó",
    detalle:
      "No pudimos procesar el pago. Podés intentarlo nuevamente desde tus cuotas pendientes.",
    color: "text-red-700",
    emoji: "❌",
  },
};

export default function ResultadoPagoPage({
  searchParams,
}: {
  searchParams: { estado?: string };
}) {
  const estado = searchParams.estado ?? "pendiente";
  const info = MENSAJES[estado] ?? MENSAJES.pendiente;

  return (
    <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
      <div className="text-5xl">{info.emoji}</div>
      <h1 className={`text-2xl font-bold ${info.color}`}>{info.titulo}</h1>
      <p className="text-tiro-grisTexto">{info.detalle}</p>
      <div className="flex justify-center gap-3 pt-2">
        <Link href="/socio" className="btn-primary">
          Volver al inicio
        </Link>
        <Link href="/socio/pagos" className="btn-secondary">
          Ver mis pagos
        </Link>
      </div>
    </div>
  );
}
