import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seed: Inserindo métodos de estudo...')

  const metodos = [
    {
      nome: 'Doutrina',
      slug: 'doutrina',
      descricao: 'Repetição espaçada, flashcards e memorização contínua. Ideal para quem aprende melhor repetindo.',
      pesoConteudoNovo: 30,
      pesoRevisaoFlashcards: 45,
      pesoQuestoes: 15,
      pesoRevisaoErros: 10,
      duracaoMediaDias: 120,
      velocidadeRevisao: 'alta',
      enfaseSimulados: 'baixa',
    },
    {
      nome: 'Combate',
      slug: 'combate',
      descricao: 'Active recall, questões e simulados. Ideal para quem aprende melhor executando.',
      pesoConteudoNovo: 25,
      pesoRevisaoFlashcards: 25,
      pesoQuestoes: 35,
      pesoRevisaoErros: 15,
      duracaoMediaDias: 90,
      velocidadeRevisao: 'media',
      enfaseSimulados: 'alta',
    },
    {
      nome: 'Operativo',
      slug: 'operativo',
      descricao: 'Interleaving e alternância estratégica de disciplinas. Ideal para quem aprende melhor alternando.',
      pesoConteudoNovo: 30,
      pesoRevisaoFlashcards: 30,
      pesoQuestoes: 25,
      pesoRevisaoErros: 15,
      duracaoMediaDias: 105,
      velocidadeRevisao: 'media',
      enfaseSimulados: 'media',
    },
    {
      nome: 'Sobrevivência',
      slug: 'sobrevivencia',
      descricao: 'Ritmo totalmente personalizado. Você define horas por dia, dias da semana e data da prova.',
      pesoConteudoNovo: 30,
      pesoRevisaoFlashcards: 30,
      pesoQuestoes: 25,
      pesoRevisaoErros: 15,
      duracaoMediaDias: 0,
      velocidadeRevisao: 'media',
      enfaseSimulados: 'media',
    },
  ]

  for (const metodo of metodos) {
    await prisma.metodoEstudo.upsert({
      where: { slug: metodo.slug },
      update: metodo,
      create: metodo,
    })
  }

  console.log('Métodos de estudo inseridos com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
