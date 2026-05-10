const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function deepAudit() {
  console.log("Iniciando Varredura Profunda (Caractere por Caractere)...");

  // 1. Carregar todo o conteúdo do Banco de Dados
  const dbTopicos = await prisma.topico.findMany({
    select: { titulo: true, conteudo: true }
  });
  
  // Criar uma "massa" de texto normalizada do banco
  const dbMassa = dbTopicos.map(t => (t.titulo + " " + t.conteudo).toLowerCase().replace(/\s+/g, ' ')).join(' ');

  // 2. Carregar o TXT original
  const txtContent = fs.readFileSync('c:/Users/josue/OneDrive/Área de Trabalho/CB-MO Projeto/conteudo/Apostila_SG.txt', 'utf8');
  
  // Quebrar o TXT em parágrafos significativos (mais de 40 caracteres para evitar lixo)
  const txtParagrafos = txtContent.split(/\n\s*\n/)
    .map(p => p.trim().replace(/\s+/g, ' '))
    .filter(p => p.length > 40 && !p.includes('.......')); // Filtra linhas curtas e sumário

  console.log(`Analisando ${txtParagrafos.length} blocos de texto do original...`);

  const missingBlocks = [];
  
  for (let i = 0; i < txtParagrafos.length; i++) {
    const p = txtParagrafos[i];
    const pLower = p.toLowerCase();
    
    // Verificação de existência (usando um pedaço do parágrafo para ser mais resiliente a pequenas quebras de linha)
    // Pegamos os primeiros 60 caracteres do parágrafo
    const snippet = pLower.substring(0, 60);
    
    if (!dbMassa.includes(snippet)) {
      missingBlocks.push({
        text: p,
        line: i // Aproximado
      });
    }
  }

  console.log(`\n--- RESULTADO DA VARREDURA PROFUNDA ---`);
  console.log(`Blocos analisados: ${txtParagrafos.length}`);
  console.log(`Blocos FALTANTES: ${missingBlocks.length}`);
  
  if (missingBlocks.length > 0) {
    console.log(`\nEXEMPLOS DE CONTEÚDO QUE NÃO ESTÁ NO SITE:`);
    // Mostrar os primeiros 20 blocos faltantes para análise
    missingBlocks.slice(0, 20).forEach((m, idx) => {
      console.log(`\n[Bloco ${idx + 1}]`);
      console.log(m.text.substring(0, 300) + (m.text.length > 300 ? "..." : ""));
    });
  } else {
    console.log(`\n🎉 NENHUM parágrafo do TXT ficou de fora!`);
  }
}

deepAudit().finally(() => prisma.$disconnect());
