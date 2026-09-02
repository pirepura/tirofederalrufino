import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSession } from "@/lib/session";
import { ROLES } from "@/lib/constants";
import { CLUB } from "@/config/club";
import { prisma } from "@/lib/db";

// Este endpoint usa fs y pdf-lib: requiere runtime Node (no Edge)
export const runtime = "nodejs";

// GET /api/solicitudes/[id]/pdf — genera el PDF de la solicitud con el
// formato del formulario del club (solo admin).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (session?.user.rol !== ROLES.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const s = await prisma.solicitudInscripcion.findUnique({
    where: { id: params.id },
  });
  if (!s) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4 en puntos
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const azul = rgb(0.118, 0.298, 0.541);
  const negro = rgb(0.1, 0.1, 0.1);
  const gris = rgb(0.4, 0.42, 0.45);

  let y = height - 50;
  const marginX = 50;
  const contentWidth = width - marginX * 2;

  // Logo (si existe el archivo definido en la config del club)
  try {
    const logoRelativo = CLUB.logo.replace(/^\//, ""); // "/escudo.png" -> "escudo.png"
    const logoPath = path.join(process.cwd(), "public", logoRelativo);
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdf.embedPng(logoBytes);
      const logoDims = logo.scale(60 / logo.height);
      page.drawImage(logo, {
        x: marginX,
        y: y - 60,
        width: logoDims.width,
        height: 60,
      });
    }
  } catch {
    // Si el logo falla, se omite sin romper el PDF
  }

  // Encabezado
  page.drawText(CLUB.nombre.toUpperCase(), {
    x: marginX + 80,
    y: y - 20,
    size: 20,
    font: fontBold,
    color: azul,
  });
  page.drawText(`${CLUB.direccion} - ${CLUB.ciudad}`, {
    x: marginX + 80,
    y: y - 38,
    size: 9,
    font,
    color: gris,
  });
  page.drawText(`Tel. ${CLUB.telefono}`, {
    x: marginX + 80,
    y: y - 50,
    size: 9,
    font,
    color: gris,
  });

  y -= 90;
  page.drawText("SOLICITUD DE INSCRIPCION SOCIO", {
    x: marginX,
    y,
    size: 14,
    font: fontBold,
    color: negro,
  });
  y -= 16;
  page.drawText(
    `Fecha: ${s.createdAt.toLocaleDateString("es-AR")}`,
    { x: marginX, y, size: 10, font, color: gris }
  );

  // Helper para secciones
  function seccion(titulo: string) {
    y -= 28;
    page.drawRectangle({
      x: marginX,
      y: y - 4,
      width: contentWidth,
      height: 18,
      color: rgb(0.9, 0.93, 0.97),
    });
    page.drawText(titulo, {
      x: marginX + 6,
      y,
      size: 10,
      font: fontBold,
      color: azul,
    });
    y -= 22;
  }

  // Helper para campos
  function campo(label: string, valor: string) {
    page.drawText(`${label}:`, {
      x: marginX,
      y,
      size: 10,
      font: fontBold,
      color: negro,
    });
    page.drawText(valor || "-", {
      x: marginX + 170,
      y,
      size: 10,
      font,
      color: negro,
    });
    y -= 20;
  }

  seccion("1 - DATOS PERSONALES DEL SOLICITANTE");
  campo("Nombre completo", s.nombreCompleto);
  campo("Documento (DNI)", s.dni);
  campo("Fecha de nacimiento", s.fechaNacimiento.toLocaleDateString("es-AR"));
  campo("Domicilio real", s.domicilio);
  campo("Correo electrónico", s.email);
  campo("Celular", s.celular);

  seccion("2 - VINCULACION PREVIA CON LA ASOCIACION");
  if (s.fueSocio) {
    campo("Año en que se asoció", String(s.anioAsociado ?? "-"));
    campo("Categoría de asociado", s.categoriaPrevia ?? "-");
    campo("Primer período de pago", s.primerPeriodo ?? "-");
  } else {
    campo("Vinculación", "Primera vez que se asocia");
  }

  seccion("3 - DECLARACION");
  y -= 4;
  const decl =
    "Lo expresado tiene carácter de declaración jurada. Afirmo que los datos consignados son verdaderos.";
  page.drawText(decl, { x: marginX, y, size: 9, font, color: negro, maxWidth: contentWidth });
  y -= 30;
  page.drawText(
    s.aceptaDeclaracion ? "[X] Aceptó la declaración jurada" : "[ ] No aceptó",
    { x: marginX, y, size: 9, font, color: gris }
  );

  // Firma
  y -= 50;
  try {
    const base64 = s.firmaDataUrl.split(",")[1];
    if (base64) {
      const firmaBytes = Buffer.from(base64, "base64");
      const firmaImg = await pdf.embedPng(firmaBytes);
      const fw = 180;
      const fh = (firmaImg.height / firmaImg.width) * fw;
      page.drawImage(firmaImg, { x: marginX, y: y - fh + 20, width: fw, height: fh });
    }
  } catch {
    // firma no embebible, se omite
  }

  page.drawLine({
    start: { x: marginX, y: y - 25 },
    end: { x: marginX + 200, y: y - 25 },
    thickness: 1,
    color: negro,
  });
  page.drawText("FIRMA", { x: marginX, y: y - 38, size: 9, font: fontBold, color: negro });

  page.drawLine({
    start: { x: marginX + 260, y: y - 25 },
    end: { x: marginX + 460, y: y - 25 },
    thickness: 1,
    color: negro,
  });
  page.drawText("ACLARACION", {
    x: marginX + 260,
    y: y - 38,
    size: 9,
    font: fontBold,
    color: negro,
  });
  page.drawText(s.nombreCompleto, {
    x: marginX + 260,
    y: y - 20,
    size: 10,
    font,
    color: negro,
  });

  const pdfBytes = await pdf.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="solicitud-${s.dni}.pdf"`,
    },
  });
}
