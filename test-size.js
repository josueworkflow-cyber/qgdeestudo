const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const materias = await prisma.materia.findMany({
    include: { temas: { include: { topicos: true } } }
  });
  
  for (const m of materias) {
    let size = 0;
    m.temas.forEach(t => t.topicos.forEach(top => size += top.conteudo.length));
    console.log(m.nome, ':', size, 'caracteres');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(console.error);
