// Constantes que reemplazan a los enums (SQLite no soporta enums nativos).
// Se usan para validar y mostrar estados de forma consistente en toda la app.

export const ROLES = {
  ADMIN: "ADMIN",
  SOCIO: "SOCIO",
} as const;
export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ESTADO_SOCIO = {
  ACTIVO: "ACTIVO",
  INACTIVO: "INACTIVO",
  SUSPENDIDO: "SUSPENDIDO",
} as const;
export type EstadoSocio = (typeof ESTADO_SOCIO)[keyof typeof ESTADO_SOCIO];

export const ESTADO_CUOTA = {
  PENDIENTE: "PENDIENTE",
  PAGADA: "PAGADA",
  VENCIDA: "VENCIDA",
  ANULADA: "ANULADA",
} as const;
export type EstadoCuota = (typeof ESTADO_CUOTA)[keyof typeof ESTADO_CUOTA];

export const ESTADO_SOLICITUD = {
  PENDIENTE: "PENDIENTE",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
} as const;
export type EstadoSolicitud =
  (typeof ESTADO_SOLICITUD)[keyof typeof ESTADO_SOLICITUD];

export const ESTADO_ALQUILER = {
  RESERVADO: "RESERVADO",
  CONFIRMADO: "CONFIRMADO",
  CANCELADO: "CANCELADO",
  COMPLETADO: "COMPLETADO",
} as const;
export type EstadoAlquiler = (typeof ESTADO_ALQUILER)[keyof typeof ESTADO_ALQUILER];

export const METODO_PAGO = {
  MERCADOPAGO: "mercadopago",
  EFECTIVO: "efectivo",
  TRANSFERENCIA: "transferencia",
} as const;

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? `Mes ${mes}`;
}

// Formatea un monto como pesos argentinos
export function formatearPesos(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(monto);
}
