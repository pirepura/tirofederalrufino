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
  categoriaId: z.string().min(1, "Seleccioná una categoría"),
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

// Solicitud de inscripción pública de socio
export const solicitudInscripcionSchema = z
  .object({
    nombreCompleto: z.string().min(1, "El nombre completo es obligatorio"),
    dni: z.string().min(6, "DNI inválido"),
    fechaNacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
    domicilio: z.string().min(1, "El domicilio es obligatorio"),
    email: z.string().email("Email inválido"),
    celular: z.string().min(6, "El celular es obligatorio"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    // Vinculación previa
    fueSocio: z.boolean().default(false),
    anioAsociado: z.coerce.number().int().optional(),
    categoriaPrevia: z.string().optional().or(z.literal("")),
    primerPeriodo: z.string().optional().or(z.literal("")),
    // Firma (data URL PNG) y declaración jurada
    firmaDataUrl: z
      .string()
      .min(1, "La firma es obligatoria")
      .refine((v) => v.startsWith("data:image/"), "Firma inválida"),
    aceptaDeclaracion: z
      .boolean()
      .refine((v) => v === true, "Debés aceptar la declaración jurada"),
  })
  .refine(
    (d) => !d.fueSocio || (d.anioAsociado && d.anioAsociado >= 1900),
    { message: "Indicá el año en que te asociaste", path: ["anioAsociado"] }
  );

export type SolicitudInscripcionInput = z.infer<
  typeof solicitudInscripcionSchema
>;

// Categorías de socio (con su precio de cuota)
export const categoriaSchema = z.object({
  nombre: z.string().min(1, "El nombre de la categoría es obligatorio"),
  cuotaMensual: z.coerce.number().min(0, "El monto no puede ser negativo"),
  activa: z.boolean().default(true),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;


// Rifa (creación por el admin)
export const rifaCreateSchema = z.object({
  titulo: z.string().min(1, "El título es obligatorio"),
  descripcion: z.string().optional().or(z.literal("")),
  imagenData: z.string().optional().or(z.literal("")),
  cifras: z.coerce.number().int().min(1).max(4),
  cantidadNumeros: z.coerce.number().int().min(2).max(10000),
  precioNumero: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  premios: z
    .array(
      z.object({
        posicion: z.coerce.number().int().min(1).max(3),
        titulo: z.string().min(1, "Cada premio necesita un título"),
        fotoDataUrl: z.string().optional().or(z.literal("")),
      })
    )
    .length(3, "Deben cargarse los 3 premios"),
});

// Compra pública de un número de rifa
export const comprarNumeroSchema = z.object({
  numero: z.coerce.number().int().min(0),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  telefono: z.string().min(6, "El teléfono es obligatorio"),
});


// Torneo (creación por el admin)
export const torneoCreateSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  disciplina: z.string().optional().or(z.literal("")),
  descripcion: z.string().optional().or(z.literal("")),
  imagenData: z.string().optional().or(z.literal("")),
  precioSocio: z.coerce.number().min(0, "Precio inválido").default(0),
  precioNoSocio: z.coerce.number().min(0, "Precio inválido").default(0),
  categorias: z
    .array(
      z.object({
        nombre: z.string().min(1, "Cada categoría necesita un nombre"),
        puntajeMaximo: z.coerce.number().int().min(1, "Puntaje máximo inválido"),
      })
    )
    .min(1, "Cargá al menos una categoría"),
});

// Inscripción de un socio (desde su panel): elige categoría y método de pago.
export const inscripcionSocioSchema = z.object({
  torneoId: z.string().min(1),
  categoriaId: z.string().min(1, "Elegí una categoría"),
  metodoPago: z.enum(["mercadopago", "efectivo", "transferencia"], {
    errorMap: () => ({ message: "Elegí un método de pago" }),
  }),
});

// Inscripción de un no socio (desde el link público): datos + método de pago.
export const inscripcionPublicaSchema = z.object({
  torneoId: z.string().min(1),
  categoriaId: z.string().min(1, "Elegí una categoría"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  dni: z.string().min(1, "El DNI es obligatorio"),
  telefono: z.string().min(1, "El teléfono es obligatorio"),
  email: z.string().email("Email inválido"),
  metodoPago: z.enum(["mercadopago", "efectivo", "transferencia"], {
    errorMap: () => ({ message: "Elegí un método de pago" }),
  }),
});

// Participante de torneo (carga manual del admin en la mesa).
// El puntaje es opcional: se puede inscribir sin cargarlo y completarlo después.
export const participanteSchema = z.object({
  categoriaId: z.string().min(1, "Elegí una categoría"),
  socioId: z.string().optional().or(z.literal("")),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  telefono: z.string().optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  puntaje: z
    .union([z.coerce.number().int().min(0, "Puntaje inválido"), z.literal(""), z.null()])
    .optional(),
});