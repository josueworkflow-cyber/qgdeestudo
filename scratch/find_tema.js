const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTema() {
  const t = await prisma.tema.findUnique({
    where: { id: 'cmorxjaga007jj8fo33gspfxh' },
    include: { materia: true }
  });
  console.log(JSON.stringify(t));
}

findTema().finally(() => prisma.$disconnect());
