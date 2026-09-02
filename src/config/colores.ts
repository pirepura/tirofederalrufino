// Paleta de colores institucional del club.
// Está separada en su propio archivo (sin imports) para que tanto la app
// como tailwind.config.ts (que corre en Node, sin alias @/) puedan usarla.
//
// Para cambiar los colores del club, editá SOLO este objeto.
export const COLORES_CLUB = {
  celeste: "#5FA8E0",
  celesteClaro: "#8FC3EC",
  azul: "#1E4C8A",
  azulOscuro: "#132F55",
  blanco: "#FFFFFF",
  gris: "#F4F7FB",
  grisTexto: "#4A5568",
  dorado: "#C9A227",
} as const;
