import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireUser, isCoordenacao } from "@/lib/session";
import {
  calcularFatura,
  formatBRL,
  parseCompetencia,
} from "@/lib/faturamento";
import { TIPO_EXAME_LABEL } from "@/lib/validations";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  const user = await requireUser();
  const { empresaId } = await params;

  // CLIENTE só emite a própria fatura
  if (!isCoordenacao(user.role) && user.empresaClienteId !== empresaId) {
    return new Response("Sem permissão", { status: 403 });
  }

  const empresa = await prisma.empresaCliente.findUnique({
    where: { id: empresaId },
    select: { razaoSocial: true, cnpj: true },
  });
  if (!empresa) return new Response("Empresa não encontrada", { status: 404 });

  const comp = parseCompetencia(
    new URL(req.url).searchParams.get("competencia"),
  );
  const fatura = await calcularFatura(empresaId, comp);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 790;

  const line = (text: string, opts?: { size?: number; bold?: boolean }) => {
    page.drawText(text, {
      x: 40,
      y,
      size: opts?.size ?? 11,
      font: opts?.bold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= (opts?.size ?? 11) + 7;
  };

  line("FATURA — GESTÃO OCUPACIONAL (SGO)", { size: 16, bold: true });
  line(`Competência: ${fatura.competencia}`);
  y -= 8;
  line(`Cliente: ${empresa.razaoSocial}`, { bold: true });
  line(`CNPJ: ${empresa.cnpj}`);
  y -= 10;
  line("Resumo", { size: 13, bold: true });
  line(`Vidas faturáveis: ${fatura.vidas}`);
  line(`Valor por vida: ${formatBRL(fatura.valorVidaCentavos)}`);
  line(`TOTAL: ${formatBRL(fatura.totalCentavos)}`, { size: 13, bold: true });
  y -= 10;
  line(`Exames realizados na competência (${fatura.totalExames})`, {
    size: 13,
    bold: true,
  });
  if (fatura.examesPorTipo.length === 0) {
    line("  Nenhum exame na competência.");
  }
  for (const e of fatura.examesPorTipo) {
    line(`  ${TIPO_EXAME_LABEL[e.tipo] ?? e.tipo}: ${e.quantidade}`);
  }
  y -= 14;
  line(`Emitida em ${new Date().toLocaleDateString("pt-BR")} — documento gerencial, não fiscal.`, { size: 9 });

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="fatura-${fatura.competencia}.pdf"`,
    },
  });
}
