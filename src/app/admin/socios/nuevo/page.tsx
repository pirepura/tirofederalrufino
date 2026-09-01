import Link from "next/link";
import SocioForm from "@/components/SocioForm";
import { categoriasActivas } from "@/lib/categorias";

export const dynamic = "force-dynamic";

export default async function NuevoSocioPage() {
  const categorias = await categoriasActivas();

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
      {categorias.length === 0 ? (
        <div className="card text-tiro-grisTexto">
          Antes de cargar socios, creá al menos una{" "}
          <Link href="/admin/categorias" className="text-tiro-azul hover:underline">
            categoría
          </Link>
          .
        </div>
      ) : (
        <SocioForm modo="crear" categorias={categorias} />
      )}
    </div>
  );
}
