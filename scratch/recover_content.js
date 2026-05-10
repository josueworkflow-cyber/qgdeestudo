const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function recover() {
  const content = fs.readFileSync('c:/Users/josue/OneDrive/Área de Trabalho/CB-MO Projeto/conteudo/Apostila_SG.txt', 'utf8');
  const lines = content.split('\n');

  let currentMateria = null;
  let currentTema = null;
  let currentTopico = null;
  let buffer = [];

  // Padrões de detecção
  const materiaRegex = /^\s*Manual de (.*)$/i;
  const temaRegex = /^\s*(Capítulo|Captulo)\s+(\d+|[IVXLCDM]+)\s*[–\-—]\s*(.*)$/i;
  const topicoRegex = /^\s*(Art\.\s*(\d+([\.\-]\d+)*))\s*[ºª°]?\s*[\.\-–—]?\s*(.*)$/i;

  console.log("Iniciando recuperação de conteúdo...");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detectar Matéria
    const mMatch = materiaRegex.exec(line);
    if (mMatch) {
      // Find materia in DB by name or similar
      const name = mMatch[1].trim();
      currentMateria = await prisma.materia.findFirst({
        where: { nome: { contains: name.substring(0, 10) } }
      });
      continue;
    }

    if (!currentMateria) continue;

    // Detectar Tema (Capítulo)
    const tMatch = temaRegex.exec(line);
    if (tMatch) {
      const titulo = `Capítulo ${tMatch[2]} – ${tMatch[3].trim()}`;
      currentTema = await prisma.tema.findFirst({
        where: { 
          materiaId: currentMateria.id,
          titulo: { contains: tMatch[3].trim().substring(0, 15) }
        }
      });
      
      // Se não achar o tema, criamos!
      if (!currentTema) {
        console.log(`Criando Tema: ${titulo}`);
        currentTema = await prisma.tema.create({
          data: {
            materiaId: currentMateria.id,
            titulo: titulo,
            slug: `${currentMateria.slug}-${tMatch[2]}-${Math.random().toString(36).substring(7)}`,
            ordem: 99 // Será ajustado depois
          }
        });
      }
      continue;
    }

    if (!currentTema) continue;

    // Detectar Tópico (Artigo)
    const artMatch = topicoRegex.exec(line);
    if (artMatch) {
      // Salvar tópico anterior
      if (currentTopico && buffer.length > 0) {
        await saveTopico(currentTopico, buffer.join('\n'));
      }

      const fullTag = artMatch[1].trim();
      const title = artMatch[4].trim();
      
      currentTopico = {
        temaId: currentTema.id,
        titulo: `${fullTag} ${title}`.trim(),
        tag: fullTag
      };
      buffer = [];
    } else {
      if (currentTopico) {
        buffer.push(line.trim());
      }
    }
  }

  // Último tópico
  if (currentTopico && buffer.length > 0) {
    await saveTopico(currentTopico, buffer.join('\n'));
  }

  console.log("Recuperação concluída!");
}

async function saveTopico(topico, conteudo) {
  // Check if exists
  const existing = await prisma.topico.findFirst({
    where: { 
      temaId: topico.temaId,
      titulo: { contains: topico.tag }
    }
  });

  if (!existing) {
    console.log(`Inserindo: ${topico.titulo}`);
    await prisma.topico.create({
      data: {
        temaId: topico.temaId,
        titulo: topico.titulo,
        conteudo: conteudo.substring(0, 10000), // Proteção de tamanho
        slug: `${topico.temaId}-${Math.random().toString(36).substring(7)}`,
        ordem: 99
      }
    });
  }
}

recover().finally(() => prisma.$disconnect());
