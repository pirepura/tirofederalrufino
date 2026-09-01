import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Seed de PRODUCCIÓN: crea únicamente la cuenta de administrador.
// No carga socios ni cuotas de ejemplo (la base de producción arranca limpia).
//
// El email y la contraseña se toman de variables de entorno:
//   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE
// Si no están definidas, usa valores por defecto (CAMBIAR luego).

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@tirofederalrufino.com")
    .toLowerCase()
    .trim();
  const password = process.env.ADMIN_PASSWORD ?? "CambiarEstaClave123";
  const nombre = process.env.ADMIN_NOMBRE ?? "Administrador del Club";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {}, // si ya existe, no lo pisa
    create: {
      email,
      passwordHash,
      nombre,
      rol: "ADMIN",
    },
  });

  console.log(`✅ Administrador listo: ${admin.email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(
      "⚠  Se usó la contraseña por defecto. Cambiala definiendo ADMIN_PASSWORD."
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
