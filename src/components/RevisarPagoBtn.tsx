"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Botones para que el admin revise un pago informado: ver el comprobante,
// confirmar (queda pagada) o rechazar (vuelve a impaga).
export default function RevisarPagoBtn({ cuotaId }: { cuotaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function resolver(aprobar: boolean) {
    setError("");
    const msg = aprobar
      ? "¿Confirmar el pago? La cuota quedará como pagada y se eliminará el comprobante."
      : "¿Rechazar el pago? La cuota volverá a quedar impaga.";
    if (!confirm(msg)) return;

    setLoading(true);
    const res = await fetch(`/api/cuotas/${cuotaId}/resolver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprobar }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Error al resolver");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <a
        href={`/api/cuotas/${cuotaId}/comprobante`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-tiro-azul hover:underline"
      >
        Ver comprobante
      </a>
      <div className="flex gap-2">
        <button
          className="btn-primary text-xs"
          onClick={() => resolver(true)}
          disabled={loading}
        >
          Confirmar pago
        </button>
        <button
          className="btn-secondary text-xs"
          onClick={() => resolver(false)}
          disabled={loading}
        >
          Rechazar
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
