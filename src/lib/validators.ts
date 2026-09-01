import { z } from "zod";
import { ESTADO_SOCIO } from "@/lib/constants";

export const socioCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  dni: z.string().min(6, "DNI inválido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  telefono: z.string().optional().or(z.literal("")),
  direccion: z.string().optional().or(z.literal("")),
  categoria: z.string().default("General"),
  cuotaMensual: z.coerce.number().min(0, "La cuota no puede ser negativa"),
  estado: z
    .enum([
      ESTADO_SOCIO.ACTIVO,
      ESTADO_SOCIO.INACTIVO,
      ESTADO_SOCIO.SUSPENDIDO,
    ])
    .default(ESTADO_SOCIO.ACTIVO),
  observaciones: z.string().optional().or(z.literal("")),
});

export const socioUpdateSchema = socioCreateSchema
  .partial()
  .omit({ password: true })
  .extend({
    // La contraseña es opcional al editar (solo si se quiere cambiar)
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .optional()
      .or(z.literal("")),
  });

export const cuotaCreateSchema = z.object({
  socioId: z.string().min(1),
  periodoMes: z.coerce.number().int().min(1).max(12),
  periodoAnio: z.coerce.number().int().min(2020).max(2100),
  monto: z.coerce.number().min(0),
  descripcion: z.string().default("Cuota mensual"),
  // Día del mes de vencimiento (por defecto 10)
  diaVencimiento: z.coerce.number().int().min(1).max(28).default(10),
});

// Generación masiva de cuotas de un período para todos los socios activos
export const generarCuotasSchema = z.object({
  periodoMes: z.coerce.number().int().min(1).max(12),
  periodoAnio: z.coerce.number().int().min(2020).max(2100),
  diaVencimiento: z.coerce.number().int().min(1).max(28).default(10),
});

export type SocioCreateInput = z.infer<typeof socioCreateSchema>;
export type SocioUpdateInput = z.infer<typeof socioUpdateSchema>;
