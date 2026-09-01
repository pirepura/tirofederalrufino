import Link from "next/link";
import SocioForm from "@/components/SocioForm";

export default function NuevoSocioPage() {
  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/admin/socios"
          className="text-sm text-tiro-azul hover:underline"
        >
          ← Volver a socios
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-tiro-azul">Nuevo socio</h1>
      </div>
      <SocioForm modo="crear" />
    </div>
  );
}
