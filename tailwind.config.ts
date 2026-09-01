import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta institucional Tiro Federal Rufino (celeste y azul argentino + blanco)
        tiro: {
          celeste: "#5FA8E0", // celeste bandera argentina
          celesteClaro: "#8FC3EC",
          azul: "#1E4C8A", // azul institucional
          azulOscuro: "#132F55",
          blanco: "#FFFFFF",
          gris: "#F4F7FB",
          grisTexto: "#4A5568",
          dorado: "#C9A227", // detalle dorado para acentos/escudo
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
