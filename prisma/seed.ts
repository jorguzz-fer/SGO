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
  const dcas = await prisma.empresaCliente.upsert({
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

  // Usuário CLIENTE (RH da DECAS) — escopo multi-tenant
  const clienteEmail = process.env.SEED_CLIENTE_EMAIL ?? "rh@dcas.com.br";
  await prisma.usuario.upsert({
    where: { email: clienteEmail },
    update: {},
    create: {
      email: clienteEmail,
      nome: "RH DECAS",
      role: "CLIENTE",
      empresaClienteId: dcas.id,
      senhaHash: await bcrypt.hash(adminSenha, 10),
    },
  });

  // Médico de telemedicina (alvo de roteamento)
  if ((await prisma.medico.count()) === 0) {
    await prisma.medico.create({
      data: {
        nome: "Dr. Médico Telemedicina",
        crm: "000000/SP",
        especialidade: "Medicina do Trabalho",
        telemedicina: true,
      },
    });
  }

  // Clínicas credenciadas (presencial)
  if ((await prisma.clinica.count()) === 0) {
    await prisma.clinica.createMany({
      data: [
        {
          nome: "SATMED",
          cidade: "São Paulo",
          uf: "SP",
          endereco: "Rua Dr. Samuel Porto, 351 - Saúde/SP",
          horarios: "Seg/Ter/Qui 13h; Qua/Sex 12h",
        },
        {
          nome: "Consult (Matriz Guarulhos)",
          cidade: "Guarulhos",
          uf: "SP",
          endereco: "Rua Luiz Turri, 120 - Jardim Zaira",
          horarios: "Seg a Sex 08h–12h",
        },
      ],
    });
  }

  console.log(`Seed concluído. Admin: ${adminEmail} · Cliente: ${clienteEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
