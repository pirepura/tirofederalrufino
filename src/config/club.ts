// ===========================================================================
// CONFIGURACIÓN DEL CLUB
// ---------------------------------------------------------------------------
// Este es el ÚNICO archivo que hay que editar para adaptar el sistema a otro
// club. Cambiá acá el nombre, los datos de contacto, el logo y los colores,
// y reemplazá la imagen del logo en /public.
//
// Para replicar en otro club:
//   1. Editá los valores de este archivo.
//   2. Reemplazá /public/escudo.png por el logo del club nuevo.
//   3. Los colores de "colores" se reflejan en tailwind.config.ts
//      (que lee este archivo) y en toda la app.
// ===========================================================================

import { COLORES_CLUB } from "./colores";

export const CLUB = {
  // Identidad
  nombre: "Tiro Federal Rufino",
  nombreCorto: "Tiro Federal Rufino",
  descripcion:
    "Sistema de administración de socios y pagos de cuotas del Tiro Federal Rufino.",

  // Datos de contacto (se muestran en inscripción y PDF)
  direccion: "Zelio Zolezzi 470",
  ciudad: "(6100) Rufino, Santa Fe",
  telefono: "3382-442733",

  // Logo: archivo dentro de /public
  logo: "/escudo.png",

  // Paleta de colores institucional (definida en ./colores.ts).
  // Se usa en tailwind.config.ts (prefijo "tiro-...") y en los PDF.
  colores: COLORES_CLUB,
} as const;

// Línea de dirección completa (para mostrar en un renglón)
export const CLUB_DIRECCION_COMPLETA = `${CLUB.direccion} · ${CLUB.ciudad} · Tel. ${CLUB.telefono}`;
