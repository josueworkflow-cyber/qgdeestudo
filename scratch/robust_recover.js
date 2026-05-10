const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function robustRecover() {
  const content = fs.readFileSync('c:/Users/josue/OneDrive/Área de Trabalho/CB-MO Projeto/conteudo/Apostila_SG.txt', 'utf8');
  const lines = content.split('\n');

  let currentMateria = null;
  let currentTema = null;
  let currentTopico = null;
  let buffer = [];

  // Regex robusta: usa . para caracteres acentuados que podem estar corrompidos
  const headerRegex = /^\s*(Art\.\s*\d+([\.\-]\d+)*|T.tulo\s+[IVXLCDM\d]+|Se..o\s+[IVXLCDM\d]+|Cap.tulo\s+\d+|Cap.tulo\s+[IVXLCDM\d]+)\s*[ºª°]?\s*[\.\-–—]?\s*(.*)$/i;
  
  // Mapeamento manual de palavras-chave para matérias (evita erro de encoding no título)
  const materiaKeywords = [
    { kw: 'Cerimonial', slug: 'legislacao' },
    { kw: 'Disciplinar', slug: 'legislacao' },
    { kw: 'Estatuto', slug: 'legislacao' },
    { kw: 'Terrestres', slug: 'cgcfn-1-5-operacoes-terrestres' },
    { kw: 'Desembarque', slug: 'cgcfn-1-1-forca-desembarque' },
    { kw: 'Distúrbios', slug: 'cgcfn-309-controle-disturbios' },
    { kw: 'Disturbios', slug: 'cgcfn-309-controle-disturbios' },
    { kw: 'Urbano', slug: 'cgcfn-401-ambiente-urbano' },
    { kw: 'Paz', slug: 'cgcfn-2-2-operacoes-paz' },
    { kw: 'Inteligência', slug: 'cgfn-20-inteligencia' },
    { kw: 'Topografia', slug: 'cgcfn-301-topografia-militar' },
    { kw: 'Garantia', slug: 'cgcfn-2-1-garantia-lei-ordem' }
  ];

  console.log("Iniciando Sincronização Blindada...");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.includes('.......')) continue;

    // 1. Detectar Matéria por Palavras-Chave
    if (line.includes('Manual de') || line.includes('Regulamento')) {
      const match = materiaKeywords.find(m => line.toLowerCase().includes(m.kw.toLowerCase()));
      if (match) {
        currentMateria = await prisma.materia.findUnique({ where: { slug: match.slug } });
        if (currentMateria) {
          console.log(`\n>>> MATÉRIA: ${currentMateria.nome}`);
          currentTema = null;
          continue;
        }
      }
    }

    if (!currentMateria) continue;

    // 2. Detectar Cabeçalho (Título, Seção ou Artigo)
    const hMatch = headerRegex.exec(line);
    if (hMatch) {
      if (currentTopico && buffer.length > 0) {
        await saveRobustTopico(currentTopico, buffer.join('\n'));
      }

      const fullTag = hMatch[1].trim();
      const title = hMatch[3].trim();

      if (fullTag.toLowerCase().includes('cap')) {
        // TEMA (Capítulo)
        const searchTitle = title || fullTag;
        currentTema = await prisma.tema.findFirst({
          where: { 
            materiaId: currentMateria.id,
            titulo: { contains: searchTitle.substring(0, 15) }
          }
        });
        
        if (!currentTema) {
          console.log(`  [NOVO TEMA] ${fullTag} - ${title}`);
          currentTema = await prisma.tema.create({
            data: {
              materiaId: currentMateria.id,
              titulo: `${fullTag} – ${title}`.trim(),
              slug: `tema-${Math.random().toString(36).substring(7)}`,
              ordem: 99
            }
          });
        } else {
          console.log(`  [TEMA OK] ${currentTema.titulo}`);
        }
        
        currentTopico = { temaId: currentTema.id, titulo: `Introdução do ${fullTag}`, tag: 'INTRO' };
        buffer = [];
      } else {
        if (currentTema) {
          currentTopico = { temaId: currentTema.id, titulo: `${fullTag} ${title}`.trim(), tag: fullTag };
          buffer = [];
        }
      }
    } else {
      if (currentTopico) buffer.push(line);
    }
  }

  if (currentTopico && buffer.length > 0) await saveRobustTopico(currentTopico, buffer.join('\n'));
}

async function saveRobustTopico(topico, conteudo) {
  const existing = await prisma.topico.findFirst({
    where: { 
      temaId: topico.temaId,
      OR: [
        { titulo: { equals: topico.titulo } },
        { titulo: { startsWith: topico.tag } }
      ]
    }
  });

  if (!existing) {
    console.log(`    [INSERINDO] ${topico.titulo}`);
    await prisma.topico.create({
      data: {
        temaId: topico.temaId,
        titulo: topico.titulo,
        conteudo: conteudo,
        slug: `top-${Math.random().toString(36).substring(7)}`,
        ordem: 99
      }
    });
  }
}

robustRecover().finally(() => prisma.$disconnect());
