-- AlterTable
ALTER TABLE "PlanoEstudo" ADD COLUMN     "minutosConteudo" INTEGER,
ADD COLUMN     "minutosFlashcards" INTEGER,
ADD COLUMN     "minutosQuestoes" INTEGER,
ADD COLUMN     "minutosSimulado" INTEGER,
ADD COLUMN     "previsaoConclusao" TIMESTAMP(3);
