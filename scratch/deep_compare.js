const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function deepCompare() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`COMPARAÇÃO MINUCIOSA: PDF vs TXT vs BANCO DE DADOS`);
  console.log(`${'='.repeat(60)}\n`);

  // ==========================================
  // 1. CARREGAR FONTES
  // ==========================================
  const txtPath = path.join(process.cwd(), 'conteudo/Apostila_SG.txt');
  const layoutPath = '/tmp/pdf_layout.txt';
  const txtContent = fs.readFileSync(txtPath, 'utf8');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  console.log(`📄 PDF Layout (extraído por pdftotext): ${layoutContent.split('\n').length} linhas, ${layoutContent.length.toLocaleString()} chars`);
  console.log(`📝 TXT (usado no seed):                ${txtContent.split('\n').length} linhas, ${txtContent.length.toLocaleString()} chars`);

  // ==========================================
  // 2. DIFERENÇAS ESTRUTURAIS
  // ==========================================
  
  // Extrair todas as seções de "Capítulo", "Título", etc do PDF e TXT
  const chapterRegex = /(?:Cap[ií]tulo|CAP[IÍ]TULO|T[ií]tulo|T[IÍ]TULO|Se[cç][aã]o|SE[CÇ][AÃ]O)\s+([IVXLCDM\d]+)[\s–\-—]+(.+)/gi;
  
  const pdfChapters = new Map();
  let match;
  while ((match = chapterRegex.exec(layoutContent)) !== null) {
    const key = `${match[1]}-${match[2].trim().substring(0, 60)}`;
    pdfChapters.set(key, match[0].trim());
  }
  chapterRegex.lastIndex = 0;
  
  const txtChapters = new Map();
  while ((match = chapterRegex.exec(txtContent)) !== null) {
    const key = `${match[1]}-${match[2].trim().substring(0, 60)}`;
    txtChapters.set(key, match[0].trim());
  }
  
  console.log(`\n--- CAPÍTULOS/TÍTULOS/SEÇÕES ---`);
  console.log(`No PDF: ${pdfChapters.size}    No TXT: ${txtChapters.size}`);
  
  // Check chapters in PDF but not in TXT
  const pdfOnlyChapters = [...pdfChapters.entries()].filter(([k]) => !txtChapters.has(k));
  if (pdfOnlyChapters.length > 0) {
    console.log(`\n⚠️  Capítulos no PDF que NÃO estão no TXT: ${pdfOnlyChapters.length}`);
    pdfOnlyChapters.forEach(([_, title]) => console.log(`   - ${title}`));
  }
  
  const txtOnlyChapters = [...txtChapters.entries()].filter(([k]) => !pdfChapters.has(k));
  if (txtOnlyChapters.length > 0) {
    console.log(`\n⚠️  Capítulos no TXT que NÃO estão no PDF: ${txtOnlyChapters.length}`);
    txtOnlyChapters.forEach(([_, title]) => console.log(`   - ${title}`));
  }

  // ==========================================
  // 3. ARTIGOS: Comparação completa PDF vs TXT vs DB
  // ==========================================
  
  const artRegex = /Art\.\s*(\d+(?:[\.\-]\d+)*)\s*[ºª°]?\s*[\.\-–—]?\s*(.+)/gi;
  
  const pdfArticles = new Map();
  while ((match = artRegex.exec(layoutContent)) !== null) {
    const num = match[1].replace(/\./g, '-');
    const title = match[2].trim();
    if (!title.includes('.......') && !title.includes('...')) {
      pdfArticles.set(`Art. ${num}`, { title, source: 'PDF' });
    }
  }
  artRegex.lastIndex = 0;
  
  const txtArticles = new Map();
  while ((match = artRegex.exec(txtContent)) !== null) {
    const num = match[1].replace(/\./g, '-');
    const title = match[2].trim();
    if (!title.includes('.......') && !title.includes('...')) {
      txtArticles.set(`Art. ${num}`, { title, source: 'TXT' });
    }
  }
  
  console.log(`\n--- ARTIGOS ENCONTRADOS ---`);
  console.log(`No PDF: ${pdfArticles.size}    No TXT: ${txtArticles.size}`);
  
  const pdfOnlyArticles = [...pdfArticles.keys()].filter(k => !txtArticles.has(k));
  const txtOnlyArticles = [...txtArticles.keys()].filter(k => !pdfArticles.has(k));
  
  if (pdfOnlyArticles.length > 0) {
    console.log(`\n❌ Artigos no PDF que NÃO estão no TXT: ${pdfOnlyArticles.length}`);
    pdfOnlyArticles.slice(0, 15).forEach(k => console.log(`   - ${k} ${pdfArticles.get(k).title}`));
    if (pdfOnlyArticles.length > 15) console.log(`   ... e mais ${pdfOnlyArticles.length - 15} artigos`);
  }
  
  if (txtOnlyArticles.length > 0) {
    console.log(`\n⚠️  Artigos no TXT que NÃO estão no PDF: ${txtOnlyArticles.length}`);
    txtOnlyArticles.slice(0, 10).forEach(k => console.log(`   - ${k} ${txtArticles.get(k).title}`));
    if (txtOnlyArticles.length > 10) console.log(`   ... e mais ${txtOnlyArticles.length - 10} artigos`);
  }

  // ==========================================
  // 4. SEÇÕES CRÍTICAS: "Mudanças no edital", "Saiu", "Entrou"
  // ==========================================
  
  const mudancasMatch = layoutContent.match(/Mudanças no edital:[\s\S]{0,20000}?(?=Sumário:|Legislação|ATUALIZADA)/i);
  if (mudancasMatch) {
    console.log(`\n--- SEÇÃO "MUDANÇAS NO EDITAL" (PDF) ---`);
    console.log(`Tamanho: ${mudancasMatch[0].length} caracteres`);
    
    // Check if "Saiu" section exists
    const saiuMatch = mudancasMatch[0].match(/Saiu:([\s\S]*?)(?=Entrou|$)/i);
    const entrouMatch = mudancasMatch[0].match(/Entrou([\s\S]*?)$/i);
    
    if (saiuMatch) {
      const saiuContent = saiuMatch[1].trim();
      console.log(`\n🔴 SEÇÃO "SAIU" (conteúdo REMOVIDO do edital): ${saiuContent.length} chars`);
      // This content should NOT be in the platform
      
      // Check if any of this content made it into the DB
      const saiuLines = saiuContent.split('\n').filter(l => l.trim().length > 30).slice(0, 5);
      for (const line of saiuLines) {
        const normalized = line.trim().replace(/\s+/g, ' ').substring(5, 50);
        const dbMatch = await prisma.topico.findFirst({
          where: { conteudo: { contains: normalized } },
          select: { titulo: true }
        });
        if (dbMatch) {
          console.log(`  ⚠️  ENCONTRADO NO DB: "${line.trim().substring(0, 80)}" -> ${dbMatch.titulo}`);
        }
      }
    }
    
    if (entrouMatch) {
      const entrouContent = entrouMatch[1].trim();
      console.log(`\n🟢 SEÇÃO "ENTROU" (conteúdo ADICIONADO ao edital): ${entrouContent.length} chars`);
      
      // Extract chapter references from "Entrou"
      const entrouChapters = entrouContent.match(/(CGCFN|EMA|CGFN)[\s\-]\d[\d\-\s]+[:–].+/gi) || [];
      console.log(`  Manuais referenciados: ${entrouChapters.length}`);
      entrouChapters.forEach(c => console.log(`    ${c.trim().substring(0, 100)}`));
      
      // Check if this content exists in the DB
      const entrouLines = entrouContent.split('\n').filter(l => l.trim().length > 40);
      let encontrados = 0;
      let naoEncontrados = 0;
      const naoEncontradosSamples = [];
      
      for (const line of entrouLines.slice(0, 50)) {
        const cleanLine = line.trim().replace(/\s+/g, ' ').substring(10, 60);
        if (cleanLine.length < 20) continue;
        
        const dbMatch = await prisma.topico.findFirst({
          where: { conteudo: { contains: cleanLine } },
          select: { titulo: true }
        });
        
        if (dbMatch) {
          encontrados++;
        } else {
          naoEncontrados++;
          if (naoEncontradosSamples.length < 10) {
            naoEncontradosSamples.push(line.trim().substring(0, 100));
          }
        }
      }
      
      console.log(`\n  Do conteúdo "Entrou" no DB:`);
      console.log(`  ✅ Encontrados: ${encontrados}  ❌ Não encontrados: ${naoEncontrados}`);
      
      if (naoEncontradosSamples.length > 0) {
        console.log(`\n  Amostras NÃO encontradas:`);
        naoEncontradosSamples.forEach((s, i) => console.log(`    ${i+1}. "${s}"`));
      }
    }
  }

  // ==========================================
  // 5. TÓPICOS VAZIOS/STUB - DETALHES
  // ==========================================
  
  const emptyTopics = await prisma.topico.findMany({
    where: {
      OR: [
        { conteudo: { equals: '' } },
        { conteudo: { contains: 'Novo conteúdo aqui' } },
      ]
    },
    select: { id: true, titulo: true, conteudo: true, ordem: true, tema: { select: { titulo: true, materia: { select: { nome: true } } } } }
  });
  
  const shortTopics = await prisma.topico.findMany({
    where: {
      AND: [
        { conteudo: { not: { equals: '' } } },
        { conteudo: { not: { contains: 'Novo conteúdo aqui' } } },
      ]
    },
    select: { id: true, titulo: true, conteudo: true, ordem: true, tema: { select: { titulo: true, materia: { select: { nome: true } } } } }
  });
  
  // Filter short content manually (Prisma can't do length comparison on Text fields)
  const stubTopics = shortTopics.filter(t => {
    const c = t.conteudo || '';
    return c.length < 50 || c.endsWith('...') || c.endsWith('…');
  });
  
  console.log(`\n--- TÓPICOS COM PROBLEMAS ---`);
  console.log(`Completamente vazios: ${emptyTopics.length}`);
  console.log(`Conteúdo muito curto (<50 chars): ${stubTopics.length}\n`);
  
  if (emptyTopics.length > 0) {
    console.log(`🔴 TÓPICOS VAZIOS:`);
    for (const t of emptyTopics) {
      console.log(`  [${t.tema?.materia?.nome}] > ${t.tema?.titulo} > ${t.titulo} (ordem: ${t.ordem})`);
    }
  }
  
  if (stubTopics.length > 0) {
    console.log(`\n🟡 TÓPICOS COM CONTEÚDO MUITO CURTO:`);
    for (const t of stubTopics.slice(0, 20)) {
      console.log(`  [${t.tema?.materia?.nome}] > ${t.tema?.titulo} > ${t.titulo}`);
      console.log(`    Conteúdo: "${t.conteudo?.substring(0, 100)}"`);
    }
    if (stubTopics.length > 20) console.log(`  ... e mais ${stubTopics.length - 20} tópicos`);
  }

  // ==========================================
  // 6. RESUMO FINAL
  // ==========================================
  
  const totalTopics = await prisma.topico.count();
  const totalTemas = await prisma.tema.count();
  const totalMaterias = await prisma.materia.count();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESUMO FINAL DA PLATAFORMA`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Matérias:       ${totalMaterias}`);
  console.log(`Temas:          ${totalTemas}`);
  console.log(`Tópicos:        ${totalTopics}`);
  console.log(`Tópicos vazios: ${emptyTopics.length}`);
  console.log(`Tópicos curtos: ${stubTopics.length}`);
  console.log(`Artigos PDF:    ${pdfArticles.size}`);
  console.log(`Artigos TXT:    ${txtArticles.size}`);
  console.log(`Artigos só PDF: ${pdfOnlyArticles.length}`);
  console.log(`Artigos só TXT: ${txtOnlyArticles.length}`);
  console.log(`${'='.repeat(60)}\n`);
}

deepCompare()
  .catch(e => console.error('ERRO:', e))
  .finally(() => prisma.$disconnect());
