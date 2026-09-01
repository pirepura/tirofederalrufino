"use client";

import { useState } from "react";

// Botón que crea una preferencia de pago en Mercado Pago para una cuota
// y redirige al checkout. Si falla, muestra el error.
export default function PagarCuotaBtn({
  cuotaId,
  className = "btn-mp",
  label = "Pagar con Mercado Pago",
}: {
  cuotaId: string;
  className?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pagar() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cuotaId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo iniciar el pago");
      setLoading(false);
      return;
    }

    const data = await res.json();
    if (data.initPoint) {
      // Redirige al checkout de Mercado Pago
      window.location.href = data.initPoint;
    } else {
      setError("No se recibió el link de pago");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button className={className} onClick={pagar} disabled={loading}>
        {loading ? "Redirigiendo..." : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
