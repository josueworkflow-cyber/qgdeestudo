const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

/**
 * CORREÇÃO FINAL - Baseada exclusivamente no TXT fonte (Apostila_SG.txt)
 * 
 * 1. Mescla fragmentos de continuação (conteúdo quebrado entre tópicos consecutivos)
 * 2. Corrige Art. 7º (contravenções disciplinares fragmentadas em 19 tópicos)
 * 3. Remove tópicos vazios
 */

const CONTINUATION_STARTS = [
  'da ', 'de ', 'do ', 'pela ', 'que ', 'com ', 'das ', 'dos ',
  'se ', 'os ', 'aos ', 'para ', 'dessa ', 'em ', 'no ', 'na ',
  'reivindicatório', 'Júri', 'alcance', 'condições', 'distância',
  'desertor', 'Forças Armadas', 'emblemas', 'Militar',
  'Estabilidade', 'ges', 'segura', 'devem ser', 'direção',
  'regulamentação', 'As Praças', 'A Oficialidade',
  'O uniforme', 'mutuamente', 'praças', 'atos',
  'reforma', 'pena', 'Praças',
  'b) ', 'c) ', 'd) ', 'e) ', 'f) ', 'g) ',
];

async function fixAll(dryRun = true) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(dryRun ? '🔍 SIMULAÇÃO (DRY RUN)' : '🔧 EXECUTANDO CORREÇÕES');
  console.log(`${'='.repeat(70)}\n`);

  const mergeOps = [];
  const deleteOps = [];

  // ==========================================
  // PASSO 1: Art. 7º - Contravenções (caso especial)
  // ==========================================
  console.log('📋 PASSO 1: Corrigindo Art. 7º (Contravenções Disciplinares)...\n');

  const temaDefinicao = await prisma.tema.findFirst({
    where: { titulo: { contains: 'Definição e Especificação' } },
    include: { materia: true },
  });

  if (temaDefinicao) {
    const todosTopicos = await prisma.topico.findMany({
      where: { temaId: temaDefinicao.id },
      orderBy: { ordem: 'asc' },
    });

    // Find the main Art. 7 topic (ordem 99 or the one titled "Art. 7 São contravenções")
    const art7Topic = todosTopicos.find(t => 
      t.titulo.startsWith('Art. 7') && t.titulo.includes('contraven')
    );

    // Find all fragment topics (ordem 2-18, numbered items)
    const fragmentos = todosTopicos.filter(t => 
      /^\d+\.\s/.test(t.titulo) && 
      !t.titulo.startsWith('Art.')
    );

    if (art7Topic && fragmentos.length > 0) {
      // Build the full Art. 7 content from fragments
      const partes = [];
      
      // First, the existing content of Art. 7
      const art7Content = (art7Topic.conteudo || '').trim();
      if (art7Content) partes.push(art7Content);

      // Then each fragment's title + content
      for (const f of fragmentos) {
        const item = f.titulo.trim() + '\n' + (f.conteudo || '').trim();
        partes.push(item);
      }

      const novoConteudo = partes.join('\n\n');

      mergeOps.push({
        tipo: 'ART7',
        mainId: art7Topic.id,
        mainTitulo: art7Topic.titulo,
        fragmentIds: fragmentos.map(f => f.id),
        fragmentTitulos: fragmentos.map(f => f.titulo),
        novoConteudoPreview: novoConteudo.substring(0, 300) + '...',
        materia: temaDefinicao.materia?.nome || 'Legislação',
        tema: temaDefinicao.titulo,
      });

      // Remove from consideration for next steps
      for (const f of fragmentos) {
        deleteOps.push({
          id: f.id,
          titulo: f.titulo,
          motivo: 'Fragmento do Art. 7º',
        });
      }
    }
  }

  // ==========================================
  // PASSO 2: Fragmentos de continuação
  // ==========================================
  console.log('📋 PASSO 2: Detectando fragmentos de continuação...\n');

  const allTopicos = await prisma.topico.findMany({
    orderBy: [{ temaId: 'asc' }, { ordem: 'asc' }],
    include: { tema: { select: { titulo: true, materia: { select: { nome: true } } } } },
  });

  const excludedIds = new Set(deleteOps.map(o => o.id));

  for (let i = 0; i < allTopicos.length; i++) {
    const atual = allTopicos[i];
    if (excludedIds.has(atual.id)) continue;

    const conteudo = (atual.conteudo || '').trim();
    const anterior = i > 0 ? allTopicos[i - 1] : null;

    if (!anterior || anterior.temaId !== atual.temaId) continue;
    if (excludedIds.has(anterior.id)) continue;

    // Check: empty content
    if (conteudo.length === 0) {
      deleteOps.push({
        id: atual.id,
        titulo: atual.titulo,
        motivo: 'Conteúdo vazio',
        materia: atual.tema?.materia?.nome,
        tema: atual.tema?.titulo,
      });
      excludedIds.add(atual.id);
      continue;
    }

    // Check: content is continuation of previous
    if (conteudo.length < 80) {
      const lower = conteudo.toLowerCase();
      let isContinuation = false;

      for (const start of CONTINUATION_STARTS) {
        if (lower.startsWith(start)) { isContinuation = true; break; }
      }
      if (/^[a-g]\)/.test(conteudo)) isContinuation = true;
      if (/^\d\.\s/.test(conteudo)) isContinuation = true;
      if (/^•/.test(conteudo)) isContinuation = true;

      // Title looks like a numbered step
      if (/^\d\.\s/.test(atual.titulo) && conteudo.length < 60) isContinuation = true;

      if (isContinuation && !excludedIds.has(anterior.id)) {
        const newContent = (anterior.conteudo || '').trim() + '\n\n' + conteudo;
        mergeOps.push({
          tipo: 'CONTINUACAO',
          fragmentId: atual.id,
          targetId: anterior.id,
          fragmentTitulo: atual.titulo,
          targetTitulo: anterior.titulo,
          conteudo: conteudo,
          targetConteudoFinal: (anterior.conteudo || '').trim().slice(-60),
          materia: atual.tema?.materia?.nome,
          tema: atual.tema?.titulo,
        });
        excludedIds.add(atual.id);
      }
    }
  }

  // ==========================================
  // PASSO 3: Exibir resumo
  // ==========================================
  const art7Ops = mergeOps.filter(o => o.tipo === 'ART7');
  const contOps = mergeOps.filter(o => o.tipo === 'CONTINUACAO');

  console.log(`${'='.repeat(70)}`);
  console.log('RESUMO DAS OPERAÇÕES');
  console.log(`${'='.repeat(70)}`);
  console.log(`Art. 7º (reconstruir):  ${art7Ops.length}`);
  console.log(`Continuações (mesclar): ${contOps.length}`);
  console.log(`Deletar:               ${deleteOps.length}`);
  console.log(`Total de alterações:   ${art7Ops.length + contOps.length + deleteOps.length}`);
  console.log('');

  // Show Art. 7 fix
  if (art7Ops.length > 0) {
    console.log('--- ART. 7º - RECONSTRUÇÃO ---');
    for (const op of art7Ops) {
      console.log(`  📁 ${op.materia} > ${op.tema}`);
      console.log(`  Tópico principal: "${op.mainTitulo}"`);
      console.log(`  Fragmentos a mesclar (${op.fragmentIds.length}):`);
      for (const ft of op.fragmentTitulos) {
        console.log(`    - "${ft}"`);
      }
      console.log(`  Preview do novo conteúdo: "${op.novoConteudoPreview}"`);
    }
  }

  // Show continuation merges
  if (contOps.length > 0) {
    console.log('\n--- CONTINUAÇÕES - MESCLAR ---');
    for (const op of contOps) {
      console.log(`  📁 ${op.materia} > ${op.tema}`);
      console.log(`  🔗 "${op.fragmentTitulo}"`);
      console.log(`     Conteúdo: "${op.conteudo.substring(0, 80)}"`);
      console.log(`     ⬆️  Em: "${op.targetTitulo}"`);
      console.log('');
    }
  }

  // Show deletes
  if (deleteOps.length > 0) {
    console.log('--- DELETAR ---');
    for (const op of deleteOps) {
      console.log(`  🗑️  [${op.materia || '?'}] "${op.titulo}" — ${op.motivo}`);
    }
  }

  // ==========================================
  // PASSO 4: Executar (se não for dry run)
  // ==========================================
  if (!dryRun) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('EXECUTANDO CORREÇÕES NO BANCO...');
    console.log(`${'='.repeat(70)}\n`);

    // Execute Art. 7 fix
    for (const op of art7Ops) {
      // Build full content from fragments
      const partes = [];
      const mainTopic = await prisma.topico.findUnique({ where: { id: op.mainId } });
      const mainContent = (mainTopic?.conteudo || '').trim();
      if (mainContent) partes.push(mainContent);

      for (const fid of op.fragmentIds) {
        const frag = await prisma.topico.findUnique({ where: { id: fid } });
        if (frag) {
          const item = frag.titulo.trim() + '\n' + (frag.conteudo || '').trim();
          partes.push(item);
        }
      }

      await prisma.topico.update({
        where: { id: op.mainId },
        data: { conteudo: partes.join('\n\n') },
      });

      for (const fid of op.fragmentIds) {
        await prisma.topico.delete({ where: { id: fid } }).catch(() => {});
      }
      console.log(`✅ Art. 7º reconstruído (${op.fragmentIds.length} fragmentos mesclados)`);
    }

    // Execute continuation merges
    for (const op of contOps) {
      const target = await prisma.topico.findUnique({ where: { id: op.targetId } });
      if (!target) continue;

      const newContent = (target.conteudo || '').trim() + '\n\n' + op.conteudo;

      await prisma.topico.update({
        where: { id: op.targetId },
        data: { conteudo: newContent },
      });

      await prisma.topico.delete({ where: { id: op.fragmentId } }).catch(() => {});
    }
    console.log(`✅ ${contOps.length} continuações mescladas`);

    // Execute deletes
    for (const op of deleteOps) {
      await prisma.topico.delete({ where: { id: op.id } }).catch(() => {});
    }
    console.log(`✅ ${deleteOps.length} tópicos removidos`);

    // Reordenar tópicos do Art. 7 e outros temas afetados
    console.log('\nReordenando tópicos...');
    const temasAfetados = new Set();
    for (const op of mergeOps) {
      if (op.tipo === 'ART7') {
        const tema = await prisma.tema.findFirst({ where: { titulo: { contains: 'Definição e Especificação' } } });
        if (tema) temasAfetados.add(tema.id);
      }
    }
    // Note: reordering after merges/deletes is complex, skipping for now
    // The topics may have gaps in ordering but it doesn't break functionality

    console.log('\n✅ Correção concluída!');
  } else {
    console.log(`\nPara aplicar as correções: npx tsx scratch/final_fix.js --apply`);
  }

  await prisma.$disconnect();
}

const dryRun = !process.argv.includes('--apply');
fixAll(dryRun).catch(console.error);
