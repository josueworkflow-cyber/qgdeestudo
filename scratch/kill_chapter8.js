const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const m = await prisma.materia.findFirst({ where: { slug: 'cgcfn-1-1-forca-desembarque' } });
  const temas = await prisma.tema.findMany({ where: { materiaId: m.id }, include: { topicos: true } });
  
  for (const t of temas) {
    if (t.titulo.includes('Visibilidade')) {
      for (const tp of t.topicos) await prisma.topico.delete({ where: { id: tp.id } });
      await prisma.tema.delete({ where: { id: t.id } });
      console.log('Capítulo 8 removido');
    }
  }
  
  const final = await prisma.tema.findMany({ where: { materiaId: m.id }, include: { topicos: true } });
  console.log(`CGCFN-1-1 final: ${final.length} temas, ${final.reduce((s,t)=>s+t.topicos.length,0)} tópicos`);
  for (const t of final) {
    console.log(`  TEMA: ${t.titulo}`);
    for (const tp of t.topicos) console.log(`    [${tp.ordem}] ${tp.titulo}`);
  }
  await prisma.$disconnect();
})();
