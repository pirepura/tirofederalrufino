import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";

export default async function Home() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.rol === ROLES.ADMIN) {
    redirect("/admin");
  }

  redirect("/socio");
}
