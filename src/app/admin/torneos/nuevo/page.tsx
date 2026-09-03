import Link from "next/link";
import TorneoForm from "@/components/TorneoForm";

export default function NuevoTorneoPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/torneos" className="text-sm text-tiro-azul hover:underline">
          ← Volver a torneos
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tiro-azul">Nuevo torneo</h1>
      </div>
      <TorneoForm />
    </div>
  );
}
