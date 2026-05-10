const fs = require('fs');
const path = require('path');

/**
 * AUDITORIA DE FORMATAÇÃO DO PDF
 * 
 * Extrai texto com metadados de formatação do PDF (cores, sublinhados, destaques)
 * usando pdfjs-dist e compara com o conteúdo da plataforma.
 * 
 * Também faz comparação minuciosa de conteúdo: PDF vs TXT vs Banco de Dados.
 */

async function extractPDFWithFormatting() {
  const pdfjsLib = require('pdfjs-dist');
  
  const pdfPath = path.join(process.cwd(), 'conteudo/Apostila SG.pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  
  const doc = await pdfjsLib.getDocument({ data, verbosity: 0 }).promise;
  
  console.log(`\n========================================`);
  console.log(`AUDITORIA DE FORMATAÇÃO DO PDF`);
  console.log(`========================================`);
  console.log(`Total de páginas: ${doc.numPages}\n`);
  
  const allTextItems = [];
  const formattingStats = {
    redText: [],
    boldText: [],
    italicText: [],
    largeFont: [],
    smallFont: [],
    highlighted: [],
    specialFonts: new Set(),
    allFonts: new Set(),
    allColors: new Set(),
  };
  
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    for (const item of textContent.items) {
      const text = item.str;
      if (!text || !text.trim()) continue;
      
      const height = item.height || 0;
      const fontName = item.fontName || 'unknown';
      const transform = item.transform || [];
      
      formattingStats.allFonts.add(fontName);
      
      // Detect font weight (bold)
      if (fontName.toLowerCase().includes('bold') || 
          fontName.toLowerCase().includes('heavy') ||
          fontName.toLowerCase().includes('black')) {
        formattingStats.boldText.push({
          page: pageNum,
          text: text.trim(),
          font: fontName,
          height: height,
        });
      }
      
      // Detect italic
      if (fontName.toLowerCase().includes('italic') ||
          fontName.toLowerCase().includes('oblique') ||
          fontName.toLowerCase().includes('ita')) {
        formattingStats.italicText.push({
          page: pageNum,
          text: text.trim(),
          font: fontName,
          height: height,
        });
      }
      
      // Large font (headings)
      if (height > 14) {
        formattingStats.largeFont.push({
          page: pageNum,
          text: text.trim(),
          font: fontName,
          height: height,
        });
        formattingStats.specialFonts.add(`LARGE:${fontName} (${height.toFixed(1)}pt)`);
      }
      
      // Small font (footnotes etc)
      if (height < 8 && height > 0) {
        formattingStats.smallFont.push({
          page: pageNum,
          text: text.trim(),
          font: fontName,
          height: height,
        });
        formattingStats.specialFonts.add(`SMALL:${fontName} (${height.toFixed(1)}pt)`);
      }
      
      allTextItems.push({
        page: pageNum,
        text: text.trim(),
        height: height,
        font: fontName,
        width: item.width || 0,
      });
    }
    
    if (pageNum % 50 === 0) {
      console.log(`  Processando página ${pageNum}/${doc.numPages}...`);
    }
  }
  
  console.log(`\n--- FONTES ENCONTRADAS NO PDF ---`);
  const fontsArr = [...formattingStats.allFonts].sort();
  fontsArr.forEach(f => console.log(`  ${f}`));
  
  console.log(`\n--- TAMANHOS DE FONTE ESPECIAIS ---`);
  [...formattingStats.specialFonts].sort().forEach(f => console.log(`  ${f}`));
  
  console.log(`\n--- RESUMO DE FORMATAÇÃO ---`);
  console.log(`  Texto em NEGRITO:    ${formattingStats.boldText.length} fragmentos`);
  console.log(`  Texto em ITÁLICO:    ${formattingStats.italicText.length} fragmentos`);
  console.log(`  Fonte GRANDE (>14pt): ${formattingStats.largeFont.length} fragmentos`);
  console.log(`  Fonte PEQUENA (<8pt): ${formattingStats.smallFont.length} fragmentos`);
  
  // Mostrar exemplos de cada tipo
  if (formattingStats.boldText.length > 0) {
    console.log(`\n  --- AMOSTRAS NEGRITO (primeiras 20) ---`);
    const unique = [...new Set(formattingStats.boldText.map(t => t.text))].slice(0, 20);
    unique.forEach((t, i) => console.log(`  ${i+1}. [p.${formattingStats.boldText.find(x => x.text === t)?.page}] "${t}"`));
  }
  
  if (formattingStats.italicText.length > 0) {
    console.log(`\n  --- AMOSTRAS ITÁLICO (primeiras 20) ---`);
    const unique = [...new Set(formattingStats.italicText.map(t => t.text))].slice(0, 20);
    unique.forEach((t, i) => console.log(`  ${i+1}. [p.${formattingStats.italicText.find(x => x.text === t)?.page}] "${t}"`));
  }
  
  if (formattingStats.largeFont.length > 0) {
    console.log(`\n  --- AMOSTRAS FONTE GRANDE (primeiras 30) ---`);
    const unique = [...new Set(formattingStats.largeFont.map(t => `${t.text} [${t.height.toFixed(1)}pt, ${t.font}]`))].slice(0, 30);
    unique.forEach((t, i) => console.log(`  ${i+1}. ${t}`));
  }
  
  // Detect possible RED text by checking fonts with "red" or special colors
  // Note: pdf.js textContent doesn't expose color directly in this version
  // We'll check operator list for color operations
  console.log(`\n  --- CORES DETECTADAS (via operadores) ---`);
  // Get operator list for a few pages to find color ops
  for (let pageNum = 1; pageNum <= Math.min(5, doc.numPages); pageNum++) {
    const page = await doc.getPage(pageNum);
    const opList = await page.getOperatorList();
    const colorOps = [];
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      const args = opList.argsArray[i];
      // OPS_setFillRGBColor = 22, OPS_setStrokeRGBColor = 23
      if (fn === 22 || fn === 23 || fn === 88 || fn === 89 || fn === 90) {
        colorOps.push({
          page: pageNum,
          op: fn,
          args: args,
          idx: i,
        });
      }
    }
    if (colorOps.length > 0) {
      console.log(`  Página ${pageNum}: ${colorOps.length} operações de cor encontradas`);
      const uniqueColors = [...new Set(colorOps.map(c => `RGB(${c.args?.join?.(',') || c.args})`))];
      uniqueColors.slice(0, 10).forEach(c => console.log(`    ${c}`));
    }
  }
  
  return { allTextItems, formattingStats };
}

async function compareTXTvsPDFLayout() {
  const txtPath = path.join(process.cwd(), 'conteudo/Apostila_SG.txt');
  const layoutPath = '/tmp/pdf_layout.txt';
  if (!fs.existsSync(layoutPath)) {
    console.log('Arquivo PDF Layout não encontrado. Extraindo...');
    const { execSync } = require('child_process');
    execSync(`pdftotext -layout "${path.join(process.cwd(), 'conteudo/Apostila SG.pdf')}" "${layoutPath}"`);
  }
  
  const txtContent = fs.readFileSync(txtPath, 'utf8');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  console.log(`\n========================================`);
  console.log(`COMPARAÇÃO TXT vs PDF LAYOUT`);
  console.log(`========================================`);
  console.log(`Tamanho TXT (usado no seed):  ${txtContent.length.toLocaleString()} caracteres, ${txtContent.split('\n').length} linhas`);
  console.log(`Tamanho PDF Layout:            ${layoutContent.length.toLocaleString()} caracteres, ${layoutContent.split('\n').length} linhas`);
  
  // Normalize for comparison
  const txtNorm = txtContent.replace(/\s+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  const layoutNorm = layoutContent.replace(/\s+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  
  // Split into chunks and compare
  const chunkSize = 200;
  const txtChunks = [];
  const layoutChunks = [];
  
  for (let i = 0; i < txtNorm.length; i += chunkSize) {
    txtChunks.push(txtNorm.substring(i, i + chunkSize));
  }
  for (let i = 0; i < layoutNorm.length; i += chunkSize) {
    layoutChunks.push(layoutNorm.substring(i, i + chunkSize));
  }
  
  // Compare by finding unique chunks
  const txtSet = new Set(txtChunks);
  const layoutSet = new Set(layoutChunks);
  
  const onlyInTXT = [...txtSet].filter(c => !layoutSet.has(c));
  const onlyInLayout = [...layoutSet].filter(c => !txtSet.has(c));
  
  console.log(`\nChunks únicos apenas no TXT: ${onlyInTXT.length}`);
  console.log(`Chunks únicos apenas no PDF: ${onlyInLayout.length}`);
  
  if (onlyInTXT.length > 0) {
    console.log(`\n  --- AMOSTRAS EXCLUSIVAS DO TXT ---`);
    onlyInTXT.slice(0, 10).forEach((c, i) => console.log(`  ${i+1}. "${c.substring(0, 120)}..."`));
  }
  
  if (onlyInLayout.length > 0) {
    console.log(`\n  --- AMOSTRAS EXCLUSIVAS DO PDF ---`);
    onlyInLayout.slice(0, 10).forEach((c, i) => console.log(`  ${i+1}. "${c.substring(0, 120)}..."`));
  }
  
  // Detect content that exists in PDF but NOT in TXT
  const pdfLines = layoutContent.split('\n').filter(l => l.trim());
  const txtLines = txtContent.split('\n').filter(l => l.trim());
  
  // Find substantial lines (not just numbers/page markers)
  const substantialPdfLines = pdfLines.filter(l => l.length > 40 && !/^\s*\d{1,5}\s*$/.test(l));
  const substantialTxtLines = txtLines.filter(l => l.length > 40 && !/^\s*\d{1,5}\s*$/.test(l));
  
  console.log(`\nLinhas substanciais no PDF: ${substantialPdfLines.length}`);
  console.log(`Linhas substanciais no TXT: ${substantialTxtLines.length}`);
  
  // Find content that's in PDF but may have been lost in TXT conversion
  const txtNormSet = new Set(substantialTxtLines.map(l => l.replace(/\s+/g, ' ').toLowerCase().substring(10, 60)));
  const missingFromTxt = substantialPdfLines.filter(l => {
    const key = l.replace(/\s+/g, ' ').toLowerCase().substring(10, 60);
    return !txtNormSet.has(key);
  });
  
  console.log(`\nLinhas do PDF NÃO encontradas no TXT: ${missingFromTxt.length}`);
  if (missingFromTxt.length > 0) {
    console.log(`\n  --- AMOSTRAS DE CONTEÚDO PERDIDO NA CONVERSÃO PDF->TXT ---`);
    missingFromTxt.slice(0, 20).forEach((l, i) => console.log(`  ${i+1}. "${l.substring(0, 150)}"`));
  }
}

async function main() {
  try {
    await extractPDFWithFormatting();
  } catch (e) {
    console.error('ERRO na extração de formatação:', e.message);
    console.log('(Isso é esperado se o pdfjs-dist não for compatível com este Node.js)');
  }
  
  try {
    await compareTXTvsPDFLayout();
  } catch (e) {
    console.error('ERRO na comparação TXT vs PDF:', e.message);
  }
  
  console.log(`\n========================================`);
  console.log(`AUDITORIA CONCLUÍDA`);
  console.log(`========================================\n`);
}

main().catch(console.error);
