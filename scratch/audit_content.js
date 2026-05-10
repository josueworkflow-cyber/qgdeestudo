const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function audit() {
  const content = fs.readFileSync('c:/Users/josue/OneDrive/Área de Trabalho/CB-MO Projeto/conteudo/Apostila_SG.txt', 'utf8');
  
  // Regex to find all Art. X-Y-Z patterns in the TXT
  // We allow leading spaces and different separators
  const artRegex = /^\s*(Art\.\s*(\d+)[\.\-](\d+)[\.\-](\d+))\s*(.*)$/gm;
  
  const foundInTxt = [];
  let match;
  while ((match = artRegex.exec(content)) !== null) {
    foundInTxt.push({
      fullTag: match[1].trim(),
      ch: match[2],
      sec: match[3],
      art: match[4],
      title: match[5].trim(),
      line: content.substring(0, match.index).split('\n').length
    });
  }

  console.log(`Encontrados ${foundInTxt.length} artigos no TXT.`);

  // Get all topics from DB
  const dbTopics = await prisma.topico.findMany({
    select: { titulo: true }
  });
  const dbTitles = dbTopics.map(t => t.titulo.toLowerCase());

  const missing = [];
  foundInTxt.forEach(item => {
    // Check if the article tag (e.g. Art. 7-2-5) exists in any DB title
    const exists = dbTitles.some(title => title.includes(item.fullTag.toLowerCase().replace(/\s+/g, ' ')));
    if (!exists) {
      missing.push(item);
    }
  });

  console.log(`--- RELATÓRIO DE ARTIGOS FALTANTES (${missing.length}) ---`);
  missing.forEach(m => {
    console.log(`Linha ${m.line}: ${m.fullTag} ${m.title}`);
  });
  console.log("-------------------------------------------------------");
}

audit().finally(() => prisma.$disconnect());
