const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLastStub() {
  // Find the remaining stub in CGCFN-20
  const materia = await prisma.materia.findFirst({ where: { slug: 'cgfn-20-inteligencia' } });
  if (!materia) { console.log('Materia CGCFN-20 nao encontrada'); return; }

  const temas = await prisma.tema.findMany({ where: { materiaId: materia.id } });
  
  for (const tema of temas) {
    if (!tema.titulo.includes('Organiza')) continue;
    
    const tops = await prisma.topico.findMany({
      where: { temaId: tema.id },
      orderBy: { ordem: 'asc' },
    });

    console.log('TEMA:', tema.titulo, '(ID:', tema.id, ')');
    
    for (let i = 0; i < tops.length; i++) {
      const t = tops[i];
      const prev = i > 0 ? tops[i-1] : null;
      const c = (t.conteudo || '').trim();
      
      console.log(`  [${t.ordem}] "${t.titulo.substring(0, 70)}" | content: "${c.substring(0, 50)}" | id: ${t.id}`);

      if (c.length < 20 && c.length > 0 && prev) {
        // This is a stub - merge into previous
        console.log(`    -> MERGING into [${prev.ordem}] "${prev.titulo.substring(0, 50)}"`);
        
        const prevFull = (prev.conteudo || '').trim();
        const newContent = prevFull + '\n\n' + c;
        
        await prisma.topico.update({
          where: { id: prev.id },
          data: { conteudo: newContent },
        });
        
        await prisma.topico.delete({ where: { id: t.id } });
        console.log(`    -> FIXED: merged and deleted ${t.id}`);
      }
    }
  }
  
  await prisma.$disconnect();
}

fixLastStub().catch(console.error);
