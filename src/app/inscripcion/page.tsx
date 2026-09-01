import Link from "next/link";
import Escudo from "@/components/Escudo";
import InscripcionForm from "./InscripcionForm";

export const metadata = {
  title: "Solicitud de inscripción — Tiro Federal Rufino",
};

export default function InscripcionPage() {
  return (
    <main className="min-h-screen bg-tiro-gris py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Encabezado institucional */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white p-1 shadow">
            <Escudo size={72} />
          </span>
          <h1 className="mt-3 text-2xl font-bold uppercase tracking-wide text-tiro-azul">
            Tiro Federal Rufino
          </h1>
          <p className="text-sm text-tiro-grisTexto">
            Zelio Zolezzi 470 · (6100) Rufino, Santa Fe · Tel. 3382-442733
          </p>
          <h2 className="mt-4 text-lg font-semibold text-tiro-azulOscuro">
            Solicitud de inscripción de socio
          </h2>
        </div>

        <InscripcionForm />

        <p className="mt-6 text-center text-xs text-tiro-grisTexto">
          ¿Ya sos socio?{" "}
          <Link href="/login" className="font-medium text-tiro-azul hover:underline">
            Ingresá acá
          </Link>
        </p>
      </div>
    </main>
  );
}
