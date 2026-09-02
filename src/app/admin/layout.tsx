import { requireAdmin } from "@/lib/session";
import Header from "@/components/Header";

const adminLinks = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/socios", label: "Socios" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/cuotas", label: "Cuotas" },
  { href: "/admin/rifas", label: "Rifas" },
  { href: "/admin/auditoria", label: "Auditoría" },
  { href: "/admin/perfil", label: "Mi cuenta" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-tiro-gris">
      <Header
        nombre={session.user.name ?? "Administrador"}
        rol="ADMIN"
        links={adminLinks}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
