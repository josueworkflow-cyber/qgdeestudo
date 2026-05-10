const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findFragments() {
  const topicos = await prisma.topico.findMany({
    orderBy: [
      { temaId: 'asc' },
      { ordem: 'asc' },
    ],
    include: {
      tema: {
        select: {
          titulo: true,
          materia: { select: { nome: true, slug: true } }
        }
      }
    },
  });

  const fragments = [];

  for (let i = 0; i < topicos.length; i++) {
    const atual = topicos[i];
    const conteudo = (atual.conteudo || '').trim();

    if (conteudo.length < 80) {
      const anterior = i > 0 ? topicos[i - 1] : null;
      const proximo = i < topicos.length - 1 ? topicos[i + 1] : null;

      const mesmoTemaAnterior = anterior && anterior.temaId === atual.temaId;
      const mesmoTemaProximo = proximo && proximo.temaId === atual.temaId;

      // Determine merge direction
      let acao = '';
      let mergeCom = '';

      // If content starts with lowercase or is clearly a continuation
      const isContinuacao =
        conteudo.startsWith('da ') ||
        conteudo.startsWith('de ') ||
        conteudo.startsWith('do ') ||
        conteudo.startsWith('pela ') ||
        conteudo.startsWith('que ') ||
        conteudo.startsWith('a') && conteudo[1] === ')' ||
        conteudo.startsWith('b') && conteudo[1] === ')' ||
        conteudo.startsWith('c') && conteudo[1] === ')' ||
        conteudo.startsWith('d') && conteudo[1] === ')' ||
        conteudo.startsWith('e') && conteudo[1] === ')' ||
        conteudo.startsWith('f') && conteudo[1] === ')' ||
        conteudo.startsWith('g') && conteudo[1] === ')' ||
        conteudo.startsWith('•') ||
        conteudo.startsWith('-') ||
        conteudo.startsWith('reivindicatório') ||
        conteudo.startsWith('Júri') ||
        conteudo.startsWith('com ') ||
        conteudo.startsWith('das ') ||
        conteudo.startsWith('se ') ||
        conteudo.startsWith('os ') ||
        conteudo.startsWith('aos ') ||
        conteudo.startsWith('alcance ') ||
        conteudo.startsWith('condições ') ||
        conteudo.startsWith('distância ') ||
        conteudo.startsWith('de ') ||
        conteudo.startsWith('dessa ') ||
        conteudo.startsWith('para ') ||
        conteudo.startsWith('1. ') ||
        conteudo.startsWith('2. ') ||
        conteudo.startsWith('3. ') ||
        conteudo.startsWith('4. ') ||
        conteudo.startsWith('5. ') ||
        conteudo.startsWith('6. ') ||
        conteudo.length < 40;

      if (isContinuacao && mesmoTemaAnterior) {
        acao = 'MESCLAR NO ANTERIOR';
        mergeCom = anterior.titulo;
      } else if (conteudo.length === 0) {
        acao = 'VAZIO - REMOVER';
      } else if (mesmoTemaAnterior && (anterior.conteudo || '').trim().length > 50) {
        acao = 'PROVAVEL CONTINUACAO';
        mergeCom = anterior.titulo;
      }

      if (acao) {
        fragments.push({
          ordem_atual: atual.ordem,
          titulo: atual.titulo,
          conteudo: conteudo,
          conteudo_len: conteudo.length,
          acao: acao,
          merge_com: mergeCom,
          anterior_titulo: anterior?.titulo || '',
          anterior_final: ((anterior?.conteudo || '').trim()).slice(-80),
          materia: atual.tema?.materia?.nome || '',
          tema: atual.tema?.titulo || '',
        });
      }
    }
  }

  // Group by tema for clarity
  const porTema = {};
  for (const f of fragments) {
    const key = `${f.materia} > ${f.tema}`;
    if (!porTema[key]) porTema[key] = [];
    porTema[key].push(f);
  }

  console.log('=== FRAGMENTOS QUE PRECISAM SER MESCLADOS ===\n');
  console.log(`Total: ${fragments.length} fragmentos em ${Object.keys(porTema).length} temas\n`);

  for (const [tema, frags] of Object.entries(porTema)) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📁 ${tema}`);
    console.log(`${'='.repeat(70)}`);

    for (const f of frags) {
      console.log(`\n  [Ordem ${f.ordem_atual}] ${f.acao}`);
      console.log(`  Título: "${f.titulo}"`);
      console.log(`  Conteúdo (${f.conteudo_len} chars): "${f.conteudo}"`);
      if (f.merge_com) {
        console.log(`  ⬆️  Mesclar em: "${f.merge_com}"`);
        console.log(`  Final do anterior: "...${f.anterior_final}"`);
      }
    }
  }

  console.log(`\n\n${'='.repeat(70)}`);
  console.log('RESUMO PARA SQL');
  console.log(`${'='.repeat(70)}\n`);

  // Show SQL-like merge operations
  for (const f of fragments) {
    if (f.acao === 'MESCLAR NO ANTERIOR' || f.acao === 'PROVAVEL CONTINUACAO') {
      console.log(`-- ${f.materia} / ${f.tema}`);
      console.log(`-- MESCLAR "${f.titulo}" NO ANTERIOR "${f.merge_com}"`);
      console.log(`-- Conteudo a adicionar: "${f.conteudo}"`);
      console.log('');
    } else if (f.acao === 'VAZIO - REMOVER') {
      console.log(`-- VAZIO: REMOVER "${f.titulo}" (${f.materia})`);
      console.log('');
    }
  }

  await prisma.$disconnect();
}

findFragments().catch(console.error);
