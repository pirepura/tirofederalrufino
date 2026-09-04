"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MESES } from "@/lib/constants";

export default function GenerarCuotasForm() {
  const router = useRouter();
  const ahora = new Date();
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [diaVencimiento, setDiaVencimiento] = useState(10);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const res = await fetch("/api/cuotas/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodoMes: mes,
        periodoAnio: anio,
        diaVencimiento,
      }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      let texto = `Listo: ${data.creadas} cuota(s) generada(s), ${data.omitidas} ya existían.`;
      if (data.sinMonto > 0) {
        texto += ` ${data.sinMonto} socio(s) sin categoría o con cuota en $0 fueron omitidos.`;
      }
      if (typeof data.avisados === "number" && data.avisados > 0) {
        texto += ` Se enviaron ${data.avisados} aviso(s) por WhatsApp.`;
      }
      setMsg(texto);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setMsg(body.error ?? "Ocurrió un error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <p className="text-sm text-tiro-grisTexto">
        Genera la cuota del período elegido para todos los socios activos que
        aún no la tengan. No se duplican cuotas existentes.
      </p>

      {msg && (
        <div className="rounded-lg bg-tiro-gris px-3 py-2 text-sm text-tiro-azul">
          {msg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Mes</label>
          <select
            className="input"
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
          >
            {MESES.map((nombre, i) => (
              <option key={i} value={i + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Año</label>
          <input
            type="number"
            className="input"
            value={anio}
            min={2020}
            max={2100}
            onChange={(e) => setAnio(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Día de vencimiento</label>
          <input
            type="number"
            className="input"
            value={diaVencimiento}
            min={1}
            max={28}
            onChange={(e) => setDiaVencimiento(Number(e.target.value))}
          />
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Generando..." : "Generar cuotas del período"}
      </button>
    </form>
  );
}
