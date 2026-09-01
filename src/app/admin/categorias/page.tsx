import { listarCategorias } from "@/lib/categorias";
import CategoriasManager from "@/components/CategoriasManager";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categorias = await listarCategorias();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-tiro-azul">
          Categorías y cuotas
        </h1>
        <p className="text-sm text-tiro-grisTexto">
          Definí el valor de la cuota de cada categoría. Al cambiar el precio,
          impacta en las próximas cuotas que generes para los socios de esa
          categoría.
        </p>
      </div>

      <CategoriasManager categorias={categorias} />
    </div>
  );
}
