const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findGaps() {
  const topicos = await prisma.topico.findMany({
    orderBy: { ordem: 'asc' },
    select: { titulo: true, temaId: true }
  });

  const regex = /Art\.?\s*(\d+)[\.\-](\d+)[\.\-](\d+)/i;
  const articlesByChapter = {};

  topicos.forEach(t => {
    const match = regex.exec(t.titulo);
    if (match) {
      const ch = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const art = parseInt(match[3]);
      
      const key = `${ch}-${sec}`;
      if (!articlesByChapter[key]) articlesByChapter[key] = [];
      articlesByChapter[key].push(art);
    }
  });

  console.log("--- ANALISE DE LACUNAS (GAPS) ---");
  Object.keys(articlesByChapter).forEach(key => {
    const sequence = articlesByChapter[key].sort((a, b) => a - b);
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i+1] !== sequence[i] + 1) {
        console.log(`Lacuna detectada em Art. ${key}-X:`);
        console.log(`  Entre ${sequence[i]} e ${sequence[i+1]}`);
        for (let gap = sequence[i] + 1; gap < sequence[i+1]; gap++) {
          console.log(`  FALTANDO: Art. ${key.replace('-', '.')}.${gap} ou ${key}-${gap}`);
        }
      }
    }
  });
  console.log("----------------------------------");
}

findGaps()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
