import { requireSocio } from "@/lib/session";
import Header from "@/components/Header";

const socioLinks = [
  { href: "/socio", label: "Inicio" },
  { href: "/socio/pagos", label: "Mis pagos" },
  { href: "/socio/alquiler", label: "Alquiler de líneas" },
  { href: "/socio/perfil", label: "Mi cuenta" },
];

export default async function SocioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSocio();

  return (
    <div className="min-h-screen bg-tiro-gris">
      <Header
        nombre={session.user.name ?? "Socio"}
        rol="SOCIO"
        links={socioLinks}
      />
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
