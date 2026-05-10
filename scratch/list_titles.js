const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listTitles() {
  const topicos = await prisma.topico.findMany({
    orderBy: { tema: { ordem: 'asc' } },
    select: { titulo: true, tema: { select: { titulo: true } } }
  });

  topicos.forEach(t => {
    console.log(`[${t.tema.titulo}] - ${t.titulo}`);
  });
}

listTitles().finally(() => prisma.$disconnect());
