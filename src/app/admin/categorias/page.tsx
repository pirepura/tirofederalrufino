import { listarCategorias } from "@/lib/categorias";
import CategoriasAdmin from "@/components/CategoriasAdmin";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categorias = await listarCategorias();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-tiro-azul">Categorías</h1>
        <p className="text-sm text-tiro-grisTexto">
          Definí las categorías y el valor de la cuota de cada una. Al cambiar un
          precio acá, se aplica a las próximas cuotas de todos los socios de esa
          categoría.
        </p>
      </div>
      <CategoriasAdmin categorias={categorias} />
    </div>
  );
}
