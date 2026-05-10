const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.topico.findFirst({
    where: { titulo: { contains: '7-1-1' } }
  });
  console.log(t ? "ENCONTRADO: " + JSON.stringify(t) : "NAO ENCONTRADO");
}

check().finally(() => prisma.$disconnect());
