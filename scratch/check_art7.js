const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const materia = await prisma.materia.findFirst({ where: { slug: 'legislacao' } });
  const temas = await prisma.tema.findMany({ where: { materiaId: materia.id } });
  for (const t of temas) {
    if (!t.titulo.includes('Defini') && !t.titulo.includes('Especifica')) continue;
    const tops = await prisma.topico.findMany({ where: { temaId: t.id }, orderBy: { ordem: 'asc' }, select: { id:true, ordem:true, titulo:true, conteudo:true } });
    console.log('\nTEMA:', t.titulo, '(ID:', t.id, ')');
    for (const tp of tops) {
      console.log(`  [${tp.ordem}] ${tp.id}`);
      console.log(`  TÍTULO: ${tp.titulo}`);
      console.log(`  CONTEÚDO: ${(tp.conteudo||'(VAZIO)').substring(0, 120)}`);
      console.log('');
    }
  }
  await prisma.$disconnect();
})();
