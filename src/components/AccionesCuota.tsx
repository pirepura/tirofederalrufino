"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { METODO_PAGO } from "@/lib/constants";

// Botón para que el admin registre un pago manual (efectivo/transferencia).
export function RegistrarPagoBtn({ cuotaId }: { cuotaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function registrar(metodo: string) {
    setLoading(true);
    const res = await fetch(`/api/cuotas/${cuotaId}/pagar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoPago: metodo }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex gap-2">
      <button
        className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
        onClick={() => registrar(METODO_PAGO.EFECTIVO)}
        disabled={loading}
      >
        Efectivo
      </button>
      <span className="text-slate-300">|</span>
      <button
        className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
        onClick={() => registrar(METODO_PAGO.TRANSFERENCIA)}
        disabled={loading}
      >
        Transferencia
      </button>
    </div>
  );
}

// Botón para eliminar un socio.
export function EliminarSocioBtn({ socioId }: { socioId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function eliminar() {
    if (
      !confirm(
        "¿Eliminar este socio? Se borrarán también sus cuotas y su cuenta de acceso. Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/socios/${socioId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/socios");
      router.refresh();
    }
  }

  return (
    <button
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      onClick={eliminar}
      disabled={loading}
    >
      Eliminar socio
    </button>
  );
}

// Botón para eliminar una cuota (corregir cuotas mal generadas).
export function EliminarCuotaBtn({ cuotaId }: { cuotaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function eliminar() {
    if (
      !confirm(
        "¿Eliminar esta cuota? Se usa para corregir cuotas mal generadas. Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/cuotas/${cuotaId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <button
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      onClick={eliminar}
      disabled={loading}
    >
      Eliminar
    </button>
  );
}
