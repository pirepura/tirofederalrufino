import { prisma } from "@/lib/db";
import type { CategoriaInput } from "@/lib/validators";

// Lista todas las categorías con la cantidad de socios de cada una.
export async function listarCategorias() {
  return prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { socios: true } } },
  });
}

// Solo las categorías activas (para selectores).
export async function categoriasActivas() {
  return prisma.categoria.findMany({
    where: { activa: true },
    orderBy: { nombre: "asc" },
  });
}

export async function crearCategoria(input: CategoriaInput) {
  const nombre = input.nombre.trim();
  const existe = await prisma.categoria.findUnique({ where: { nombre } });
  if (existe) {
    throw new Error("Ya existe una categoría con ese nombre");
  }
  return prisma.categoria.create({
    data: {
      nombre,
      cuotaMensual: input.cuotaMensual,
      activa: input.activa,
    },
  });
}

export async function actualizarCategoria(id: string, input: CategoriaInput) {
  const nombre = input.nombre.trim();
  // Verificar que el nombre no choque con otra categoría distinta
  const otra = await prisma.categoria.findUnique({ where: { nombre } });
  if (otra && otra.id !== id) {
    throw new Error("Ya existe otra categoría con ese nombre");
  }
  return prisma.categoria.update({
    where: { id },
    data: {
      nombre,
      cuotaMensual: input.cuotaMensual,
      activa: input.activa,
    },
  });
}

export async function eliminarCategoria(id: string) {
  const conSocios = await prisma.socio.count({ where: { categoriaId: id } });
  if (conSocios > 0) {
    throw new Error(
      `No se puede eliminar: hay ${conSocios} socio(s) en esta categoría. Reasignálos antes de eliminarla.`
    );
  }
  return prisma.categoria.delete({ where: { id } });
}
