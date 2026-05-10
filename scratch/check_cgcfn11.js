const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMateria() {
  const m = await prisma.materia.findFirst({
    where: { slug: 'cgcfn-1-1-forca-desembarque' },
    include: {
      temas: {
        include: {
          topicos: {
            orderBy: { ordem: 'asc' },
            select: { id: true, titulo: true, conteudo: true, ordem: true }
          }
        },
        orderBy: { titulo: 'asc' }
      }
    }
  });

  if (!m) { console.log('Matéria não encontrada'); await prisma.$disconnect(); return; }

  const totalTopicos = m.temas.reduce((s, t) => s + t.topicos.length, 0);
  console.log(`MATÉRIA: ${m.nome}`);
  console.log(`${m.temas.length} temas, ${totalTopicos} tópicos`);
  console.log('');

  for (const tema of m.temas) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`TEMA: ${tema.titulo} (${tema.topicos.length} tópicos)`);
    console.log(`${'─'.repeat(60)}`);
    for (const tp of tema.topicos) {
      const c = (tp.conteudo || '').trim();
      const status = c.length === 0 ? '🔴 VAZIO' : 
                     c.length < 40 ? `🟡 "${c.substring(0, 40)}"` : 
                     `✅ ${c.length} chars`;
      console.log(`  [ordem ${tp.ordem}] ${tp.titulo}`);
      console.log(`    ${status}`);
    }
  }
  await prisma.$disconnect();
}
checkMateria().catch(console.error);
