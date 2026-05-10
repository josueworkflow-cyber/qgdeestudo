const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listLegislacao() {
  const materia = await prisma.materia.findUnique({
    where: { slug: 'legislacao' },
    include: {
      temas: {
        orderBy: { ordem: 'asc' },
        include: {
          topicos: {
            orderBy: { ordem: 'asc' }
          }
        }
      }
    }
  });

  if (!materia) {
    console.log("Materia 'legislacao' nao encontrada.");
    return;
  }

  materia.temas.forEach(tema => {
    console.log(`\n=== TEMA: ${tema.titulo} ===`);
    tema.topicos.forEach(t => {
      console.log(`  - ${t.titulo}`);
    });
  });
}

listLegislacao().finally(() => prisma.$disconnect());
