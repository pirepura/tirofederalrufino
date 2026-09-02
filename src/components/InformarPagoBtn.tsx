"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// Permite al socio informar un pago hecho por otro medio (transferencia, etc.)
// subiendo el comprobante. La cuota queda "en revisión" hasta que el admin confirme.
export default function InformarPagoBtn({ cuotaId }: { cuotaId: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [metodo, setMetodo] = useState("transferencia");
  const [archivo, setArchivo] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const tipoOk =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!tipoOk) {
      setError("El comprobante debe ser una imagen o un PDF.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("El archivo es demasiado grande (máximo 4 MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setArchivo(reader.result as string);
      setNombreArchivo(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function enviar() {
    setError("");
    if (!archivo) {
      setError("Adjuntá el comprobante.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/cuotas/${cuotaId}/comprobante`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comprobante: archivo, metodo }),
    });
    setLoading(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "No se pudo informar el pago");
      return;
    }
    setAbierto(false);
    router.refresh();
  }

  if (!abierto) {
    return (
      <button className="btn-secondary text-sm" onClick={() => setAbierto(true)}>
        Ya pagué por otro medio
      </button>
    );
  }

  return (
    <div className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-sm font-semibold text-tiro-azul">
        Informar pago por transferencia u otro medio
      </p>

      {error && (
        <div className="mb-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
          {error}
        </div>
      )}

      <label className="label">Medio de pago</label>
      <select
        className="input mb-2"
        value={metodo}
        onChange={(e) => setMetodo(e.target.value)}
      >
        <option value="transferencia">Transferencia</option>
        <option value="deposito">Depósito</option>
        <option value="efectivo">Efectivo</option>
      </select>

      <label className="label">Comprobante (imagen o PDF)</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="mb-1 block w-full text-sm"
        onChange={elegirArchivo}
      />
      {nombreArchivo && (
        <p className="mb-2 text-xs text-green-700">✓ {nombreArchivo}</p>
      )}

      <p className="mb-3 text-xs text-tiro-grisTexto">
        Tu pago quedará en revisión hasta que la administración lo confirme.
      </p>

      <div className="flex gap-2">
        <button className="btn-primary text-sm" onClick={enviar} disabled={loading}>
          {loading ? "Enviando..." : "Enviar comprobante"}
        </button>
        <button
          className="btn-secondary text-sm"
          onClick={() => {
            setAbierto(false);
            setError("");
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
