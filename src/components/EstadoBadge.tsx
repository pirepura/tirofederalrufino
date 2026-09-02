import { ESTADO_CUOTA, ESTADO_SOCIO } from "@/lib/constants";

const CUOTA_ESTILOS: Record<string, string> = {
  [ESTADO_CUOTA.PAGADA]: "bg-green-100 text-green-800",
  [ESTADO_CUOTA.PENDIENTE]: "bg-amber-100 text-amber-800",
  [ESTADO_CUOTA.VENCIDA]: "bg-red-100 text-red-800",
  [ESTADO_CUOTA.ANULADA]: "bg-slate-200 text-slate-600",
  [ESTADO_CUOTA.EN_REVISION]: "bg-blue-100 text-blue-800",
};

// Etiqueta legible para cada estado de cuota
const CUOTA_LABEL: Record<string, string> = {
  [ESTADO_CUOTA.EN_REVISION]: "EN REVISIÓN",
};

const SOCIO_ESTILOS: Record<string, string> = {
  [ESTADO_SOCIO.ACTIVO]: "bg-green-100 text-green-800",
  [ESTADO_SOCIO.INACTIVO]: "bg-slate-200 text-slate-600",
  [ESTADO_SOCIO.SUSPENDIDO]: "bg-red-100 text-red-800",
};

export function CuotaBadge({ estado }: { estado: string }) {
  const clase = CUOTA_ESTILOS[estado] ?? "bg-slate-100 text-slate-700";
  return <span className={`badge ${clase}`}>{CUOTA_LABEL[estado] ?? estado}</span>;
}

export function SocioBadge({ estado }: { estado: string }) {
  const clase = SOCIO_ESTILOS[estado] ?? "bg-slate-100 text-slate-700";
  return <span className={`badge ${clase}`}>{estado}</span>;
}
