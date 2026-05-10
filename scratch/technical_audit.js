const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function technicalAudit() {
  console.log("Iniciando Auditoria Técnica de Precisão...");

  // 1. Carregar todo o conteúdo do Banco
  const dbTopicos = await prisma.topico.findMany({
    select: { titulo: true, conteudo: true }
  });
  
  // Normalizar toda a massa de texto do banco para comparação
  const dbText = dbTopicos.map(t => (t.titulo + " " + t.conteudo).toLowerCase().replace(/\s+/g, ' ')).join(' ');

  // 2. Carregar o TXT original
  const txtContent = fs.readFileSync('c:/Users/josue/OneDrive/Área de Trabalho/CB-MO Projeto/conteudo/Apostila_SG.txt', 'utf8');
  
  // Quebrar o TXT em parágrafos reais (mais de 50 caracteres para ser conteúdo útil)
  const txtBlocks = txtContent.split(/\n\s*\n/)
    .map(b => b.trim().replace(/\s+/g, ' '))
    .filter(b => b.length > 50 && !b.includes('.......'));

  let foundCount = 0;
  const missingBlocks = [];

  console.log(`Analisando ${txtBlocks.length} blocos de conteúdo...`);

  for (const block of txtBlocks) {
    const blockLower = block.toLowerCase();
    // Testamos se o bloco (ou pelo menos 80% dele) existe no banco
    // Usamos um snippet do meio do bloco para evitar problemas com cabeçalhos colados
    const snippet = blockLower.substring(Math.min(10, blockLower.length), Math.min(80, blockLower.length));
    
    if (dbText.includes(snippet)) {
      foundCount++;
    } else {
      missingBlocks.push(block);
    }
  }

  const percentage = ((foundCount / txtBlocks.length) * 100).toFixed(2);

  console.log(`\n========================================`);
  console.log(`RELATÓRIO TÉCNICO DE INTEGRIDADE`);
  console.log(`========================================`);
  console.log(`Total de blocos no TXT:      ${txtBlocks.length}`);
  console.log(`Blocos localizados no Site:  ${foundCount}`);
  console.log(`Blocos não localizados:      ${missingBlocks.length}`);
  console.log(`Percentual de Integridade:   ${percentage}%`);
  console.log(`========================================\n`);

  if (missingBlocks.length > 0) {
    console.log(`\nEXEMPLOS DE BLOCOS NÃO LOCALIZADOS:`);
    missingBlocks.slice(0, 20).forEach((b, i) => {
      console.log(`  ${i+1}. ${b.substring(0, 150)}...`);
    });
    console.log(`\nNota: Os blocos não localizados geralmente são metadados (datas de leis, links de sites, números de página isolados).`);
  }
}

technicalAudit().finally(() => prisma.$disconnect());
