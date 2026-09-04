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
  EN_REVISION: "EN_REVISION", // el socio informó un pago y espera verificación del admin
} as const;
export type EstadoCuota = (typeof ESTADO_CUOTA)[keyof typeof ESTADO_CUOTA];

export const ESTADO_SOLICITUD = {
  PENDIENTE: "PENDIENTE",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
} as const;
export type EstadoSolicitud =
  (typeof ESTADO_SOLICITUD)[keyof typeof ESTADO_SOLICITUD];

export const ESTADO_SUSCRIPCION = {
  ACTIVA: "activa",
  PAUSADA: "pausada",
  CANCELADA: "cancelada",
} as const;
export type EstadoSuscripcion =
  (typeof ESTADO_SUSCRIPCION)[keyof typeof ESTADO_SUSCRIPCION];

export const ESTADO_ALQUILER = {
  RESERVADO: "RESERVADO",
  CONFIRMADO: "CONFIRMADO",
  CANCELADO: "CANCELADO",
  COMPLETADO: "COMPLETADO",
} as const;
export type EstadoAlquiler = (typeof ESTADO_ALQUILER)[keyof typeof ESTADO_ALQUILER];

// Acciones registradas en la auditoría
export const ACCION_AUDITORIA = {
  // Sesión
  LOGIN: "LOGIN",
  // Socios
  SOCIO_CREADO: "SOCIO_CREADO",
  SOCIO_EDITADO: "SOCIO_EDITADO",
  SOCIO_ELIMINADO: "SOCIO_ELIMINADO",
  // Solicitudes de inscripción
  SOLICITUD_APROBADA: "SOLICITUD_APROBADA",
  SOLICITUD_RECHAZADA: "SOLICITUD_RECHAZADA",
  // Cuotas
  CUOTAS_GENERADAS: "CUOTAS_GENERADAS",
  CUOTA_ELIMINADA: "CUOTA_ELIMINADA",
  PAGO_MANUAL: "PAGO_MANUAL",
  PAGO_MERCADOPAGO: "PAGO_MERCADOPAGO",
  PAGO_DEBITO_AUTOMATICO: "PAGO_DEBITO_AUTOMATICO",
  // Comprobantes
  PAGO_INFORMADO: "PAGO_INFORMADO",
  COMPROBANTE_CONFIRMADO: "COMPROBANTE_CONFIRMADO",
  COMPROBANTE_RECHAZADO: "COMPROBANTE_RECHAZADO",
  // Categorías
  CATEGORIA_CREADA: "CATEGORIA_CREADA",
  CATEGORIA_EDITADA: "CATEGORIA_EDITADA",
  CATEGORIA_ELIMINADA: "CATEGORIA_ELIMINADA",
  // Débito automático
  DEBITO_ACTIVADO: "DEBITO_ACTIVADO",
  DEBITO_CANCELADO: "DEBITO_CANCELADO",
  // Cuenta
  PASSWORD_CAMBIADA: "PASSWORD_CAMBIADA",
  // Rifas
  RIFA_CREADA: "RIFA_CREADA",
  RIFA_FINALIZADA: "RIFA_FINALIZADA",
  RIFA_NUMERO_VENDIDO: "RIFA_NUMERO_VENDIDO",
  // Torneos
  TORNEO_CREADO: "TORNEO_CREADO",
  TORNEO_CERRADO: "TORNEO_CERRADO",
  TORNEO_PARTICIPANTE: "TORNEO_PARTICIPANTE",
  TORNEO_INSCRIPCION: "TORNEO_INSCRIPCION",
  TORNEO_PAGO_CONFIRMADO: "TORNEO_PAGO_CONFIRMADO",
} as const;
export type AccionAuditoria =
  (typeof ACCION_AUDITORIA)[keyof typeof ACCION_AUDITORIA];

// Etiquetas legibles de cada acción (para mostrar en la pantalla de auditoría)
export const ACCION_LABEL: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  SOCIO_CREADO: "Alta de socio",
  SOCIO_EDITADO: "Edición de socio",
  SOCIO_ELIMINADO: "Baja de socio",
  SOLICITUD_APROBADA: "Solicitud aprobada",
  SOLICITUD_RECHAZADA: "Solicitud rechazada",
  CUOTAS_GENERADAS: "Cuotas generadas",
  CUOTA_ELIMINADA: "Cuota eliminada",
  PAGO_MANUAL: "Pago manual registrado",
  PAGO_MERCADOPAGO: "Pago con Mercado Pago",
  PAGO_DEBITO_AUTOMATICO: "Pago por débito automático",
  PAGO_INFORMADO: "Pago informado por socio",
  COMPROBANTE_CONFIRMADO: "Comprobante confirmado",
  COMPROBANTE_RECHAZADO: "Comprobante rechazado",
  CATEGORIA_CREADA: "Categoría creada",
  CATEGORIA_EDITADA: "Categoría editada",
  CATEGORIA_ELIMINADA: "Categoría eliminada",
  DEBITO_ACTIVADO: "Débito automático activado",
  DEBITO_CANCELADO: "Débito automático cancelado",
  PASSWORD_CAMBIADA: "Contraseña cambiada",
  RIFA_CREADA: "Rifa creada",
  RIFA_FINALIZADA: "Rifa finalizada",
  RIFA_NUMERO_VENDIDO: "Número de rifa vendido",
  TORNEO_CREADO: "Torneo creado",
  TORNEO_CERRADO: "Torneo cerrado",
  TORNEO_PARTICIPANTE: "Participante cargado en torneo",
  TORNEO_INSCRIPCION: "Inscripción a torneo",
  TORNEO_PAGO_CONFIRMADO: "Pago de inscripción confirmado",
};

export const ESTADO_RIFA = {
  ACTIVA: "activa",
  FINALIZADA: "finalizada",
} as const;

export const ESTADO_TORNEO = {
  ABIERTO: "abierto",
  CERRADO: "cerrado",
} as const;

// Configuración del ranking histórico de tiro
export const RANKING_CONFIG = {
  MEJORES_N: 5, // promedia los mejores N rendimientos del socio
  MINIMO_TORNEOS: 2, // torneos mínimos para entrar al ranking oficial
} as const;

export const ESTADO_NUMERO_RIFA = {
  DISPONIBLE: "disponible",
  EN_PROCESO: "en_proceso",
  VENDIDO: "vendido",
} as const;

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
