const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const MATERIAS_MAP = [
  { "codigo": "LEGISLACAO", "nome": "Legislação", "slug": "legislacao" },
  { "codigo": "CGCFN-0-1", "nome": "Manual Básico dos Grupamentos Operativos de Fuzileiros Navais", "slug": "cgcfn-0-1-grupamentos-operativos" },
  { "codigo": "CGCFN-1-1", "nome": "Manual de Operações da Força de Desembarque", "slug": "cgcfn-1-1-forca-desembarque" },
  { "codigo": "CGCFN-1-5", "nome": "Manual de Operações Terrestres de Fuzileiros Navais", "slug": "cgcfn-1-5-operacoes-terrestres" },
  { "codigo": "CGCFN-2-1", "nome": "Manual de Operações de Garantia da Lei e da Ordem de Fuzileiros Navais", "slug": "cgcfn-2-1-garantia-lei-ordem" },
  { "codigo": "CGCFN-2-2", "nome": "Manual de Operações de Paz", "slug": "cgcfn-2-2-operacoes-paz" },
  { "codigo": "CGCFN-31-10", "nome": "Manual do Combatente Anfíbio", "slug": "cgcfn-31-10-combatente-anfibio" },
  { "codigo": "CGCFN-31-3", "nome": "Manual do Pelotão de Infantaria de Fuzileiros Navais", "slug": "cgcfn-31-3-pelotao-infantaria" },
  { "codigo": "CGCFN-201", "nome": "Manual Básico do Fuzileiro Naval", "slug": "cgcfn-201-manual-basico-fn" },
  { "codigo": "CGCFN-301", "nome": "Manual de Topografia Militar", "slug": "cgcfn-301-topografia-militar" },
  { "codigo": "CGCFN-309", "nome": "Manual de Controle de Distúrbios", "slug": "cgcfn-309-controle-disturbios" },
  { "codigo": "CGCFN-401", "nome": "Manual de Operações Militares em Ambiente Urbano dos Fuzileiros Navais", "slug": "cgcfn-401-ambiente-urbano" },
  { "codigo": "EMA-137", "nome": "Doutrina de Liderança da Marinha", "slug": "ema-137-lideranca" },
  { "codigo": "CGFN-20", "nome": "Manual de Inteligência de Fuzileiros Navais", "slug": "cgfn-20-inteligencia" },
];

function slugify(texto) {
  return texto.toLowerCase()
    .replace(/[áàãâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
    .replace(/[óòõôö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/[ç]/g, 'c').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '').replace(/[\s]+/g, '-').replace(/-{2,}/g, '-')
    .substring(0, 80).replace(/^-|-$/g, '');
}

function normalizeText(text) {
  return text
    .replace(/[\u00A0]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\d+\s*$/gm, '')
    .trim();
}

async function main() {
  const txtPath = path.join(process.cwd(), 'conteudo/Apostila_SG.txt');
  const txtContent = fs.readFileSync(txtPath, 'utf8');

  // Split TXT by manual sections
  const manualIndices = [];
  for (const m of MATERIAS_MAP) {
    const regex = new RegExp(`^\\s*${m.nome.replace(/[áàãâäéèêëíìîïóòõôöúùûüç]/gi, '.')}\\s*$`, 'gim');
    const match = regex.exec(txtContent);
    if (match) {
      manualIndices.push({ ...m, index: match.index });
    }
  }
  manualIndices.sort((a, b) => a.index - b.index);

  const sections = [];
  for (let i = 0; i < manualIndices.length; i++) {
    const start = manualIndices[i].index;
    const end = i < manualIndices.length - 1 ? manualIndices[i + 1].index : txtContent.length;
    sections.push({ ...manualIndices[i], content: txtContent.slice(start, end) });
  }

  // Get all DB topics
  const allDbTopics = await prisma.topico.findMany({
    include: { tema: { include: { materia: true } } },
    orderBy: [{ temaId: 'asc' }, { ordem: 'asc' }],
  });

  const issues = [];
  let totalOk = 0;

  for (const section of sections) {
    const dbMateria = await prisma.materia.findFirst({ where: { slug: section.slug } });
    if (!dbMateria) {
      console.log(`⚠️  Matéria não encontrada no DB: ${section.nome}`);
      continue;
    }

    // Extract chapters from section
    const capRegex = /^\s*(Cap[ií]tulo|CAP[IÍ]TULO|T[ií]tulo|T[IÍ]TULO|Se[cç][aã]o|SE[CÇ][AÃ]O)\s+([IVXLCDM\d]+)\s*[–\-—]+\s*(.+)$/gim;
    const capMatches = [...section.content.matchAll(capRegex)];

    for (let c = 0; c < capMatches.length; c++) {
      const match = capMatches[c];
      const capNum = match[2];
      const capTitle = match[3].trim();
      const capTituloCompleto = `${match[1]} ${capNum} – ${capTitle}`;

      const capStart = match.index + match[0].length;
      const capEnd = c < capMatches.length - 1 ? capMatches[c + 1].index : section.content.length;
      let capContent = section.content.slice(capStart, capEnd).trim();

      // Find matching tema in DB
      const dbTema = await prisma.tema.findFirst({
        where: { materiaId: dbMateria.id, titulo: { contains: capTitle.substring(0, 30) } },
      });

      if (!dbTema) continue;

      // Get topics for this tema
      const dbTopicos = allDbTopics.filter(t => t.temaId === dbTema.id).sort((a, b) => a.ordem - b.ordem);

      // Extract articles from the chapter content in TXT
      const artRegex = /^\s*(Art\.\s*\d[\d\-\.]*(?:\s*[ºª°]\s*)?\s*[\.\-–—]?\s*(.+)?)$/gm;
      const txtArticles = [];
      let artMatch;
      const capLines = capContent.split('\n');
      let currentArt = null;
      let currentContentLines = [];

      for (const line of capLines) {
        const lineTrimmed = line.trim();
        if (!lineTrimmed) {
          if (currentArt) currentContentLines.push('');
          continue;
        }

        // Check if it's an article title
        const artMatch2 = /^\s*(Art\.\s*\d[\d\-\.]*(?:\s*[ºª°])?\s*[\.\-–—]?\s*(.+)?)\s*$/.exec(line);
        const isNumberedItem = /^\s*(\d+[\.\)]\s*)/.test(lineTrimmed);
        const isSubItem = /^\s*[a-g]\)\s*/.test(lineTrimmed);
        const isSection = /^\s*(Se[cç][aã]o|T[ií]tulo)\s+/.test(lineTrimmed);

        if (artMatch2 && !isNumberedItem && lineTrimmed.length > 10) {
          // Save previous article
          if (currentArt) {
            const fullContent = currentContentLines.join('\n').trim();
            if (fullContent) {
              currentArt.content = fullContent;
              txtArticles.push(currentArt);
            }
          }
          currentArt = { title: lineTrimmed, content: '', lineStart: '' };
          currentContentLines = [];
        } else if (currentArt) {
          currentContentLines.push(lineTrimmed);
        } else if (lineTrimmed.length > 30) {
          // Content without an article header yet - might be preamble
          currentArt = { title: '(preâmbulo)', content: lineTrimmed, lineStart: '' };
          txtArticles.push(currentArt);
          currentArt = null;
          currentContentLines = [];
        }
      }
      if (currentArt) {
        currentArt.content = currentContentLines.join('\n').trim();
        if (currentArt.content) txtArticles.push(currentArt);
      }

      // Now compare each TXT article with DB topics
      for (let ta = 0; ta < txtArticles.length; ta++) {
        const txtArt = txtArticles[ta];
        const txtContentNorm = normalizeText(txtArt.content);
        const txtTitleFirst30 = txtArt.title.substring(0, 30).toLowerCase().replace(/[\.\-\s]+/g, ' ').trim();

        // Find matching DB topic
        const dbMatch = dbTopicos.find(t => {
          const tTitle = t.titulo.toLowerCase().replace(/[\.\-\s]+/g, ' ').trim();
          return tTitle.substring(0, 30).includes(txtTitleFirst30) ||
                 txtTitleFirst30.includes(tTitle.substring(0, 30));
        });

        if (!dbMatch) {
          // Check if this article's content is spread across multiple DB topics
          const contentFrags = dbTopicos.filter(t => {
            const tCont = normalizeText(t.conteudo || '');
            if (tCont.length < 10) return false;
            return txtContentNorm.includes(tCont.substring(0, 30));
          });

          if (contentFrags.length > 1) {
            issues.push({
              tipo: 'ARTIGO_FRAGMENTADO',
              materia: section.nome,
              tema: capTituloCompleto,
              tituloTXT: txtArt.title,
              detalhe: `Conteúdo do artigo está espalhado em ${contentFrags.length} tópicos diferentes`,
              topicosDB: contentFrags.map(t => t.titulo),
            });
          }
          continue;
        }

        // Compare content lengths
        const dbContentNorm = normalizeText(dbMatch.conteudo || '');

        if (dbContentNorm.length < 15 && txtContentNorm.length > 15) {
          // DB topic is nearly empty, check if next DB topics contain the rest
          const dbIdx = dbTopicos.findIndex(t => t.id === dbMatch.id);
          const nextTopics = dbTopicos.slice(dbIdx + 1, dbIdx + 5);
          const fragments = [];

          for (const nt of nextTopics) {
            const ntCont = normalizeText(nt.conteudo || '');
            if (ntCont.length < 5) {
              fragments.push({ titulo: nt.titulo, conteudo: '', tipo: 'VAZIO' });
            } else if (txtContentNorm.includes(ntCont.substring(0, 50)) || 
                       txtContentNorm.includes(ntCont) ||
                       ntCont.length < 40) {
              fragments.push({ titulo: nt.titulo, conteudo: nt.conteudo, tipo: 'FRAGMENTO' });
            }
          }

          if (fragments.length > 0) {
            issues.push({
              tipo: 'CONTEUDO_SEPARADO',
              materia: section.nome,
              tema: capTituloCompleto,
              artigoTXT: txtArt.title,
              topicoPrincipal: dbMatch.titulo,
              conteudoDB: (dbMatch.conteudo || '').trim(),
              conteudoTXT: txtArt.content.substring(0, 200),
              fragmentos: fragments,
            });
          }
        } else if (dbContentNorm.length < 40 && txtContentNorm.length < 5) {
          // Good - both are short (maybe just a reference)
          totalOk++;
        } else {
          totalOk++;
        }
      }
    }
  }

  // Print results
  console.log(`\n${'='.repeat(70)}`);
  console.log(`COMPARAÇÃO TXT (FONTE) vs BANCO DE DADOS`);
  console.log(`${'='.repeat(70)}\n`);
  console.log(`✅ Artigos OK: ${totalOk}`);
  console.log(`⚠️  Problemas encontrados: ${issues.length}\n`);

  if (issues.length === 0) {
    console.log('Nenhum problema de fragmentação encontrado!');
    await prisma.$disconnect();
    return;
  }

  for (const iss of issues) {
    console.log(`${'─'.repeat(70)}`);
    console.log(`📁 ${iss.materia} > ${iss.tema}`);
    console.log(`🔴 ${iss.tipo}\n`);

    if (iss.tipo === 'CONTEUDO_SEPARADO') {
      console.log(`  Artigo no TXT: "${iss.artigoTXT}"`);
      console.log(`  Tópico no DB:  "${iss.topicoPrincipal}"`);
      console.log(`  Conteúdo atual no DB: "${iss.conteudoDB}"`);
      console.log(`  Deveria conter (TXT): "${iss.conteudoTXT}..."`);
      console.log(`\n  Fragmentos que precisam ser mesclados:`);
      for (const f of iss.fragmentos) {
        console.log(`    ${f.tipo === 'VAZIO' ? '🗑️ ' : '🔗 '}"${f.titulo}" → "${f.conteudo?.substring(0, 80) || ''}"`);
      }
    } else if (iss.tipo === 'ARTIGO_FRAGMENTADO') {
      console.log(`  Artigo: "${iss.tituloTXT}"`);
      console.log(`  ${iss.detalhe}`);
      console.log(`  Tópicos no DB:`);
      for (const t of iss.topicosDB) {
        console.log(`    - "${t}"`);
      }
    }
  }

  // Now show the exact merge operations needed
  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`OPERAÇÕES NECESSÁRIAS PARA CORRIGIR`);
  console.log(`${'='.repeat(70)}\n`);

  let mergeCount = 0;
  let deleteCount = 0;

  for (const iss of issues) {
    if (iss.tipo === 'CONTEUDO_SEPARADO') {
      for (const f of iss.fragmentos) {
        if (f.tipo === 'VAZIO') {
          deleteCount++;
        } else {
          mergeCount++;
        }
      }
    }
  }

  console.log(`Total de mesclagens: ${mergeCount}`);
  console.log(`Total de deleções:   ${deleteCount}`);

  await prisma.$disconnect();
}

main().catch(console.error);
