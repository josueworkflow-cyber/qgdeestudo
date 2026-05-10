const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function finetunedRecover() {
  const content = fs.readFileSync('c:/Users/josue/OneDrive/Área de Trabalho/CB-MO Projeto/conteudo/Apostila_SG.txt', 'utf8');
  const lines = content.split('\n');

  let currentMateria = null;
  let currentTema = null;
  let currentTopico = null;
  let buffer = [];

  const headerRegex = /^\s*(Art\.\s*\d+([\.\-]\d+)*|T[íi]tulo\s+[IVXLCDM\d]+|Se[çc][ãa]o\s+[IVXLCDM\d]+|Cap[íi]tulo\s+[IVXLCDM\d]+)\s*[ºª°]?\s*[\.\-–—]?\s*(.*)$/i;
  const materiaRegex = /^\s*Manual de (.*)$/i;

  console.log("Iniciando Sincronização Finetuned...");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.includes('.......')) continue;

    // 1. Detectar Matéria
    const mMatch = materiaRegex.exec(line);
    if (mMatch) {
      const name = mMatch[1].trim();
      // Busca mais precisa: tenta nome completo primeiro
      currentMateria = await prisma.materia.findFirst({
        where: { OR: [
          { nome: { equals: name } },
          { nome: { contains: name } }
        ]}
      });
      if (currentMateria) console.log(`\n>>> MATÉRIA: ${currentMateria.nome}`);
      currentTema = null;
      continue;
    }

    if (!currentMateria) continue;

    // 2. Detectar Cabeçalho
    const hMatch = headerRegex.exec(line);
    if (hMatch) {
      // Salvar anterior
      if (currentTopico && buffer.length > 0) {
        await saveFinalTopico(currentTopico, buffer.join('\n'));
      }

      const fullTag = hMatch[1].trim();
      const title = hMatch[3].trim();

      if (fullTag.toLowerCase().includes('capitulo')) {
        // Buscar Tema existente ou criar
        const searchTitle = title || fullTag;
        currentTema = await prisma.tema.findFirst({
          where: { 
            materiaId: currentMateria.id,
            titulo: { contains: searchTitle.substring(0, 20) }
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
        
        // Se houver texto logo após o capítulo, cria um tópico de "Introdução"
        currentTopico = {
          temaId: currentTema.id,
          titulo: `Introdução do ${fullTag}`,
          tag: 'INTRO'
        };
        buffer = [];
      } else {
        if (currentTema) {
          currentTopico = {
            temaId: currentTema.id,
            titulo: `${fullTag} ${title}`.trim(),
            tag: fullTag
          };
          buffer = [];
        }
      }
    } else {
      if (currentTopico) {
        buffer.push(line);
      }
    }
  }

  // Salvar último
  if (currentTopico && buffer.length > 0) {
    await saveFinalTopico(currentTopico, buffer.join('\n'));
  }
}

async function saveFinalTopico(topico, conteudo) {
  // Verifica se já existe algo com esse título ou tag no tema
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

finetunedRecover().finally(() => prisma.$disconnect());
