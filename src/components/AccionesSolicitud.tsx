"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccionesSolicitud({
  solicitudId,
}: {
  solicitudId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function procesar(accion: "aprobar" | "rechazar") {
    setError("");

    if (accion === "aprobar") {
      if (!confirm("¿Aprobar esta solicitud? Se creará el socio activo con su cuenta de acceso.")) {
        return;
      }
    }

    let motivo: string | undefined;
    if (accion === "rechazar") {
      const m = prompt("Motivo del rechazo (opcional):");
      if (m === null) return; // canceló
      motivo = m || undefined;
    }

    setLoading(true);
    const res = await fetch(`/api/solicitudes/${solicitudId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion, motivo }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Ocurrió un error");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          className="btn-primary"
          onClick={() => procesar("aprobar")}
          disabled={loading}
        >
          Aprobar y crear socio
        </button>
        <button
          className="btn-secondary"
          onClick={() => procesar("rechazar")}
          disabled={loading}
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
