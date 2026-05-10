const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanCGCFN11() {
  const m = await prisma.materia.findFirst({
    where: { slug: 'cgcfn-1-1-forca-desembarque' },
    include: { temas: { include: { topicos: true } } }
  });

  if (!m) { console.log('Matéria não encontrada'); await prisma.$disconnect(); return; }

  const emptyTemas = m.temas.filter(t => t.topicos.length === 0);
  const filledTemas = m.temas.filter(t => t.topicos.length > 0);

  console.log(`CGCFN-1-1: ${m.temas.length} temas totais`);
  console.log(`  Com conteúdo: ${filledTemas.length}`);
  console.log(`  Órfãos:       ${emptyTemas.length}\n`);

  console.log('Temas com conteúdo:');
  for (const t of filledTemas) {
    console.log(`  ✅ "${t.titulo}" (${t.topicos.length} tópicos)`);
  }

  console.log('\nTemas órfãos a remover:');
  for (const t of emptyTemas.slice(0, 10)) {
    console.log(`  🗑️  "${t.titulo}"`);
  }
  if (emptyTemas.length > 10) console.log(`  ... e mais ${emptyTemas.length - 10}`);

  // Remove
  if (process.argv.includes('--apply')) {
    for (const t of emptyTemas) {
      await prisma.tema.delete({ where: { id: t.id } });
    }
    console.log(`\n✅ ${emptyTemas.length} temas órfãos removidos!`);
  } else {
    console.log(`\nPara remover: npx tsx scratch/clean_cgcfn11.js --apply`);
  }

  // Now verify content of remaining topics
  console.log('\n--- CONTEÚDO DOS TÓPICOS RESTANTES ---');
  for (const t of filledTemas) {
    console.log(`\nTEMA: ${t.titulo}`);
    for (const tp of t.topicos) {
      console.log(`  [${tp.ordem}] ${tp.titulo}`);
      console.log(`    ${((tp.conteudo||'').trim()).substring(0, 200)}`);
    }
  }

  await prisma.$disconnect();
}

cleanCGCFN11().catch(console.error);
