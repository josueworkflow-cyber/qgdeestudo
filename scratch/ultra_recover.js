const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function ultraRecover() {
  const content = fs.readFileSync('c:/Users/josue/OneDrive/Área de Trabalho/CB-MO Projeto/conteudo/Apostila_SG.txt', 'utf8');
  const lines = content.split('\n');

  let currentMateria = null;
  let currentTema = null;
  let currentTopico = null;
  let buffer = [];

  // Regex ultra flexível para detectar QUALQUER tipo de cabeçalho
  // Pega: Art. X, Art. X-Y-Z, Título X, Seção X, Capítulo X
  const headerRegex = /^\s*(Art\.\s*\d+([\.\-]\d+)*|T[íi]tulo\s+[IVXLCDM\d]+|Se[çc][ãa]o\s+[IVXLCDM\d]+|Cap[íi]tulo\s+[IVXLCDM\d]+)\s*[ºª°]?\s*[\.\-–—]?\s*(.*)$/i;
  const materiaRegex = /^\s*Manual de (.*)$/i;

  console.log("Iniciando Sincronização Ultra-Agressiva...");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('.......')) continue; // Pula sumário

    // Detectar Matéria (Baseado no Manual)
    const mMatch = materiaRegex.exec(line);
    if (mMatch) {
      const name = mMatch[1].trim();
      console.log(`Buscando matéria: "${name}"`);
      currentMateria = await prisma.materia.findFirst({
        where: { nome: { contains: name.substring(0, 10) } }
      });
      if (currentMateria) console.log(`Matéria encontrada: ${currentMateria.nome}`);
      continue;
    }

    if (!currentMateria) continue;

    // Detectar Novo Cabeçalho (Título, Seção ou Artigo)
    const hMatch = headerRegex.exec(line);
    if (hMatch) {
      console.log(`Detectado cabeçalho: ${line}`);
      // Salvar conteúdo do tópico anterior antes de começar o novo
      if (currentTopico && buffer.length > 0) {
        await saveUltraTopico(currentTopico, buffer.join('\n'));
      }

      const fullTag = hMatch[1].trim();
      let title = hMatch[3].trim();
      
      // Caso o título esteja "colado" no número (ex: Art. 1ºTexto)
      if (!title && fullTag.length > 15) {
         // Tenta separar se houver uma letra maiúscula colada
      }

      // Se for um CAPÍTULO, ele vira o TEMA (agrupador lateral)
      if (fullTag.toLowerCase().includes('capitulo')) {
        const tituloTema = `Capítulo ${fullTag.replace(/cap[íi]tulo\s+/i, '')} – ${title}`;
        currentTema = await prisma.tema.findFirst({
          where: { materiaId: currentMateria.id, titulo: { contains: title.substring(0, 15) } }
        });
        
        if (!currentTema) {
          console.log(`[NOVO TEMA] ${tituloTema}`);
          currentTema = await prisma.tema.create({
            data: {
              materiaId: currentMateria.id,
              titulo: tituloTema,
              slug: `${currentMateria.slug}-tema-${Math.random().toString(36).substring(7)}`,
              ordem: 99
            }
          });
        }
        currentTopico = null; // Reseta tópico para que introduções fiquem no tema se necessário
      } else {
        // É um Artigo, Título ou Seção (vira um Tópico no editor)
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
      // É conteúdo de texto comum
      if (line.trim().length > 0) {
        buffer.push(line.trim());
      }
    }
  }

  // Salvar último
  if (currentTopico && buffer.length > 0) {
    await saveUltraTopico(currentTopico, buffer.join('\n'));
  }

  console.log("Sincronização Ultra concluída!");
}

async function saveUltraTopico(topico, conteudo) {
  // Verifica se já existe pelo título exato (incluindo Títulos e Seções agora)
  const existing = await prisma.topico.findFirst({
    where: { 
      temaId: topico.temaId,
      titulo: topico.titulo
    }
  });

  if (!existing) {
    console.log(`[INSERINDO] ${topico.titulo}`);
    await prisma.topico.create({
      data: {
        temaId: topico.temaId,
        titulo: topico.titulo,
        conteudo: conteudo,
        slug: `top-${Math.random().toString(36).substring(7)}`,
        ordem: 99
      }
    });
  } else {
    // Se já existe mas o conteúdo está muito diferente (mais de 20% de diferença), podemos atualizar?
    // Por segurança, vamos apenas reportar que já existe para não sobrescrever edições manuais do usuário.
  }
}

ultraRecover().finally(() => prisma.$disconnect());
