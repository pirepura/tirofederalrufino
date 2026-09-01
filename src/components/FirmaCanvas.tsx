"use client";

import { useRef, useState, useEffect } from "react";

// Recuadro para dibujar la firma con el dedo (celular) o el mouse (compu).
// Expone la firma como PNG (data URL) vía onChange.
export default function FirmaCanvas({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ajustar resolución al tamaño real en pantalla
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#132F55";
    }
  }, []);

  function posicion(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function empezar(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = posicion(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDibujando(true);
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = posicion(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!tieneFirma) setTieneFirma(true);
  }

  function terminar() {
    if (!dibujando) return;
    setDibujando(false);
    const canvas = canvasRef.current;
    if (canvas && tieneFirma) {
      onChange(canvas.toDataURL("image/png"));
    }
  }

  function limpiar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setTieneFirma(false);
      onChange(null);
    }
  }

  return (
    <div>
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none rounded-lg"
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={terminar}
          onPointerLeave={terminar}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-tiro-grisTexto">
          Firmá con el dedo o el mouse dentro del recuadro.
        </span>
        <button
          type="button"
          onClick={limpiar}
          className="text-xs font-medium text-tiro-azul hover:underline"
        >
          Borrar firma
        </button>
      </div>
    </div>
  );
}
