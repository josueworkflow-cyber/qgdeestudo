import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const MATERIAS_MAP = [
  { "codigo": "LEGISLACAO", "nome": "Legislação", "slug": "legislacao", "ordem": 1 },
  { "codigo": "CGCFN-0-1", "nome": "Manual Básico dos Grupamentos Operativos de Fuzileiros Navais", "slug": "cgcfn-0-1-grupamentos-operativos", "ordem": 2 },
  { "codigo": "CGCFN-1-1", "nome": "Manual de Operações da Força de Desembarque", "slug": "cgcfn-1-1-forca-desembarque", "ordem": 3 },
  { "codigo": "CGCFN-1-5", "nome": "Manual de Operações Terrestres de Fuzileiros Navais", "slug": "cgcfn-1-5-operacoes-terrestres", "ordem": 4 },
  { "codigo": "CGCFN-2-1", "nome": "Manual de Operações de Garantia da Lei e da Ordem de Fuzileiros Navais", "slug": "cgcfn-2-1-garantia-lei-ordem", "ordem": 5 },
  { "codigo": "CGCFN-2-2", "nome": "Manual de Operações de Paz", "slug": "cgcfn-2-2-operacoes-paz", "ordem": 6 },
  { "codigo": "CGCFN-31-10", "nome": "Manual do Combatente Anfíbio", "slug": "cgcfn-31-10-combatente-anfibio", "ordem": 7 },
  { "codigo": "CGCFN-31-3", "nome": "Manual do Pelotão de Infantaria de Fuzileiros Navais", "slug": "cgcfn-31-3-pelotao-infantaria", "ordem": 8 },
  { "codigo": "CGCFN-201", "nome": "Manual Básico do Fuzileiro Naval", "slug": "cgcfn-201-manual-basico-fn", "ordem": 9 },
  { "codigo": "CGCFN-301", "nome": "Manual de Topografia Militar", "slug": "cgcfn-301-topografia-militar", "ordem": 10 },
  { "codigo": "CGCFN-309", "nome": "Manual de Controle de Distúrbios", "slug": "cgcfn-309-controle-disturbios", "ordem": 11 },
  { "codigo": "CGCFN-401", "nome": "Manual de Operações Militares em Ambiente Urbano dos Fuzileiros Navais", "slug": "cgcfn-401-ambiente-urbano", "ordem": 12 },
  { "codigo": "EMA-137", "nome": "Doutrina de Liderança da Marinha", "slug": "ema-137-lideranca", "ordem": 13 },
  { "codigo": "CGFN-20", "nome": "Manual de Inteligência de Fuzileiros Navais", "slug": "cgfn-20-inteligencia", "ordem": 14 }
];

const LIXO_PATTERNS = [
  /Apostila gerada para .{5,80}/gim,
  /Apostila somente para C-Esp-HabSG-\d+/gim,
  /\(cid:\d+\)/gim,
  /^\s*\d{1,3}\s*$/gim,
  /^\.{5,}.*$/gim,
];

const CORRECOES: Record<string, string> = {
  "An0bio": "Anfíbio",
  "An'bias": "Anfíbias",
  "An'bia": "Anfíbia",
  "An'bio": "Anfíbio",
  "Opera=vos": "Operativos",
  "Opera=vo": "Operativo",
  "Garan=a": "Garantia",
  "inicia(cid:16)va": "iniciativa",
  "opera(cid:16)vo": "operativo",
  "cons(cid:16)tu": "constitu",
  "efe(cid:16)vo": "efetivo",
  "u(cid:16)liz": "utiliz",
  "Dis=n=vos": "Distintivos",
  "Dis=n=vo": "Distintivo",
  "Con=nências": "Continências",
  "Con=nência": "Continência",
  "con=nência": "continência",
  "pra(cid:16)c": "pratiqu",
  "Caracterís=cas": "Características",
  "Caracterís(cid:16)cas": "Características",
  "iden(cid:16)f": "identif",
  "opera(cid:16)": "operati",
  "situa(cid:16)": "situati",
  "capacid": "capacid",
};

function limparTexto(texto: string): string {
  let limpo = texto;
  for (const padrao of LIXO_PATTERNS) {
    limpo = limpo.replace(padrao, '');
  }
  for (const [errado, certo] of Object.entries(CORRECOES)) {
    limpo = limpo.split(errado).join(certo);
  }
  limpo = limpo.replace(/\n{3,}/g, '\n\n');
  limpo = limpo.replace(/ {2,}/g, ' ');
  return limpo.trim();
}

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[áàãâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòõôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-{2,}/g, '-')
    .substring(0, 80)
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('Iniciando seed a partir do TXT...');

  console.log('1. Limpando banco de dados...');
  await prisma.progresso.deleteMany();
  await prisma.tarefaEstudo.deleteMany();
  await prisma.missaoDiaria.deleteMany();
  await prisma.revisaoProgramada.deleteMany();
  await prisma.historicoCiclo.deleteMany();
  await prisma.cicloEstudo.deleteMany();
  await prisma.planoEstudo.deleteMany();
  await prisma.flashcardProgresso.deleteMany();
  await prisma.sessaoEstudo.deleteMany();
  await prisma.resposta.deleteMany();
  await prisma.resultadoSimulado.deleteMany();
  await prisma.simuladoQuestao.deleteMany();
  await prisma.simulado.deleteMany();
  await prisma.flashcard.deleteMany();
  await prisma.questao.deleteMany();
  await prisma.imagemConteudo.deleteMany();
  await prisma.topico.deleteMany();
  await prisma.tema.deleteMany();
  await prisma.materia.deleteMany();

  console.log('2. Criando usuários...');
  const senhaAdmin = await bcrypt.hash('Admin@2025', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@plataforma.com.br' },
    update: { senhaHash: senhaAdmin },
    create: {
      nome: 'Administrador',
      email: 'admin@plataforma.com.br',
      senhaHash: senhaAdmin,
    },
  });

  const senhaAluno = await bcrypt.hash('123456', 10);
  await prisma.usuario.upsert({
    where: { email: 'aluno@cbmo.test' },
    update: { senhaHash: senhaAluno },
    create: {
      id: 'usuario-demo',
      nome: 'Aluno Operacional',
      email: 'aluno@cbmo.test',
      senhaHash: senhaAluno,
    },
  });

  console.log('3. Lendo Apostila_SG.txt...');
  const txtPath = path.join(process.cwd(), 'conteudo/Apostila_SG.txt');
  const textRaw = fs.readFileSync(txtPath, 'utf8');

  console.log('4. Extraindo e populando matérias...');
  
  // Find indices of each manual
  const manualIndices: { nome: string, slug: string, ordem: number, index: number }[] = [];
  
  for (const materia of MATERIAS_MAP) {
    const fuzzy = materia.nome.replace(/[áàãâäéèêëíìîïóòõôöúùûüç]/gi, '.');
    const regex = new RegExp(`^\\s*${fuzzy}\\s*$`, 'gim');
    const match = regex.exec(textRaw);
    if (match) {
      manualIndices.push({
        nome: materia.nome,
        slug: materia.slug,
        ordem: materia.ordem,
        index: match.index,
      });
    } else {
      console.warn(`[AVISO] Manual não encontrado no TXT: ${materia.nome}`);
    }
  }

  manualIndices.sort((a, b) => a.index - b.index);

  const sections = [];
  for (let i = 0; i < manualIndices.length; i++) {
    const start = manualIndices[i].index;
    const end = i < manualIndices.length - 1 ? manualIndices[i + 1].index : textRaw.length;
    sections.push({
      ...manualIndices[i],
      content: textRaw.slice(start, end)
    });
  }

  const capPattern = /^\s*(Capítulo|Capitulo|CAPÍTULO)\s+(\d+|[IVXLCDM]+)\s*[–\-—]\s*(.+)$/gim;
  const secPattern = /^\s*(\d+[\.\d]*)\s+(.{5,80})$/gm;
  const artPattern = /^\s*(Art\.\s*[\d\-]+|Seção\s+[IVXLCDM]+|Título\s+[IVXLCDM]+)\s*[–\-—]?\s*(.*)$/gim;
  const figPattern = /(Fig\.\s*\d+\.\d+)|(Figura\s*\d+\.\d+)|(\(Fig\.\s*\d+\))/gi;

  let totalImagens = 0;

  for (const section of sections) {
    console.log(`\n-> Inserindo Matéria: ${section.nome}`);
    const materiaRecord = await prisma.materia.create({
      data: {
        nome: section.nome,
        slug: section.slug,
        ordem: section.ordem,
      }
    });

    const capMatches = [...section.content.matchAll(capPattern)];
    
    // If no chapters found, treat whole section as one chapter
    if (capMatches.length === 0) {
       console.log(`   Nenhum capítulo encontrado. Criando capítulo geral.`);
       const temaRecord = await prisma.tema.create({
         data: {
           materiaId: materiaRecord.id,
           titulo: 'Conteúdo Geral',
           slug: `${section.slug}-conteudo-geral`,
           ordem: 1,
         }
       });
       
       await prisma.topico.create({
         data: {
           temaId: temaRecord.id,
           titulo: 'Conteúdo Completo',
           slug: `${section.slug}-completo`,
           conteudo: limparTexto(section.content),
           ordem: 1,
         }
       });
       continue;
    }

    for (let c = 0; c < capMatches.length; c++) {
      const match = capMatches[c];
      const num = match[2];
      const titulo = match[3].trim();
      const tituloCompleto = `Capítulo ${num} – ${titulo}`;
      const slugTemaBase = `${section.slug}-${slugify(titulo)}`.substring(0, 90);
      const slugTema = `${slugTemaBase}-${c + 1}`;
      
      const startIdx = match.index;
      const endIdx = c < capMatches.length - 1 ? capMatches[c+1].index : section.content.length;
      let capContent = section.content.slice(startIdx + match[0].length, endIdx).trim();

      const temaRecord = await prisma.tema.create({
        data: {
          materiaId: materiaRecord.id,
          titulo: tituloCompleto,
          slug: slugTema,
          ordem: c + 1,
        }
      });

      // Find topicos within chapter
      const linhas = capContent.split('\n');
      const topicos: { titulo: string, slug: string, conteudo: string }[] = [];
      let topicoAtual = null;
      let linhasAtuais: string[] = [];

      for (const linha of linhas) {
        const linhaLimpa = linha.trim();
        
        // Check if it's a topic header
        const secMatch = secPattern.exec(linhaLimpa);
        const artMatch = artPattern.exec(linhaLimpa);
        
        let isTitulo = false;
        let numTopico = '';
        let tituloTopico = '';

        if (secMatch) {
          numTopico = secMatch[1];
          tituloTopico = secMatch[2].trim();
          const pontos = numTopico.split('.').length - 1;
          if (pontos <= 2 && tituloTopico.length > 4) {
            isTitulo = true;
          }
        } else if (artMatch) {
          numTopico = artMatch[1];
          tituloTopico = (artMatch[2] || numTopico).trim();
          isTitulo = true;
        }

        if (isTitulo) {
          if (topicoAtual && linhasAtuais.length > 0) {
            topicoAtual.conteudo = linhasAtuais.join('\n').trim();
            if (topicoAtual.conteudo) topicos.push(topicoAtual);
          }
          const t = `${numTopico} ${tituloTopico}`.trim();
          topicoAtual = {
            titulo: t,
            slug: `${slugTema}-${slugify(tituloTopico)}`.substring(0, 120),
            conteudo: ''
          };
          linhasAtuais = [];
        } else {
          if (linhaLimpa) linhasAtuais.push(linhaLimpa);
        }
        
        // Reset regex states
        secPattern.lastIndex = 0;
        artPattern.lastIndex = 0;
      }

      if (topicoAtual && linhasAtuais.length > 0) {
        topicoAtual.conteudo = linhasAtuais.join('\n').trim();
        if (topicoAtual.conteudo) topicos.push(topicoAtual);
      }

      if (topicos.length === 0 && capContent.trim()) {
        topicos.push({
          titulo: 'Conteúdo',
          slug: `${slugTema}-conteudo`,
          conteudo: capContent.trim()
        });
      }

        let tOrdem = 1;
      for (const top of topicos) {
        const conteudoLimpo = limparTexto(top.conteudo);
        if (conteudoLimpo.length < 20) continue; // Skip empty/garbage

        await prisma.topico.create({
          data: {
            temaId: temaRecord.id,
            titulo: top.titulo,
            slug: `${top.slug}-${tOrdem}`,
            conteudo: conteudoLimpo,
            ordem: tOrdem,
          }
        });
        
        tOrdem++;

        // Detect figures
        const figMatches = Array.from(conteudoLimpo.matchAll(figPattern));
        for (const fMatch of figMatches) {
          const refTexto = fMatch[0].replace(/[\(\)]/g, '').trim(); // Remove ()
          const nomeImagem = slugify(refTexto);
          const caminho = `/conteudo/imagens/${section.slug}/${nomeImagem}.png`;
          
          await prisma.imagemConteudo.create({
            data: {
              temaId: temaRecord.id,
              legenda: `${refTexto} referenciada em ${top.titulo}`,
              caminho: caminho,
              ordem: totalImagens++,
              refTexto: refTexto,
            }
          });
        }
      }
    }
  }

  console.log(`\nSeed finalizado com sucesso!`);
  console.log(`Total de imagens mapeadas: ${totalImagens}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
