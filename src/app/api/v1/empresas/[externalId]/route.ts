import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiToken, problem } from "@/lib/api-auth";

const schema = z.object({
  slug: z.string().trim().min(1),
  razaoSocial: z.string().trim().min(1),
  cnpj: z.string().trim().min(1),
  cnae: z.string().trim().optional(),
  grauRisco: z.number().int().min(1).max(4).optional(),
  logoUrl: z.string().url().optional(),
  valorVidaCentavos: z.number().int().positive().optional(),
});

/** Upsert de empresa-cliente vindo do app Wow+ (chave: externalId). */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ externalId: string }> },
) {
  const deny = requireApiToken(req);
  if (deny) return deny;

  const { externalId } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return problem(400, "invalid_body", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }

  const empresa = await prisma.empresaCliente.upsert({
    where: { externalId },
    create: { externalId, ...parsed.data },
    update: { ...parsed.data },
  });

  return NextResponse.json({ id: empresa.id, externalId: empresa.externalId });
}
