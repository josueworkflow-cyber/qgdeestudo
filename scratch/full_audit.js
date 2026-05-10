const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function fullAudit() {
  const content = fs.readFileSync('c:/Users/josue/OneDrive/Área de Trabalho/CB-MO Projeto/conteudo/Apostila_SG.txt', 'utf8');
  
  // ==========================================
  // 1. Extract ALL Art. references from TXT
  // ==========================================
  
  // Pattern 1: Art. X-Y-Z (e.g., Art. 7-2-5)
  const artXYZ = /^\s*Art\.\s*(\d+[\.\-]\d+[\.\-]\d+)\s+(.*)$/gm;
  
  // Pattern 2: Art. X (e.g., Art. 14, Art. 6 º)
  const artX = /^\s*Art\.\s*(\d+)\s*[ºª°]?\s*[\.\-–—]?\s*(.*)$/gm;
  
  // Pattern 3: Art. X.Y.Z with dots (e.g., Art. 1.1.3)
  const artDots = /^\s*Art\.\s*(\d+\.\d+\.\d+)\s+(.*)$/gm;

  const txtArticles = new Map(); // tag -> { title, line }
  
  let match;
  
  // Scan pattern 1
  while ((match = artXYZ.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const tag = `Art. ${match[1]}`.replace(/\s+/g, ' ').trim();
    const title = match[2].trim();
    // Skip table of contents lines (they contain dots like ........)
    if (title.includes('...')) continue;
    txtArticles.set(tag, { title, line: lineNum });
  }
  
  // Scan pattern 2
  while ((match = artX.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const num = match[1];
    const tag = `Art. ${num}`;
    const title = match[2].trim();
    if (title.includes('...')) continue;
    // Don't overwrite more specific tags
    if (!txtArticles.has(tag)) {
      txtArticles.set(tag, { title, line: lineNum });
    }
  }
  
  // Scan pattern 3
  while ((match = artDots.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    const tag = `Art. ${match[1]}`.replace(/\s+/g, ' ').trim();
    const title = match[2].trim();
    if (title.includes('...')) continue;
    if (!txtArticles.has(tag)) {
      txtArticles.set(tag, { title, line: lineNum });
    }
  }

  console.log(`\n========================================`);
  console.log(`VARREDURA COMPLETA - TXT vs BANCO DE DADOS`);
  console.log(`========================================`);
  console.log(`Total de artigos encontrados no TXT: ${txtArticles.size}\n`);

  // ==========================================
  // 2. Get ALL topics from DB
  // ==========================================
  const dbTopics = await prisma.topico.findMany({
    select: { titulo: true, conteudo: true }
  });
  
  console.log(`Total de tópicos no Banco de Dados: ${dbTopics.length}\n`);

  // Normalize DB titles for comparison
  const dbTitleNormalized = dbTopics.map(t => {
    return t.titulo
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[ºª°]/g, '')
      .replace(/[–—]/g, '-')
      .trim();
  });

  // Also check content body for references
  const dbContentAll = dbTopics.map(t => t.conteudo.toLowerCase()).join(' ');

  // ==========================================
  // 3. Cross-reference
  // ==========================================
  const missing = [];
  const found = [];
  
  for (const [tag, info] of txtArticles) {
    const normalizedTag = tag
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[ºª°]/g, '')
      .replace(/\./g, '.')
      .trim();
    
    // Try several match strategies
    const tagNum = normalizedTag.replace('art. ', '').trim();
    
    const existsInTitle = dbTitleNormalized.some(dbTitle => {
      // Direct match
      if (dbTitle.includes(normalizedTag)) return true;
      // Number match with different separators
      const tagVariants = [
        tagNum,
        tagNum.replace(/\./g, '-'),
        tagNum.replace(/-/g, '.'),
        tagNum.replace(/-/g, ' '),
      ];
      return tagVariants.some(v => dbTitle.includes(`art. ${v}`) || dbTitle.includes(v));
    });
    
    if (existsInTitle) {
      found.push({ tag, title: info.title });
    } else {
      missing.push({ tag, title: info.title, line: info.line });
    }
  }

  console.log(`✅ Artigos ENCONTRADOS no banco: ${found.length}`);
  console.log(`❌ Artigos FALTANTES no banco:   ${missing.length}\n`);

  if (missing.length > 0) {
    console.log(`--- LISTA DE ARTIGOS FALTANTES ---`);
    missing.forEach((m, i) => {
      console.log(`  ${i+1}. [Linha ${m.line}] ${m.tag} ${m.title}`);
    });
    console.log(`----------------------------------\n`);
  } else {
    console.log(`🎉 NENHUM ARTIGO FALTANTE! A plataforma está 100% completa!\n`);
  }

  // ==========================================
  // 4. Check for empty/stub content
  // ==========================================
  const emptyTopics = dbTopics.filter(t => 
    !t.conteudo || 
    t.conteudo.trim().length < 10 || 
    t.conteudo.includes('Novo conteúdo aqui')
  );

  if (emptyTopics.length > 0) {
    console.log(`⚠️  TÓPICOS COM CONTEÚDO VAZIO OU PLACEHOLDER (${emptyTopics.length}):`);
    emptyTopics.forEach((t, i) => {
      console.log(`  ${i+1}. ${t.titulo} (${t.conteudo ? t.conteudo.substring(0, 40) + '...' : 'VAZIO'})`);
    });
    console.log('');
  }

  // ==========================================
  // 5. Summary
  // ==========================================
  const coveragePercent = ((found.length / txtArticles.size) * 100).toFixed(1);
  console.log(`========================================`);
  console.log(`RESUMO FINAL`);
  console.log(`========================================`);
  console.log(`Artigos no TXT:        ${txtArticles.size}`);
  console.log(`Artigos no DB:         ${found.length}`);
  console.log(`Artigos faltantes:     ${missing.length}`);
  console.log(`Tópicos vazios/stub:   ${emptyTopics.length}`);
  console.log(`Cobertura:             ${coveragePercent}%`);
  console.log(`========================================\n`);
}

fullAudit()
  .catch(e => console.error('ERRO:', e))
  .finally(() => prisma.$disconnect());
