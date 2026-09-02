import Link from "next/link";
import RifaForm from "@/components/RifaForm";

export default function NuevaRifaPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/rifas" className="text-sm text-tiro-azul hover:underline">
          ← Volver a rifas
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tiro-azul">Nueva rifa</h1>
      </div>
      <RifaForm />
    </div>
  );
}
