import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, tenantScope } from "@/lib/session";
import { signedDownloadUrl } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const sol = await prisma.solicitacao.findFirst({
    where: { id, ...tenantScope(user) },
    include: { aso: { select: { arquivoKey: true } } },
  });
  if (!sol?.aso) {
    return new NextResponse("ASO não encontrado", { status: 404 });
  }

  const url = await signedDownloadUrl(sol.aso.arquivoKey, 300);
  return NextResponse.redirect(url);
}
