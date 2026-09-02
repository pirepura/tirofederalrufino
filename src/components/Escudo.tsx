import Image from "next/image";
import { CLUB } from "@/config/club";

// Escudo/logo oficial del club.
// La imagen se define en src/config/club.ts (por defecto /escudo.png en /public).
export default function Escudo({ size = 48 }: { size?: number }) {
  return (
    <Image
      src={CLUB.logo}
      alt={`Escudo de ${CLUB.nombre}`}
      width={size}
      height={size}
      priority
      className="h-auto w-auto object-contain"
      style={{ width: size, height: size }}
    />
  );
}
