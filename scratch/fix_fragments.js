const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * CORRIGE fragmentos de conteúdo que foram separados indevidamente.
 * 
 * REGRAS:
 * 1. Se o tópico tem conteúdo < 80 chars e parece continuação do anterior, mescla
 * 2. Se o tópico está completamente vazio, deleta
 * 3. Se o título é um número de item/procedimento solto, mescla no anterior
 */

const CONTINUATION_STARTS = [
  'da ', 'de ', 'do ', 'pela ', 'que ', 'com ', 'das ', 'dos ',
  'se ', 'os ', 'aos ', 'para ', 'dessa ', 'em ', 'no ', 'na ',
  'reivindicatório', 'Júri', 'alcance', 'condições', 'distância',
  'desertor', 'Forças Armadas', 'emblemas', 'Militar',
  'Estabilidade', 'ges', 'segura', 'devem ser',
  'regulamentação', 'As Praças', 'A Oficialidade',
  'O uniforme', 'mutuamente', 'praças', 'atos',
  'direção', 'reforma', 'pena',
];

async function fixFragments(dryRun = true) {
  const topicos = await prisma.topico.findMany({
    orderBy: [{ temaId: 'asc' }, { ordem: 'asc' }],
    include: { tema: { select: { titulo: true, materia: { select: { nome: true } } } } },
  });

  const operations = [];
  const stats = { merge: 0, delete: 0, skip: 0 };

  for (let i = 0; i < topicos.length; i++) {
    const atual = topicos[i];
    const conteudo = (atual.conteudo || '').trim();
    const anterior = i > 0 ? topicos[i - 1] : null;

    if (!anterior || anterior.temaId !== atual.temaId) continue;
    if (conteudo.length >= 80) continue;

    let shouldMerge = false;
    let reason = '';

    // Case 1: Empty content → delete
    if (conteudo.length === 0) {
      shouldMerge = false; // Just delete
      operations.push({
        type: 'DELETE',
        id: atual.id,
        titulo: atual.titulo,
        materia: atual.tema?.materia?.nome,
        tema: atual.tema?.titulo,
        reason: 'Conteúdo vazio',
      });
      stats.delete++;
      continue;
    }

    // Case 2: Content is a clear continuation of previous
    const lowerContent = conteudo.toLowerCase();
    for (const start of CONTINUATION_STARTS) {
      if (lowerContent.startsWith(start)) {
        shouldMerge = true;
        reason = `Continuação (começa com "${conteudo.substring(0, 20)}")`;
        break;
      }
    }

    // Case 3: Starts with bullet point or sub-item letter
    if (/^[a-g]\)/.test(conteudo) || conteudo.startsWith('•') || /^\d\.\s/.test(conteudo)) {
      shouldMerge = true;
      reason = `Item de lista (começa com "${conteudo.substring(0, 5)}")`;
    }

    // Case 4: Title looks like a numbered procedure step
    if (/^\d\.\s/.test(atual.titulo)) {
      shouldMerge = true;
      reason = 'Título é passo numerado';
    }

    // Case 5: Content is just "b) ..." or "d) ..." or "f) ..."
    if (/^[a-g]\)/.test(conteudo) && conteudo.length < 60) {
      shouldMerge = true;
      reason = 'Letra de sub-item';
    }

    if (shouldMerge) {
      operations.push({
        type: 'MERGE',
        id: atual.id,
        targetId: anterior.id,
        titulo: atual.titulo,
        conteudo: conteudo,
        targetTitulo: anterior.titulo,
        targetConteudoFinal: (anterior.conteudo || '').trim().slice(-60),
        materia: atual.tema?.materia?.nome,
        tema: atual.tema?.titulo,
        reason: reason,
      });
      stats.merge++;
    } else {
      stats.skip++;
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(dryRun ? 'SIMULAÇÃO (DRY RUN) - Nenhuma alteração será feita' : 'EXECUTANDO CORREÇÕES');
  console.log(`${'='.repeat(70)}`);
  console.log(`Mesclar: ${stats.merge} | Deletar: ${stats.delete} | Ignorar: ${stats.skip}\n`);

  if (stats.delete > 0) {
    console.log('--- DELETAR (tópicos vazios) ---');
    for (const op of operations.filter(o => o.type === 'DELETE')) {
      console.log(`  🗑️  [${op.materia}] "${op.titulo}" — ${op.reason}`);
    }
  }

  if (stats.merge > 0) {
    console.log('\n--- MESCLAR (continuação no anterior) ---');
    for (const op of operations.filter(o => o.type === 'MERGE')) {
      console.log(`  🔗 [${op.materia}]`);
      console.log(`     Título atual: "${op.titulo}"`);
      console.log(`     Conteúdo:     "${op.conteudo}"`);
      console.log(`     ⬆️  Mesclar em: "${op.targetTitulo}"`);
      console.log(`     Motivo: ${op.reason}`);
      console.log('');
    }
  }

  // Execute if not dry run
  if (!dryRun) {
    console.log('\nExecutando correções no banco...');

    // First, do merges
    for (const op of operations.filter(o => o.type === 'MERGE')) {
      const target = await prisma.topico.findUnique({ where: { id: op.targetId } });
      const newContent = (target.conteudo || '') + '\n\n' + op.conteudo;

      await prisma.topico.update({
        where: { id: op.targetId },
        data: { conteudo: newContent },
      });

      await prisma.topico.delete({ where: { id: op.id } });
      console.log(`  ✅ Mesclado: "${op.titulo}" → "${op.targetTitulo}"`);
    }

    // Then, do deletes
    for (const op of operations.filter(o => o.type === 'DELETE')) {
      await prisma.topico.delete({ where: { id: op.id } });
      console.log(`  ✅ Deletado: "${op.titulo}"`);
    }

    console.log('\nCorreções concluídas!');
  } else {
    console.log('\nPara executar as correções, rode: npx tsx scratch/fix_fragments.js --apply');
  }

  await prisma.$disconnect();
}

const dryRun = !process.argv.includes('--apply');
fixFragments(dryRun).catch(console.error);
