const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDupAndOrphan() {
  const m = await prisma.materia.findFirst({
    where: { slug: 'cgcfn-1-1-forca-desembarque' },
    include: { temas: { include: { topicos: { orderBy: { ordem: 'asc' } } } } }
  });

  if (!m) { console.log('Matéria não encontrada'); await prisma.$disconnect(); return; }

  console.log(`CGCFN-1-1: ${m.temas.length} temas\n`);

  for (const tema of m.temas) {
    console.log(`TEMA: "${tema.titulo}" (${tema.topicos.length} tópicos)`);

    // Check for "Introdução do Capítulo" duplicates
    const introTopic = tema.topicos.find(t => t.titulo.startsWith('Introdução do Capítulo'));
    const numberedTopics = tema.topicos.filter(t => /^\d/.test(t.titulo));

    if (introTopic && numberedTopics.length > 0) {
      const introContent = (introTopic.conteudo || '').trim();
      // Check overlap: does the intro contain the same content as first numbered topic?
      const firstNumbered = numberedTopics[0];
      const firstContent = (firstNumbered.conteudo || '').trim().substring(0, 100);

      if (introContent.substring(0, 100).includes(firstContent.substring(0, 50)) ||
          introContent.includes(firstContent.substring(0, 50))) {
        console.log(`  ⚠️  DUPLICAÇÃO: "Introdução do Capítulo" contém o mesmo conteúdo de "${firstNumbered.titulo}"`);
        
        if (process.argv.includes('--apply')) {
          await prisma.topico.delete({ where: { id: introTopic.id } });
          console.log(`  ✅ "Introdução do Capítulo" removido (duplicado)`);
        } else {
          console.log(`  Para remover: --apply`);
        }
      }
    }

    // If tema has only "Introdução" and its title matches CGCFN-31-10 (Combatente Anfíbio)
    if (tema.titulo.includes('Visibilidade Reduzida') && tema.topicos.length <= 1) {
      console.log(`  ⚠️  Tema órfão: Capítulo 8 pertence ao CGCFN-31-10 (Manual do Combatente Anfíbio), não ao CGCFN-1-1`);
      if (process.argv.includes('--apply')) {
        await prisma.tema.delete({ where: { id: tema.id } });
        console.log(`  ✅ Tema removido`);
      }
    }

    for (const tp of tema.topicos) {
      const c = (tp.conteudo || '').trim().substring(0, 80);
      console.log(`    [${tp.ordem}] ${tp.titulo} | ${c}...`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

fixDupAndOrphan().catch(console.error);
