import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { ESTADO_NUMERO_RIFA } from "@/lib/constants";
import { formatearNumero } from "@/lib/rifas";
import { CLUB } from "@/config/club";

// Este endpoint usa fs y pdf-lib: requiere runtime Node
export const runtime = "nodejs";

// GET /api/rifas/numero/[id]/pdf — comprobante del número comprado.
// Público: cualquiera con el id del número (solo si está vendido).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const num = await prisma.numeroRifa.findUnique({
    where: { id: params.id },
    include: { rifa: true },
  });

  if (!num || num.estado !== ESTADO_NUMERO_RIFA.VENDIDO) {
    return NextResponse.json(
      { error: "Comprobante no disponible" },
      { status: 404 }
    );
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const azul = rgb(0.118, 0.298, 0.541);
  const negro = rgb(0.1, 0.1, 0.1);
  const gris = rgb(0.4, 0.42, 0.45);

  let y = height - 60;
  const marginX = 50;

  // Logo
  try {
    const logoRelativo = CLUB.logo.replace(/^\//, "");
    const logoPath = path.join(process.cwd(), "public", logoRelativo);
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logo = await pdf.embedPng(logoBytes);
      page.drawImage(logo, { x: marginX, y: y - 50, width: 50, height: 50 });
    }
  } catch {
    // sin logo, seguimos
  }

  page.drawText(CLUB.nombre.toUpperCase(), {
    x: marginX + 65,
    y: y - 20,
    size: 18,
    font: fontBold,
    color: azul,
  });
  page.drawText("Comprobante de participación en rifa", {
    x: marginX + 65,
    y: y - 40,
    size: 10,
    font,
    color: gris,
  });

  y -= 100;
  page.drawText(num.rifa.titulo, {
    x: marginX,
    y,
    size: 16,
    font: fontBold,
    color: negro,
  });

  y -= 40;
  // Número grande
  page.drawText("TU NÚMERO", { x: marginX, y, size: 10, font, color: gris });
  y -= 34;
  page.drawText(formatearNumero(num.numero, num.rifa.cifras), {
    x: marginX,
    y,
    size: 40,
    font: fontBold,
    color: azul,
  });

  y -= 50;
  function linea(label: string, valor: string) {
    page.drawText(`${label}:`, { x: marginX, y, size: 11, font: fontBold, color: negro });
    page.drawText(valor, { x: marginX + 130, y, size: 11, font, color: negro });
    y -= 22;
  }

  linea("Nombre", `${num.compradorApellido ?? ""}, ${num.compradorNombre ?? ""}`);
  linea("Teléfono", num.compradorTelefono ?? "-");
  linea("Valor del número", `$${num.rifa.precioNumero}`);
  linea(
    "Fecha de pago",
    num.fechaPago ? num.fechaPago.toLocaleDateString("es-AR") : "-"
  );

  y -= 20;
  page.drawText("El sorteo se realiza por la Lotería Nacional.", {
    x: marginX,
    y,
    size: 9,
    font,
    color: gris,
  });
  y -= 14;
  page.drawText("Conservá este comprobante como respaldo de tu participación.", {
    x: marginX,
    y,
    size: 9,
    font,
    color: gris,
  });

  const pdfBytes = await pdf.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rifa-${num.numero}.pdf"`,
    },
  });
}
