"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CopiarLink({ url }: { url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // si falla el clipboard, no hacemos nada
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        readOnly
        value={url}
        className="input flex-1 min-w-[200px] text-sm"
        onFocus={(e) => e.currentTarget.select()}
      />
      <button className="btn-secondary text-sm" onClick={copiar} type="button">
        {copiado ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}

export function FinalizarRifaBtn({ rifaId }: { rifaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function finalizar() {
    if (
      !confirm(
        "¿Finalizar la rifa? Se cerrarán las ventas y se borrarán las fotos de los premios. Los números vendidos y sus datos se conservan."
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/rifas/${rifaId}/finalizar`, {
      method: "POST",
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      onClick={finalizar}
      disabled={loading}
    >
      Finalizar rifa
    </button>
  );
}
