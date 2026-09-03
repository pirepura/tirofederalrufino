import Link from "next/link";
import NuevoTorneoForm from "@/components/NuevoTorneoForm";

export default function NuevoTorneoPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/torneos" className="text-sm text-tiro-azul hover:underline">
          ← Volver a torneos
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tiro-azul">Nuevo torneo</h1>
        <p className="text-sm text-tiro-grisTexto">
          Creá el torneo y luego cargá sus categorías y participantes.
        </p>
      </div>
      <NuevoTorneoForm />
    </div>
  );
}
