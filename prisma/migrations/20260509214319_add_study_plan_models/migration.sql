-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "plano" TEXT NOT NULL,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Materia" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Materia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tema" (
    "id" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topico" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Topico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagemConteudo" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "legenda" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "refTexto" TEXT,

    CONSTRAINT "ImagemConteudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questao" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "enunciado" TEXT NOT NULL,
    "alternativas" JSONB NOT NULL,
    "gabarito" TEXT NOT NULL,
    "explicacao" TEXT,
    "dificuldade" TEXT NOT NULL,

    CONSTRAINT "Questao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "frente" TEXT NOT NULL,
    "verso" TEXT NOT NULL,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulado" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tempoLimite" INTEGER,

    CONSTRAINT "Simulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimuladoQuestao" (
    "simuladoId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "SimuladoQuestao_pkey" PRIMARY KEY ("simuladoId","questaoId")
);

-- CreateTable
CREATE TABLE "ResultadoSimulado" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "simuladoId" TEXT NOT NULL,
    "acertos" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "tempoGasto" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoSimulado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" TEXT NOT NULL,
    "resultadoId" TEXT NOT NULL,
    "questaoId" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progresso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "lidoEm" TIMESTAMP(3),

    CONSTRAINT "Progresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashcardProgresso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "flashcardId" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "revisarEm" TIMESTAMP(3),

    CONSTRAINT "FlashcardProgresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoEstudo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "duracaoMin" INTEGER,
    "materiaId" TEXT,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "SessaoEstudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "MetodoEstudo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pesoConteudoNovo" INTEGER NOT NULL,
    "pesoRevisaoFlashcards" INTEGER NOT NULL,
    "pesoQuestoes" INTEGER NOT NULL,
    "pesoRevisaoErros" INTEGER NOT NULL,
    "duracaoMediaDias" INTEGER NOT NULL,
    "velocidadeRevisao" TEXT NOT NULL,
    "enfaseSimulados" TEXT NOT NULL,

    CONSTRAINT "MetodoEstudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoEstudo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "metodoId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "horasDia" INTEGER,
    "diasSemana" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "estudaFds" BOOLEAN NOT NULL DEFAULT false,
    "dataProva" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',

    CONSTRAINT "PlanoEstudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CicloEstudo" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConclusao" TIMESTAMP(3),
    "totalConteudos" INTEGER NOT NULL DEFAULT 0,
    "conteudosVistos" INTEGER NOT NULL DEFAULT 0,
    "totalFlashcards" INTEGER NOT NULL DEFAULT 0,
    "flashcardsVistos" INTEGER NOT NULL DEFAULT 0,
    "totalQuestoes" INTEGER NOT NULL DEFAULT 0,
    "acertos" INTEGER NOT NULL DEFAULT 0,
    "erros" INTEGER NOT NULL DEFAULT 0,
    "taxaAcerto" DOUBLE PRECISION,
    "temasCriticos" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "CicloEstudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissaoDiaria" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "conteudosParaEstudar" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "revisoesParaFazer" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flashcardsParaFazer" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "questoesParaFazer" INTEGER NOT NULL DEFAULT 0,
    "simuladoParaFazer" BOOLEAN NOT NULL DEFAULT false,
    "errosParaRevisar" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "MissaoDiaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TarefaEstudo" (
    "id" TEXT NOT NULL,
    "missaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "recursoId" TEXT,
    "descricao" TEXT NOT NULL,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "concluidaEm" TIMESTAMP(3),

    CONSTRAINT "TarefaEstudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisaoProgramada" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "dataRevisao" TIMESTAMP(3) NOT NULL,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "concluidaEm" TIMESTAMP(3),
    "intervalo" TEXT NOT NULL,

    CONSTRAINT "RevisaoProgramada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicoCritico" (
    "id" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "totalErros" INTEGER NOT NULL DEFAULT 0,
    "taxaAcerto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimaRevisao" TIMESTAMP(3),
    "nivel" TEXT NOT NULL DEFAULT 'ALERTA',

    CONSTRAINT "TopicoCritico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoCiclo" (
    "id" TEXT NOT NULL,
    "cicloId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "metodoNome" TEXT NOT NULL,
    "numeroCiclo" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "conteudosVistos" INTEGER NOT NULL,
    "flashcardsVistos" INTEGER NOT NULL,
    "questoesRealizadas" INTEGER NOT NULL,
    "taxaAcerto" DOUBLE PRECISION NOT NULL,
    "temasCriticos" JSONB NOT NULL,

    CONSTRAINT "HistoricoCiclo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_usuarioId_key" ON "Assinatura"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Materia_slug_key" ON "Materia"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tema_materiaId_slug_key" ON "Tema"("materiaId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Progresso_usuarioId_temaId_key" ON "Progresso"("usuarioId", "temaId");

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardProgresso_usuarioId_flashcardId_key" ON "FlashcardProgresso"("usuarioId", "flashcardId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "MetodoEstudo_slug_key" ON "MetodoEstudo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PlanoEstudo_usuarioId_key" ON "PlanoEstudo"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricoCiclo_cicloId_key" ON "HistoricoCiclo"("cicloId");

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tema" ADD CONSTRAINT "Tema_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "Materia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topico" ADD CONSTRAINT "Topico_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagemConteudo" ADD CONSTRAINT "ImagemConteudo_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questao" ADD CONSTRAINT "Questao_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimuladoQuestao" ADD CONSTRAINT "SimuladoQuestao_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "Simulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimuladoQuestao" ADD CONSTRAINT "SimuladoQuestao_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoSimulado" ADD CONSTRAINT "ResultadoSimulado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoSimulado" ADD CONSTRAINT "ResultadoSimulado_simuladoId_fkey" FOREIGN KEY ("simuladoId") REFERENCES "Simulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "ResultadoSimulado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_questaoId_fkey" FOREIGN KEY ("questaoId") REFERENCES "Questao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progresso" ADD CONSTRAINT "Progresso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progresso" ADD CONSTRAINT "Progresso_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlashcardProgresso" ADD CONSTRAINT "FlashcardProgresso_flashcardId_fkey" FOREIGN KEY ("flashcardId") REFERENCES "Flashcard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoEstudo" ADD CONSTRAINT "SessaoEstudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoEstudo" ADD CONSTRAINT "PlanoEstudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanoEstudo" ADD CONSTRAINT "PlanoEstudo_metodoId_fkey" FOREIGN KEY ("metodoId") REFERENCES "MetodoEstudo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CicloEstudo" ADD CONSTRAINT "CicloEstudo_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissaoDiaria" ADD CONSTRAINT "MissaoDiaria_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaEstudo" ADD CONSTRAINT "TarefaEstudo_missaoId_fkey" FOREIGN KEY ("missaoId") REFERENCES "MissaoDiaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisaoProgramada" ADD CONSTRAINT "RevisaoProgramada_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicoCritico" ADD CONSTRAINT "TopicoCritico_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoCiclo" ADD CONSTRAINT "HistoricoCiclo_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloEstudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoCiclo" ADD CONSTRAINT "HistoricoCiclo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
