import { listarCategorias } from "@/lib/categorias";
import CategoriasManager from "@/components/CategoriasManager";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categorias = await listarCategorias();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-tiro-azul">Categorías</h1>
        <p className="text-sm text-tiro-grisTexto">
          Definí el valor de la cuota de cada categoría. Al cambiar un precio,
          impacta en las próximas cuotas de todos los socios de esa categoría.
          Las cuotas ya generadas conservan su monto original.
        </p>
      </div>
      <CategoriasManager categorias={categorias} />
    </div>
  );
}
