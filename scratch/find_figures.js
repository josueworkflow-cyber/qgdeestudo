const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const fs = require('fs');
const path = require('path');

async function main() {
  const topics = await prisma.topico.findMany({
    select: { conteudo: true }
  });

  const figRegex = /(?:Fig\.?\s*|Figura\s+)(\d+)[.-](\d+)/gi;
  const dbFigures = new Set();
  
  for (const topic of topics) {
    let match;
    figRegex.lastIndex = 0;
    while ((match = figRegex.exec(topic.conteudo)) !== null) {
      dbFigures.add(`${match[1]}-${match[2]}`);
    }
  }

  const files = fs.readdirSync(path.join(process.cwd(), 'public/conteudo'));
  const fileFigures = new Set();
  files.forEach(f => {
    const m = f.match(/^Fig_(\d+-\d+)/);
    if (m) fileFigures.add(m[1]);
  });

  console.log('--- Comparação de Figuras ---');
  console.log('Total no Banco de Dados (únicas):', dbFigures.size);
  console.log('Total de bases de arquivos (únicas):', fileFigures.size);

  const missingFiles = Array.from(dbFigures).filter(x => !fileFigures.has(x));
  const unusedFiles = Array.from(fileFigures).filter(x => !dbFigures.has(x));

  if (missingFiles.length > 0) {
    console.log('\nFiguras citadas no texto mas SEM arquivo correspondente:', missingFiles.sort());
  } else {
    console.log('\nTodas as figuras citadas têm um arquivo correspondente! ✅');
  }

  if (unusedFiles.length > 0) {
    console.log('\nArquivos na pasta mas NÃO citados no texto:', unusedFiles.sort());
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
