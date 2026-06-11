import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Liveness para o Coolify: responde 200 enquanto o app roda.
// O status do banco vai no corpo (não derruba o container se o DB oscilar).
export async function GET() {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  return NextResponse.json({
    status: "ok",
    db,
    service: "sgo",
    time: new Date().toISOString(),
  });
}
