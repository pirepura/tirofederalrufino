import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Estados/roles como string (SQLite no usa enums)
const ROL_ADMIN = "ADMIN";
const ROL_SOCIO = "SOCIO";
const ACTIVO = "ACTIVO";
const PENDIENTE = "PENDIENTE";
const PAGADA = "PAGADA";

async function main() {
  console.log("🌱 Sembrando datos de ejemplo...");

  // ---- Administrador ----
  const adminPass = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@tirofederalrufino.com" },
    update: {},
    create: {
      email: "admin@tirofederalrufino.com",
      passwordHash: adminPass,
      nombre: "Administrador del Club",
      rol: ROL_ADMIN,
    },
  });
  console.log("✔ Admin: admin@tirofederalrufino.com / admin123");

  // ---- Socios de ejemplo ----
  const sociosDemo = [
    {
      email: "juan@example.com",
      nombre: "Juan",
      apellido: "Pérez",
      dni: "30111222",
      numeroSocio: 1,
      cuotaMensual: 5000,
      categoria: "General",
    },
    {
      email: "maria@example.com",
      nombre: "María",
      apellido: "Gómez",
      dni: "28999888",
      numeroSocio: 2,
      cuotaMensual: 5000,
      categoria: "General",
    },
    {
      email: "carlos@example.com",
      nombre: "Carlos",
      apellido: "López",
      dni: "33444555",
      numeroSocio: 3,
      cuotaMensual: 3500,
      categoria: "Estudiante",
    },
  ];

  const socioPass = await bcrypt.hash("socio123", 10);

  // Crear categorías de ejemplo
  const catGeneral = await prisma.categoria.upsert({
    where: { nombre: "General" },
    update: {},
    create: { nombre: "General", cuotaMensual: 5000 },
  });
  const catEstudiante = await prisma.categoria.upsert({
    where: { nombre: "Estudiante" },
    update: {},
    create: { nombre: "Estudiante", cuotaMensual: 3500 },
  });

  for (const s of sociosDemo) {
    const categoriaId =
      s.categoria === "Estudiante" ? catEstudiante.id : catGeneral.id;

    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: socioPass,
        nombre: `${s.nombre} ${s.apellido}`,
        rol: ROL_SOCIO,
        socio: {
          create: {
            numeroSocio: s.numeroSocio,
            dni: s.dni,
            nombre: s.nombre,
            apellido: s.apellido,
            categoriaId,
            estado: ACTIVO,
          },
        },
      },
      include: { socio: true },
    });

    const socioId = user.socio!.id;

    // Genera cuotas de ejemplo: una pagada (mes pasado) y una pendiente (este mes)
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();
    const mesPasado = mesActual === 1 ? 12 : mesActual - 1;
    const anioMesPasado = mesActual === 1 ? anioActual - 1 : anioActual;

    // Cuota del mes pasado (pagada)
    await prisma.cuota.upsert({
      where: {
        socioId_periodoMes_periodoAnio: {
          socioId,
          periodoMes: mesPasado,
          periodoAnio: anioMesPasado,
        },
      },
      update: {},
      create: {
        socioId,
        periodoMes: mesPasado,
        periodoAnio: anioMesPasado,
        monto: s.cuotaMensual,
        fechaVencimiento: new Date(anioMesPasado, mesPasado - 1, 10),
        estado: PAGADA,
        fechaPago: new Date(anioMesPasado, mesPasado - 1, 8),
        metodoPago: "efectivo",
      },
    });

    // Cuota de este mes (pendiente)
    await prisma.cuota.upsert({
      where: {
        socioId_periodoMes_periodoAnio: {
          socioId,
          periodoMes: mesActual,
          periodoAnio: anioActual,
        },
      },
      update: {},
      create: {
        socioId,
        periodoMes: mesActual,
        periodoAnio: anioActual,
        monto: s.cuotaMensual,
        fechaVencimiento: new Date(anioActual, mesActual - 1, 10),
        estado: PENDIENTE,
      },
    });

    console.log(`✔ Socio N°${s.numeroSocio}: ${s.email} / socio123`);
  }

  // ---- Líneas de tiro (para el módulo futuro) ----
  for (let i = 1; i <= 4; i++) {
    await prisma.lineaTiro.upsert({
      where: { numero: i },
      update: {},
      create: {
        numero: i,
        nombre: `Línea ${i}`,
        descripcion: "Puesto de tiro de 25 metros",
        precioTurno: 2000,
        activa: true,
      },
    });
  }
  console.log("✔ 4 líneas de tiro creadas");

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
