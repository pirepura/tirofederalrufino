"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CerrarTorneoBtn({ torneoId }: { torneoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cerrar() {
    if (!confirm("¿Cerrar el torneo? Ya no se podrán cargar más participantes.")) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/torneos/${torneoId}/cerrar`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      onClick={cerrar}
      disabled={loading}
    >
      Cerrar torneo
    </button>
  );
}
