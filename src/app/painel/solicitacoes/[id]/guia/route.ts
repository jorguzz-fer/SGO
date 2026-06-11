import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope } from "@/lib/session";
import {
  EXAME_LABEL,
  TIPO_EXAME_LABEL,
} from "@/lib/validations";

type ExameItem = { tipo: string; detalhe?: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const sol = await prisma.solicitacao.findFirst({
    where: { id, ...tenantScope(user) },
    include: {
      funcionario: true,
      empresaCliente: { select: { razaoSocial: true, cnpj: true } },
      clinica: { select: { nome: true, endereco: true } },
    },
  });
  if (!sol) return new Response("Não encontrado", { status: 404 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 800;

  const line = (text: string, opts?: { size?: number; bold?: boolean }) => {
    page.drawText(text, {
      x: 40,
      y,
      size: opts?.size ?? 10,
      font: opts?.bold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= (opts?.size ?? 10) + 6;
  };

  line("GUIA DE ENCAMINHAMENTO", { size: 16, bold: true });
  line("Programa de Controle de Saúde Ocupacional", { size: 9 });
  y -= 6;
  line(`Empresa: ${sol.empresaCliente.razaoSocial}`, { bold: true });
  line(`CNPJ: ${sol.empresaCliente.cnpj}`);
  y -= 6;
  line(`Funcionário: ${sol.funcionario.nome}`, { bold: true });
  line(`CPF: ${sol.funcionario.cpf}   RG: ${sol.funcionario.rg ?? "-"}`);
  line(`Função: ${sol.funcionario.funcao ?? "-"}   Setor: ${sol.funcionario.setor ?? "-"}`);
  line(`Tomador/Posto: ${sol.funcionario.tomador ?? "-"}`);
  line(`Cidade/UF: ${[sol.funcionario.cidade, sol.funcionario.uf].filter(Boolean).join("/") || "-"}`);
  y -= 6;
  line(`Tipo de exame: ${TIPO_EXAME_LABEL[sol.tipoExame]}`, { bold: true });
  line(`Modalidade: ${sol.modalidade === "TELEMEDICINA" ? "Telemedicina" : "Presencial"}`);

  const exames = (sol.examesNecessarios as ExameItem[] | null) ?? [];
  line("Exames necessários:", { bold: true });
  for (const e of exames) {
    line(`  - ${EXAME_LABEL[e.tipo] ?? e.tipo}${e.detalhe ? `: ${e.detalhe}` : ""}`);
  }

  if (sol.clinica) {
    y -= 6;
    line(`Clínica: ${sol.clinica.nome}`, { bold: true });
    if (sol.clinica.endereco) line(`Endereço: ${sol.clinica.endereco}`);
  }
  if (sol.observacoes) {
    y -= 6;
    line(`Observações: ${sol.observacoes}`);
  }

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="guia-${sol.id}.pdf"`,
    },
  });
}
