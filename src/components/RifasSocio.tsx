import Link from "next/link";

function pesos(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

type Rifa = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  imagenData: string | null;
  precioNumero: number;
  disponibles: number;
};

export default function RifasSocio({ rifas }: { rifas: Rifa[] }) {
  if (rifas.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-tiro-azul">
        🎟️ Rifas disponibles
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {rifas.map((r) => (
          <div
            key={r.id}
            className="card flex flex-col overflow-hidden p-0"
          >
            {r.imagenData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.imagenData}
                alt={r.titulo}
                className="h-40 w-full object-cover"
              />
            )}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold text-tiro-azul">{r.titulo}</h3>
              {r.descripcion && (
                <p className="mt-1 line-clamp-2 text-sm text-tiro-grisTexto">
                  {r.descripcion}
                </p>
              )}
              <p className="mt-2 text-sm">
                Número:{" "}
                <span className="font-bold text-tiro-azul">
                  {pesos(r.precioNumero)}
                </span>
              </p>
              <p className="text-xs text-tiro-grisTexto">
                {r.disponibles} número(s) disponible(s)
              </p>
              <Link
                href={`/rifa/${r.slug}`}
                target="_blank"
                className="btn-primary mt-3 text-center"
              >
                Comprar número
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
