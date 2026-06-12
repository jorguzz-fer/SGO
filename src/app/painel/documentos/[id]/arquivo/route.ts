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

  const doc = await prisma.documento.findFirst({
    where: { id, ...tenantScope(user) },
    select: { arquivoKey: true },
  });
  if (!doc) return new NextResponse("Documento não encontrado", { status: 404 });

  const url = await signedDownloadUrl(doc.arquivoKey, 300);
  return NextResponse.redirect(url);
}
