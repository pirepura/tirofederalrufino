// ===========================================================================
// Avisos automáticos a socios por WhatsApp.
// ---------------------------------------------------------------------------
// Empezamos por cuotas: aviso al generar la cuota y recordatorio ~15 días si
// sigue impaga. Reutiliza el módulo whatsapp.ts (Cloud API de Meta).
// Todo es "best effort": si WhatsApp no está configurado o el socio no tiene
// teléfono válido, se omite sin romper el flujo.
// ===========================================================================

import { prisma } from "@/lib/db";
import { ESTADO_CUOTA, nombreMes, formatearPesos } from "@/lib/constants";
import { CLUB } from "@/config/club";
import {
  whatsappConfigurado,
  normalizarTelefonoAR,
  enviarPlantilla,
} from "@/lib/whatsapp";

// Días tras los cuales se manda el recordatorio si la cuota sigue impaga.
const DIAS_RECORDATORIO = 15;

function plantillaCuota(): string {
  return (process.env.WHATSAPP_TEMPLATE_CUOTA ?? "aviso_cuota").trim();
}

// Envía el aviso de una cuota recién generada a un socio.
// Marca avisoCreacionEnviadoEn si el envío fue exitoso.
export async function avisarCuotaCreada(cuotaId: string): Promise<boolean> {
  if (!whatsappConfigurado()) return false;

  const cuota = await prisma.cuota.findUnique({
    where: { id: cuotaId },
    include: { socio: true },
  });
  if (!cuota || !cuota.socio) return false;
  if (cuota.avisoCreacionEnviadoEn) return false; // ya avisado

  const tel = normalizarTelefonoAR(cuota.socio.telefono);
  if (!tel) return false;

  const res = await enviarPlantilla({
    telefono: tel,
    plantilla: plantillaCuota(),
    parametros: [
      cuota.socio.nombre,
      `${nombreMes(cuota.periodoMes)} ${cuota.periodoAnio}`,
      formatearPesos(cuota.monto),
      cuota.fechaVencimiento.toLocaleDateString("es-AR"),
      CLUB.nombre,
    ],
  });

  if (res.ok) {
    await prisma.cuota.update({
      where: { id: cuota.id },
      data: { avisoCreacionEnviadoEn: new Date() },
    });
    return true;
  }
  return false;
}

// Envía avisos de creación para un lote de cuotas (usado al generar cuotas).
// Devuelve cuántos avisos se enviaron.
export async function avisarCuotasCreadas(cuotaIds: string[]): Promise<number> {
  if (!whatsappConfigurado() || cuotaIds.length === 0) return 0;
  let enviados = 0;
  for (const id of cuotaIds) {
    // Secuencial para no golpear el rate limit de la API.
    const ok = await avisarCuotaCreada(id);
    if (ok) enviados++;
  }
  return enviados;
}

// Recordatorio para cuotas impagas con ~15 días desde su creación.
// Pensado para correr a diario (cron). Marca recordatorioEnviadoEn para no
// reenviar. Devuelve cuántos recordatorios se enviaron.
export async function enviarRecordatoriosImpagas(): Promise<{
  enviados: number;
  candidatas: number;
}> {
  if (!whatsappConfigurado()) return { enviados: 0, candidatas: 0 };

  const limite = new Date();
  limite.setDate(limite.getDate() - DIAS_RECORDATORIO);

  const cuotas = await prisma.cuota.findMany({
    where: {
      estado: { in: [ESTADO_CUOTA.PENDIENTE, ESTADO_CUOTA.VENCIDA] },
      recordatorioEnviadoEn: null,
      createdAt: { lte: limite },
    },
    include: { socio: true },
  });

  let enviados = 0;
  for (const cuota of cuotas) {
    if (!cuota.socio) continue;
    const tel = normalizarTelefonoAR(cuota.socio.telefono);
    if (!tel) continue;

    const res = await enviarPlantilla({
      telefono: tel,
      plantilla: plantillaCuota(),
      parametros: [
        cuota.socio.nombre,
        `${nombreMes(cuota.periodoMes)} ${cuota.periodoAnio}`,
        formatearPesos(cuota.monto),
        cuota.fechaVencimiento.toLocaleDateString("es-AR"),
        CLUB.nombre,
      ],
    });

    if (res.ok) {
      await prisma.cuota.update({
        where: { id: cuota.id },
        data: { recordatorioEnviadoEn: new Date() },
      });
      enviados++;
    }
  }

  return { enviados, candidatas: cuotas.length };
}
