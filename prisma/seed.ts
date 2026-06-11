import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@wowmais.com.br";
  const adminSenha = process.env.SEED_ADMIN_SENHA ?? "trocar-esta-senha";

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      nome: "Administrador",
      role: "ADMIN",
      senhaHash: await bcrypt.hash(adminSenha, 10),
    },
  });

  // Empresa-cliente piloto (DECAS)
  await prisma.empresaCliente.upsert({
    where: { slug: "dcas" },
    update: {},
    create: {
      slug: "dcas",
      razaoSocial: "DCAS SERVIÇOS LTDA",
      cnpj: "24.715.289/0001-93",
      cnae: "8121-4/00",
      grauRisco: 3,
    },
  });

  console.log(`Seed concluído. Admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
