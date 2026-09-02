import type { Config } from "tailwindcss";
import { COLORES_CLUB } from "./src/config/colores";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta institucional del club (definida en src/config/colores.ts).
        // El prefijo se mantiene como "tiro" para no cambiar las clases en toda la app.
        tiro: COLORES_CLUB,
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
