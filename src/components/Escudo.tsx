import Image from "next/image";

// Escudo/logo oficial del Tiro Federal Rufino.
// La imagen se guarda en /public/escudo.png
export default function Escudo({ size = 48 }: { size?: number }) {
  return (
    <Image
      src="/escudo.png"
      alt="Escudo del Tiro Federal Rufino"
      width={size}
      height={size}
      priority
      className="h-auto w-auto object-contain"
      style={{ width: size, height: size }}
    />
  );
}
