-- CreateEnum
CREATE TYPE "EmpresaStatus" AS ENUM ('ATIVO', 'INATIVO', 'TRIAL');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENTE', 'COORDENACAO', 'MEDICO', 'CLINICA', 'ADMIN');

-- CreateEnum
CREATE TYPE "FuncionarioStatus" AS ENUM ('ATIVO', 'AFASTADO', 'DEMITIDO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoExame" AS ENUM ('ADMISSIONAL', 'PERIODICO', 'RETORNO_AO_TRABALHO', 'MUDANCA_DE_FUNCAO', 'DEMISSIONAL');

-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('TELEMEDICINA', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('SOLICITADO', 'ROTEADO', 'AGENDADO', 'REALIZADO', 'ASO_EMITIDO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Parecer" AS ENUM ('APTO', 'INAPTO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('PCMSO', 'PGR', 'OUTRO');

-- CreateTable
CREATE TABLE "empresas_cliente" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "slug" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cnae" TEXT,
    "grauRisco" INTEGER,
    "logoUrl" TEXT,
    "status" "EmpresaStatus" NOT NULL DEFAULT 'ATIVO',
    "plano" TEXT NOT NULL DEFAULT 'piloto',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "empresaClienteId" TEXT,
    "medicoId" TEXT,
    "clinicaId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "empresaClienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "pis" TEXT,
    "ctps" TEXT,
    "ctpsSerie" TEXT,
    "matriculaEsocial" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexo" "Sexo",
    "funcao" TEXT,
    "cbo" TEXT,
    "setor" TEXT,
    "tomador" TEXT,
    "centroCusto" TEXT,
    "dataAdmissao" TIMESTAMP(3),
    "dataDemissao" TIMESTAMP(3),
    "cidade" TEXT,
    "uf" TEXT,
    "foneCelular" TEXT,
    "foneResidencial" TEXT,
    "email" TEXT,
    "status" "FuncionarioStatus" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinicas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "horarios" TEXT,
    "exames" JSONB,
    "regras" TEXT,
    "contato" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "crm" TEXT NOT NULL,
    "especialidade" TEXT,
    "telemedicina" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "empresaClienteId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "tipoExame" "TipoExame" NOT NULL,
    "modalidade" "Modalidade" NOT NULL,
    "examesNecessarios" JSONB NOT NULL,
    "observacoes" TEXT,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'SOLICITADO',
    "clinicaId" TEXT,
    "medicoId" TEXT,
    "dataAgendada" TIMESTAMP(3),
    "parecer" "Parecer",
    "criadoPorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asos" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "arquivoKey" TEXT NOT NULL,
    "parecer" "Parecer" NOT NULL,
    "examesRealizados" JSONB,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validadeAte" TIMESTAMP(3),

    CONSTRAINT "asos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_eventos" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "deStatus" "StatusSolicitacao",
    "paraStatus" "StatusSolicitacao" NOT NULL,
    "autorId" TEXT,
    "meta" JSONB,
    "ocorridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "afastamentos" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "motivo" TEXT,

    CONSTRAINT "afastamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "empresaClienteId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "arquivoKey" TEXT NOT NULL,
    "vigenciaInicio" TIMESTAMP(3),
    "vigenciaFim" TIMESTAMP(3),
    "versao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_outbox" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "entregue" BOOLEAN NOT NULL DEFAULT false,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cliente_externalId_key" ON "empresas_cliente"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cliente_slug_key" ON "empresas_cliente"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cliente_cnpj_key" ON "empresas_cliente"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_externalId_key" ON "usuarios"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_medicoId_key" ON "usuarios"("medicoId");

-- CreateIndex
CREATE INDEX "usuarios_empresaClienteId_idx" ON "usuarios"("empresaClienteId");

-- CreateIndex
CREATE INDEX "funcionarios_empresaClienteId_status_idx" ON "funcionarios"("empresaClienteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "funcionarios_empresaClienteId_cpf_key" ON "funcionarios"("empresaClienteId", "cpf");

-- CreateIndex
CREATE INDEX "clinicas_cidade_uf_idx" ON "clinicas"("cidade", "uf");

-- CreateIndex
CREATE INDEX "solicitacoes_empresaClienteId_status_idx" ON "solicitacoes"("empresaClienteId", "status");

-- CreateIndex
CREATE INDEX "solicitacoes_funcionarioId_idx" ON "solicitacoes"("funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "asos_solicitacaoId_key" ON "asos"("solicitacaoId");

-- CreateIndex
CREATE INDEX "asos_funcionarioId_idx" ON "asos"("funcionarioId");

-- CreateIndex
CREATE INDEX "status_eventos_solicitacaoId_ocorridoEm_idx" ON "status_eventos"("solicitacaoId", "ocorridoEm");

-- CreateIndex
CREATE INDEX "webhook_outbox_entregue_criadoEm_idx" ON "webhook_outbox"("entregue", "criadoEm");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaClienteId_fkey" FOREIGN KEY ("empresaClienteId") REFERENCES "empresas_cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "clinicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funcionarios" ADD CONSTRAINT "funcionarios_empresaClienteId_fkey" FOREIGN KEY ("empresaClienteId") REFERENCES "empresas_cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_empresaClienteId_fkey" FOREIGN KEY ("empresaClienteId") REFERENCES "empresas_cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "clinicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_medicoId_fkey" FOREIGN KEY ("medicoId") REFERENCES "medicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asos" ADD CONSTRAINT "asos_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asos" ADD CONSTRAINT "asos_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_eventos" ADD CONSTRAINT "status_eventos_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afastamentos" ADD CONSTRAINT "afastamentos_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "funcionarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_empresaClienteId_fkey" FOREIGN KEY ("empresaClienteId") REFERENCES "empresas_cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
