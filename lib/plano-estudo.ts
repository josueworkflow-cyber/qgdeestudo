import { prisma } from "@/lib/prisma";

// ============================================================
// CONSTANTES
// ============================================================

const DIAS_SEMANA_PADRAO = [1, 2, 3, 4, 5, 6]; // Seg-Sáb (domingo descanso)

function getHorasDiaPadrao(metodoSlug: string): number {
  switch (metodoSlug) {
    case "doutrina": return 5;
    case "combate": return 3;
    case "operativo": return 4;
    default: return 3;
  }
}

// ============================================================
// TIPOS
// ============================================================

export type StatusCronograma = "ON_TRACK" | "TIGHT" | "LATE" | "INSUFFICIENT";

export interface DadosPlanoEstudo {
  plano: {
    id: string;
    metodoNome: string;
    metodoSlug: string;
    metodoDescricao: string;
    dataInicio: Date;
    status: StatusCronograma;
    horasDia: number | null;
    diasSemana: number[];
    estudaFds: boolean;
    dataProva: Date | null;
    previsaoConclusao: Date | null;
    minutosConteudo: number | null;
    minutosFlashcards: number | null;
    minutosQuestoes: number | null;
    minutosSimulado: number | null;
    metodoPesos: {
      conteudoNovo: number;
      revisaoFlashcards: number;
      questoes: number;
      revisaoErros: number;
    };
  };
  ciclo: {
    numero: number;
    status: string;
    dataInicio: Date;
    progresso: number;
    conteudosVistos: number;
    totalConteudos: number;
    flashcardsVistos: number;
    totalFlashcards: number;
    acertos: number;
    erros: number;
    taxaAcerto: number;
  } | null;
  missao: {
    id: string;
    data: Date;
    concluida: boolean;
    conteudosParaEstudar: string[];
    revisoesParaFazer: string[];
    flashcardsParaFazer: string[];
    questoesParaFazer: number;
    simuladoParaFazer: boolean;
    errosParaRevisar: string[];
    tarefas: {
      id: string;
      tipo: string;
      recursoId: string | null;
      descricao: string;
      concluida: boolean;
    }[];
  } | null;
  cronogramaSemanal: {
    dia: string;
    data: Date;
    tarefas: { tipo: string; descricao: string }[];
  }[];
  revisoesProgramadas: {
    id: string;
    temaId: string;
    nomeTema: string;
    dataRevisao: Date;
    intervalo: string;
    concluida: boolean;
  }[];
  topicosCriticos: {
    id: string;
    temaId: string;
    nome: string;
    totalErros: number;
    taxaAcerto: number;
    nivel: string;
  }[];
  historicoCiclos: {
    numeroCiclo: number;
    metodoNome: string;
    dataInicio: Date;
    dataFim: Date;
    conteudosVistos: number;
    flashcardsVistos: number;
    questoesRealizadas: number;
    taxaAcerto: number;
  }[];
  progressoGeral: {
    percentualEstudado: number;
    percentualRevisado: number;
    flashcardsConcluidos: number;
    questoesRealizadas: number;
  };
}

// ============================================================
// INTERVALOS DE REVISÃO
// ============================================================

const INTERVALOS_REVISAO = [
  { label: "24h", horas: 24 },
  { label: "3d", horas: 72 },
  { label: "7d", horas: 168 },
  { label: "15d", horas: 360 },
  { label: "30d", horas: 720 },
];

// ============================================================
// DISTRIBUIÇÕES POR CICLO
// ============================================================

function getDistribuicaoCiclo(metodo: { pesoConteudoNovo: number; pesoRevisaoFlashcards: number; pesoQuestoes: number; pesoRevisaoErros: number }, numeroCiclo: number) {
  let multConteudoNovo: number;
  let multRevisao: number;
  let multQuestoes: number;
  let multErros: number;

  switch (numeroCiclo) {
    case 1:
      multConteudoNovo = 1.3;
      multRevisao = 0.8;
      multQuestoes = 0.6;
      multErros = 0.5;
      break;
    case 2:
      multConteudoNovo = 0.7;
      multRevisao = 1.2;
      multQuestoes = 1.1;
      multErros = 1.0;
      break;
    case 3:
      multConteudoNovo = 0.4;
      multRevisao = 1.3;
      multQuestoes = 1.3;
      multErros = 1.5;
      break;
    default:
      multConteudoNovo = 0.2;
      multRevisao = 1.5;
      multQuestoes = 1.4;
      multErros = 1.8;
      break;
  }

  const rawNovo = metodo.pesoConteudoNovo * multConteudoNovo;
  const rawRevisao = metodo.pesoRevisaoFlashcards * multRevisao;
  const rawQuestoes = metodo.pesoQuestoes * multQuestoes;
  const rawErros = metodo.pesoRevisaoErros * multErros;
  const total = rawNovo + rawRevisao + rawQuestoes + rawErros;

  return {
    conteudoNovo: Math.round((rawNovo / total) * 100),
    revisaoFlashcards: Math.round((rawRevisao / total) * 100),
    questoes: Math.round((rawQuestoes / total) * 100),
    revisaoErros: Math.round((rawErros / total) * 100),
  };
}

// ============================================================
// CÁLCULO DE STATUS DO CRONOGRAMA
// ============================================================

export function calcularStatus(
  totalConteudos: number,
  conteudosVistos: number,
  horasDisponiveisDia: number,
  diasDisponiveisSemana: number,
  diasAteProva: number | null
): StatusCronograma {
  if (!diasAteProva) return "ON_TRACK";

  const faltantes = totalConteudos - conteudosVistos;
  if (faltantes <= 0) return "ON_TRACK";

  const horasPorSemana = horasDisponiveisDia * diasDisponiveisSemana;
  const conteudosPorHora = 0.5;
  const conteudosPorSemana = horasPorSemana * conteudosPorHora;
  const semanasRestantes = diasAteProva / 7;
  const capacidade = conteudosPorSemana * semanasRestantes;

  if (capacidade >= faltantes * 1.2) return "ON_TRACK";
  if (capacidade >= faltantes) return "TIGHT";
  if (capacidade >= faltantes * 0.6) return "LATE";
  return "INSUFFICIENT";
}

export function getStatusMessage(status: StatusCronograma): string {
  switch (status) {
    case "ON_TRACK":
      return "Com esse ritmo, você consegue concluir todo o conteúdo antes da prova.";
    case "TIGHT":
      return "Seu cronograma está apertado. Será necessário manter constância.";
    case "LATE":
      return "Seu ritmo está abaixo do necessário. Considere aumentar a carga horária.";
    case "INSUFFICIENT":
      return "Com essa carga horária, talvez você não consiga concluir todo o conteúdo até a prova.";
  }
}

// ============================================================
// INICIALIZAÇÃO DO PLANO
// ============================================================

export async function inicializarPlano(usuarioId: string, metodoSlug: string) {
  const metodo = await prisma.metodoEstudo.findUnique({ where: { slug: metodoSlug } });
  if (!metodo) throw new Error(`Método ${metodoSlug} não encontrado`);

  const existente = await prisma.planoEstudo.findUnique({ where: { usuarioId } });
  if (existente) throw new Error("Usuário já possui um plano de estudo");

  const totalTemas = await prisma.tema.count();
  const totalFlashcards = await prisma.flashcard.count();

  const plano = await prisma.planoEstudo.create({
    data: {
      usuarioId,
      metodoId: metodo.id,
      dataInicio: new Date(),
      status: "ON_TRACK",
      horasDia: metodoSlug !== "sobrevivencia" ? getHorasDiaPadrao(metodoSlug) : null,
      diasSemana: metodoSlug !== "sobrevivencia" ? DIAS_SEMANA_PADRAO : [1, 2, 3, 4, 5],
      ciclos: {
        create: {
          numero: 1,
          status: "EM_ANDAMENTO",
          totalConteudos: totalTemas,
          totalFlashcards,
        },
      },
    },
    include: { ciclos: true },
  });

  await gerarMissaoDiaria(plano.id, plano.ciclos[0].id, metodo);
  await gerarCronogramaSemanal(plano.id, metodo);

  return plano;
}

// ============================================================
// TROCA DE MÉTODO
// ============================================================

export async function trocarMetodo(usuarioId: string, metodoSlug: string) {
  const metodo = await prisma.metodoEstudo.findUnique({ where: { slug: metodoSlug } });
  if (!metodo) throw new Error(`Método ${metodoSlug} não encontrado`);

  const plano = await prisma.planoEstudo.findUnique({
    where: { usuarioId },
    include: { metodo: { select: { slug: true } } },
  });
  if (!plano) throw new Error("Plano não encontrado");

  // Se está saindo do sobrevivência, limpar campos customizados
  // Se está indo para outro método, aplicar horas/dias padrão
  const saindoSobrevivencia = plano.metodo.slug === "sobrevivencia" && metodoSlug !== "sobrevivencia";
  const mudandoEntreNaoSobrevivencia = plano.metodo.slug !== "sobrevivencia" && metodoSlug !== "sobrevivencia";

  await prisma.planoEstudo.update({
    where: { id: plano.id },
    data: {
      metodoId: metodo.id,
      ...(saindoSobrevivencia ? {
        dataProva: null,
        minutosConteudo: null,
        minutosFlashcards: null,
        minutosQuestoes: null,
        minutosSimulado: null,
        horasDia: getHorasDiaPadrao(metodoSlug),
        diasSemana: DIAS_SEMANA_PADRAO,
      } : {}),
      ...(mudandoEntreNaoSobrevivencia ? {
        horasDia: plano.horasDia || getHorasDiaPadrao(metodoSlug),
        diasSemana: plano.diasSemana.length > 0 ? plano.diasSemana : DIAS_SEMANA_PADRAO,
      } : {}),
    },
  });

  await prisma.missaoDiaria.deleteMany({ where: { planoId: plano.id } });
  await prisma.revisaoProgramada.deleteMany({ where: { planoId: plano.id } });

  const cicloAtual = await prisma.cicloEstudo.findFirst({
    where: { planoId: plano.id, status: "EM_ANDAMENTO" },
  });

  if (cicloAtual) {
    await gerarMissaoDiaria(plano.id, cicloAtual.id, metodo);
  }
}

// ============================================================
// ATUALIZAR MODO SOBREVIVÊNCIA
// ============================================================

export async function atualizarSobrevivencia(
  usuarioId: string,
  settings: {
    horasDia: number;
    diasSemana: number[];
    estudaFds: boolean;
    dataProva: string;
    minutosConteudo: number;
    minutosFlashcards: number;
    minutosQuestoes: number;
    minutosSimulado: number;
  }
) {
  const plano = await prisma.planoEstudo.findUnique({ where: { usuarioId } });
  if (!plano) throw new Error("Plano não encontrado");

  const totalTemas = await prisma.tema.count();
  const progresso = await prisma.progresso.count({
    where: { usuarioId, lido: true },
  });

  const dataProva = new Date(settings.dataProva);
  const hoje = new Date();
  const diasAteProva = Math.ceil((dataProva.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  const status = calcularStatus(
    totalTemas,
    progresso,
    settings.horasDia,
    settings.diasSemana.length,
    diasAteProva
  );

  // Calcular previsão de conclusão do ciclo
  const faltantes = totalTemas - progresso;
  const minutosPorDia = settings.minutosConteudo;
  const MINUTOS_POR_TEMA = 20;
  const temasPorDia = minutosPorDia > 0 ? minutosPorDia / MINUTOS_POR_TEMA : 0;
  const diasEstudoPorSemana = settings.diasSemana.length;
  const temasPorSemana = temasPorDia * diasEstudoPorSemana;
  const semanasRestantes = temasPorSemana > 0 ? Math.ceil(faltantes / temasPorSemana) : 0;
  const previsao = new Date(hoje);
  previsao.setDate(previsao.getDate() + semanasRestantes * 7);

  return prisma.planoEstudo.update({
    where: { id: plano.id },
    data: {
      horasDia: settings.horasDia,
      diasSemana: settings.diasSemana,
      estudaFds: settings.estudaFds,
      dataProva,
      status,
      previsaoConclusao: previsao,
      minutosConteudo: settings.minutosConteudo,
      minutosFlashcards: settings.minutosFlashcards,
      minutosQuestoes: settings.minutosQuestoes,
      minutosSimulado: settings.minutosSimulado,
    },
    include: { metodo: true },
  }).then(async (planoAtualizado) => {
    // Regenerar missão com os novos valores
    await prisma.missaoDiaria.deleteMany({ where: { planoId: plano.id } });
    const cicloAtivo = await prisma.cicloEstudo.findFirst({
      where: { planoId: plano.id, status: "EM_ANDAMENTO" },
    });
    if (cicloAtivo) {
      await gerarMissaoDiaria(plano.id, cicloAtivo.id, planoAtualizado.metodo);
    }
    return planoAtualizado;
  });
}

// ============================================================
// ATUALIZAR CONFIGURAÇÃO GERAL (HORAS/DIA + DIAS DE ESTUDO)
// ============================================================

export async function atualizarConfigHoras(
  usuarioId: string,
  settings: { horasDia: number; diasSemana: number[] }
) {
  const plano = await prisma.planoEstudo.findUnique({ where: { usuarioId }, include: { metodo: true } });
  if (!plano) throw new Error("Plano não encontrado");

  await prisma.planoEstudo.update({
    where: { id: plano.id },
    data: {
      horasDia: settings.horasDia,
      diasSemana: settings.diasSemana,
    },
  });

  await prisma.missaoDiaria.deleteMany({ where: { planoId: plano.id } });
  const cicloAtivo = await prisma.cicloEstudo.findFirst({
    where: { planoId: plano.id, status: "EM_ANDAMENTO" },
  });
  if (cicloAtivo) {
    await gerarMissaoDiaria(plano.id, cicloAtivo.id, plano.metodo);
  }

  return plano;
}

// ============================================================
// GERAÇÃO DE MISSÃO DIÁRIA
// ============================================================

export async function gerarMissaoDiaria(
  planoId: string,
  cicloId: string,
  metodo: { id: string; pesoConteudoNovo: number; pesoRevisaoFlashcards: number; pesoQuestoes: number; pesoRevisaoErros: number; slug: string }
) {
  const plano = await prisma.planoEstudo.findUnique({
    where: { id: planoId },
    include: {
      ciclos: { where: { status: "EM_ANDAMENTO" } },
    },
  });
  if (!plano) throw new Error("Plano não encontrado");

  const ciclo = plano.ciclos[0];
  if (!ciclo) throw new Error("Ciclo ativo não encontrado");

  const dist = getDistribuicaoCiclo(metodo, ciclo.numero);

  // Verificar se hoje é dia de descanso
  const hojeDiaSemana = new Date().getDay();
  const diaDescanso = plano.diasSemana.length > 0 && !plano.diasSemana.includes(hojeDiaSemana);

  if (diaDescanso) {
    const missaoDescanso = await prisma.missaoDiaria.create({
      data: {
        planoId,
        data: new Date(),
        conteudosParaEstudar: [],
        revisoesParaFazer: [],
        flashcardsParaFazer: [],
        questoesParaFazer: 0,
        simuladoParaFazer: false,
        errosParaRevisar: [],
        concluida: true,
      },
    });
    return missaoDescanso;
  }

  const MINUTOS_POR_TEMA = 20;
  const MINUTOS_POR_FLASHCARD = 1.5;
  const MINUTOS_POR_QUESTAO = 2.5;

  let temasPorDia: number;
  let flashcardsPorDia: number;
  let questoesPorDia: number;

  // Sobrevivência com configuração customizada de minutos
  if (metodo.slug === "sobrevivencia" && plano.minutosConteudo != null) {
    temasPorDia = Math.max(0, Math.round(plano.minutosConteudo / MINUTOS_POR_TEMA));
    flashcardsPorDia = Math.max(0, Math.round((plano.minutosFlashcards || 0) / MINUTOS_POR_FLASHCARD));
    questoesPorDia = Math.max(0, Math.round((plano.minutosQuestoes || 0) / MINUTOS_POR_QUESTAO));
  } else {
    // Métodos normais: distribuição percentual
    const horasDisponiveis = plano.horasDia || getHorasDiaPadrao(metodo.slug);
    const minutosDisponiveis = horasDisponiveis * 60;
    temasPorDia = Math.max(1, Math.round((minutosDisponiveis * (dist.conteudoNovo / 100)) / MINUTOS_POR_TEMA));
    flashcardsPorDia = Math.max(5, Math.round((minutosDisponiveis * (dist.revisaoFlashcards / 100)) / MINUTOS_POR_FLASHCARD));
    questoesPorDia = Math.max(5, Math.round((minutosDisponiveis * (dist.questoes / 100)) / MINUTOS_POR_QUESTAO));
  }

  // Buscar temas ainda não estudados
  const temasEstudados = await prisma.progresso.findMany({
    where: { usuarioId: plano.usuarioId, lido: true },
    select: { temaId: true },
  });
  const temasEstudadosIds = temasEstudados.map((t) => t.temaId);

  // Conteúdo novo intercalado: pegar da matéria com menor progresso relativo
  const todasMaterias = await prisma.materia.findMany({
    orderBy: { ordem: "asc" },
    include: {
      temas: {
        where: { id: { notIn: temasEstudadosIds.length > 0 ? temasEstudadosIds : ["none"] } },
        orderBy: { ordem: "asc" },
        include: { materia: true },
      },
    },
  });

  // Calcular progresso por matéria para decidir qual estudar
  const totalPorMateria = await prisma.tema.groupBy({
    by: ["materiaId"],
    _count: { id: true },
  });
  const estudadosPorMateria = new Map<string, number>();
  for (const p of temasEstudados) {
    const tema = await prisma.tema.findUnique({ where: { id: p.temaId }, select: { materiaId: true } });
    if (tema) {
      estudadosPorMateria.set(tema.materiaId, (estudadosPorMateria.get(tema.materiaId) || 0) + 1);
    }
  }

  // Ordenar matérias pela menor % de conclusão
  const materiasOrdenadas = todasMaterias
    .filter(m => m.temas.length > 0)
    .map(m => {
      const total = totalPorMateria.find(t => t.materiaId === m.id)?._count.id || m.temas.length;
      const estudados = estudadosPorMateria.get(m.id) || 0;
      const pct = total > 0 ? estudados / total : 0;
      return { materia: m, pct, pendentes: m.temas };
    })
    .sort((a, b) => a.pct - b.pct);

  // Pegar temas da matéria menos avançada
  let conteudosNovos: any[] = [];
  let materiaSelecionada: typeof todasMaterias[number] | null = null;

  for (const item of materiasOrdenadas) {
    if (item.pendentes.length > 0) {
      materiaSelecionada = item.materia;
      conteudosNovos = item.pendentes.slice(0, temasPorDia);
      break;
    }
  }

  // Se não achou matéria pendente, fallback
  if (conteudosNovos.length === 0 && temasPorDia > 0) {
    conteudosNovos = await prisma.tema.findMany({
      where: { id: { notIn: temasEstudadosIds.length > 0 ? temasEstudadosIds : ["none"] } },
      include: { materia: true },
      orderBy: [{ materia: { ordem: "asc" } }, { ordem: "asc" }],
      take: temasPorDia,
    });
  }

  // Flashcards pendentes
  const flashcards = await prisma.flashcard.findMany({
    where: {
      temaId: { notIn: temasEstudadosIds.length > 0 ? temasEstudadosIds : ["none"] },
    },
    take: flashcardsPorDia,
  });

  // Revisões do dia
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  const revisoesHoje = await prisma.revisaoProgramada.findMany({
    where: {
      planoId,
      dataRevisao: { gte: hoje, lt: amanha },
      concluida: false,
    },
  });

  // Erros do usuário (simulados recentes)
  const errosRecentes = await prisma.resposta.findMany({
    where: {
      resultado: { usuarioId: plano.usuarioId },
      correta: false,
    },
    include: { questao: { include: { tema: true } } },
    orderBy: { resultado: { criadoEm: "desc" } },
    take: 5,
  });

  const errosTemaIds = [...new Set(errosRecentes.map((e) => e.questao.temaId))];

  // Criar missão
  const missao = await prisma.missaoDiaria.create({
    data: {
      planoId,
      data: new Date(),
      conteudosParaEstudar: conteudosNovos.map((c) => c.id),
      revisoesParaFazer: revisoesHoje.map((r) => r.temaId),
      flashcardsParaFazer: flashcards.map((f) => f.id),
      questoesParaFazer: questoesPorDia,
      simuladoParaFazer: metodo.slug === "sobrevivencia"
        ? (plano.minutosSimulado || 0) > 0
        : dist.questoes >= 25 && ciclo.numero >= 2,
      errosParaRevisar: errosTemaIds,
    },
  });

  // Criar tarefas detalhadas
  const tarefas: { missaoId: string; tipo: string; recursoId: string | null; descricao: string }[] = [];

  // Agrupar conteúdos novos por matéria
  const conteudosPorMateria = new Map<string, { materiaNome: string; temas: typeof conteudosNovos }>();
  for (const c of conteudosNovos) {
    const key = c.materia.id;
    if (!conteudosPorMateria.has(key)) {
      conteudosPorMateria.set(key, { materiaNome: c.materia.nome, temas: [] });
    }
    conteudosPorMateria.get(key)!.temas.push(c);
  }

  for (const [materiaId, grupo] of conteudosPorMateria) {
    const tempoEstimado = grupo.temas.length * MINUTOS_POR_TEMA;
    tarefas.push({
      missaoId: missao.id,
      tipo: "CONTEUDO",
      recursoId: grupo.temas[0].id,
      descricao: `Estudar: ${grupo.materiaNome} · ${tempoEstimado} min`,
    });
  }

  for (const revisao of revisoesHoje) {
    tarefas.push({
      missaoId: missao.id,
      tipo: "REVISAO",
      recursoId: revisao.temaId,
      descricao: `Revisar tema (${revisao.intervalo})`,
    });
  }

  if (flashcards.length > 0) {
    const minutosFlash = Math.round(flashcards.length * MINUTOS_POR_FLASHCARD);
    tarefas.push({
      missaoId: missao.id,
      tipo: "FLASHCARD",
      recursoId: null,
      descricao: `Revisar ${flashcards.length} flashcards · ${minutosFlash} min`,
    });
  }

  if (missao.questoesParaFazer > 0) {
    const minutosQuest = Math.round(missao.questoesParaFazer * MINUTOS_POR_QUESTAO);
    tarefas.push({
      missaoId: missao.id,
      tipo: "QUESTAO",
      recursoId: null,
      descricao: `Resolver ${missao.questoesParaFazer} questões · ${minutosQuest} min`,
    });
  }

  if (missao.simuladoParaFazer) {
    tarefas.push({
      missaoId: missao.id,
      tipo: "SIMULADO",
      recursoId: null,
      descricao: "Realizar simulado diagnóstico",
    });
  }

  if (errosTemaIds.length > 0) {
    tarefas.push({
      missaoId: missao.id,
      tipo: "REVISAO_ERRO",
      recursoId: errosTemaIds[0],
      descricao: "Revisar temas com erros recentes",
    });
  }

  if (tarefas.length > 0) {
    await prisma.tarefaEstudo.createMany({ data: tarefas });
  }

  return missao;
}

// ============================================================
// GERAÇÃO DE CRONOGRAMA SEMANAL
// ============================================================

export async function gerarCronogramaSemanal(
  planoId: string,
  metodo: { slug: string; pesoConteudoNovo: number; pesoRevisaoFlashcards: number; pesoQuestoes: number; pesoRevisaoErros: number }
) {
  const plano = await prisma.planoEstudo.findUnique({
    where: { id: planoId },
    include: {
      ciclos: { where: { status: "EM_ANDAMENTO" } },
    },
  });
  if (!plano) return [];

  const ciclo = plano.ciclos[0];
  const dist = getDistribuicaoCiclo(metodo, ciclo?.numero || 1);

  const MINUTOS_POR_TEMA = 20;
  let temasPorDia: number;

  if (metodo.slug === "sobrevivencia" && plano.minutosConteudo != null) {
    temasPorDia = Math.max(0, Math.round(plano.minutosConteudo / MINUTOS_POR_TEMA));
  } else {
    const horasDisponiveis = plano.horasDia || getHorasDiaPadrao(metodo.slug);
    temasPorDia = Math.max(1, Math.round((horasDisponiveis * 60 * (dist.conteudoNovo / 100)) / MINUTOS_POR_TEMA));
  }

  // Buscar temas pendentes
  const temasEstudados = await prisma.progresso.findMany({
    where: { usuarioId: plano.usuarioId, lido: true },
    select: { temaId: true },
  });
  const temasEstudadosIds = temasEstudados.map((t) => t.temaId);

  const pendentes = await prisma.tema.findMany({
    where: { id: { notIn: temasEstudadosIds.length > 0 ? temasEstudadosIds : ["none"] } },
    include: { materia: { select: { nome: true } } },
    orderBy: [{ materia: { ordem: "asc" } }, { ordem: "asc" }],
  });

  // Agrupar por matéria
  const pendentesPorMateria = new Map<string, { nome: string; temas: typeof pendentes }>();
  for (const t of pendentes) {
    if (!pendentesPorMateria.has(t.materiaId)) {
      pendentesPorMateria.set(t.materiaId, { nome: t.materia.nome, temas: [] });
    }
    pendentesPorMateria.get(t.materiaId)!.temas.push(t);
  }

  const materiasArray = Array.from(pendentesPorMateria.entries()).map(([id, g]) => ({
    id,
    nome: g.nome,
    totalTemas: g.temas.length,
  }));

  const diasSemana = plano.diasSemana.length > 0 ? plano.diasSemana : DIAS_SEMANA_PADRAO;
  const diasNomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());

  // Dias de estudo esta semana (todos, não só futuros)
  const diasEstudoEstaSemana: { idx: number; data: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    const data = new Date(inicioSemana);
    data.setDate(inicioSemana.getDate() + i);
    const diaSemana = data.getDay();
    if (diasSemana.includes(diaSemana)) {
      diasEstudoEstaSemana.push({ idx: i, data });
    }
  }

  // Construir pool intercalado de matérias
  const totalPendentes = materiasArray.reduce((s, m) => s + m.totalTemas, 0);
  const pool: string[] = [];

  if (totalPendentes > 0 && diasEstudoEstaSemana.length > 0) {
    const topicosPorSlot = new Map<string, number>();
    let slotsRestantes = 0;

    for (const m of materiasArray) {
      const alocacao = Math.max(1, Math.round((m.totalTemas / totalPendentes) * diasEstudoEstaSemana.length));
      topicosPorSlot.set(m.id, alocacao);
      slotsRestantes += alocacao;
    }

    // Ajustar para caber nos dias disponíveis
    if (slotsRestantes > diasEstudoEstaSemana.length) {
      const excesso = slotsRestantes - diasEstudoEstaSemana.length;
      const sorted = [...materiasArray].sort((a, b) => (topicosPorSlot.get(b.id)!) - (topicosPorSlot.get(a.id)!));
      for (let e = 0; e < excesso; e++) {
        const idx = e % sorted.length;
        topicosPorSlot.set(sorted[idx].id, Math.max(1, topicosPorSlot.get(sorted[idx].id)! - 1));
      }
    }

    // Criar pool intercalado (round-robin)
    const fila: { id: string; count: number }[] = materiasArray.map(m => ({
      id: m.id,
      count: topicosPorSlot.get(m.id) || 0,
    })).filter(f => f.count > 0);

    while (pool.length < diasEstudoEstaSemana.length) {
      let added = false;
      for (const f of fila) {
        if (f.count > 0 && pool.length < diasEstudoEstaSemana.length) {
          pool.push(f.id);
          f.count--;
          added = true;
        }
      }
      if (!added) break;
    }
  }

  const cronograma: { dia: string; data: Date; tarefas: { tipo: string; descricao: string }[] }[] = [];
  const materiasMap = new Map(materiasArray.map(m => [m.id, m]));

  for (let i = 0; i < 7; i++) {
    const data = new Date(inicioSemana);
    data.setDate(inicioSemana.getDate() + i);
    const diaSemana = data.getDay();

    if (!diasSemana.includes(diaSemana)) {
      cronograma.push({ dia: diasNomes[diaSemana], data, tarefas: [] });
      continue;
    }

    const tarefas: { tipo: string; descricao: string }[] = [];

    // Pegar matéria do pool intercalado
    const diaIdx = diasEstudoEstaSemana.findIndex(d => d.idx === i);
    if (diaIdx >= 0 && diaIdx < pool.length && temasPorDia > 0) {
      const materiaId = pool[diaIdx];
      const materia = materiasMap.get(materiaId);
      if (materia) {
        tarefas.push({
          tipo: "CONTEUDO",
          descricao: `Estudar: ${materia.nome} · ${temasPorDia * MINUTOS_POR_TEMA} min`,
        });
      }
    }

    // Demais atividades
    if (metodo.slug === "combate") {
      tarefas.push({ tipo: "QUESTAO", descricao: "Questões e simulados" });
      tarefas.push({ tipo: "REVISAO_ERRO", descricao: "Revisão de erros" });
    } else if (metodo.slug === "doutrina" || metodo.slug === "sobrevivencia") {
      tarefas.push({ tipo: "REVISAO", descricao: "Revisão espaçada" });
      tarefas.push({ tipo: "FLASHCARD", descricao: "Flashcards de memorização" });
    } else {
      tarefas.push({ tipo: "FLASHCARD", descricao: "Flashcards de matérias recentes" });
      tarefas.push({ tipo: "QUESTAO", descricao: "Questões de matérias alternadas" });
    }

    cronograma.push({ dia: diasNomes[diaSemana], data, tarefas });
  }

  return cronograma;
}

// ============================================================
// COMPLETAR TAREFA
// ============================================================

export async function concluirTarefa(tarefaId: string) {
  const tarefa = await prisma.tarefaEstudo.update({
    where: { id: tarefaId },
    data: { concluida: true, concluidaEm: new Date() },
    include: { missao: { include: { plano: true } } },
  });

  // Se for conteúdo novo, marcar todos os temas do dia como lidos
  if (tarefa.tipo === "CONTEUDO" && tarefa.missao.conteudosParaEstudar.length > 0) {
    const usuarioId = tarefa.missao.plano.usuarioId;

    for (const temaId of tarefa.missao.conteudosParaEstudar) {
      await prisma.progresso.upsert({
        where: {
          usuarioId_temaId: { usuarioId, temaId },
        },
        update: { lido: true, lidoEm: new Date() },
        create: { usuarioId, temaId, lido: true, lidoEm: new Date() },
      });

      // Criar revisões programadas
      for (const intervalo of INTERVALOS_REVISAO) {
        const dataRevisao = new Date();
        dataRevisao.setHours(dataRevisao.getHours() + intervalo.horas);

        await prisma.revisaoProgramada.create({
          data: {
            planoId: tarefa.missao.planoId,
            temaId,
            dataRevisao,
            intervalo: intervalo.label,
          },
        });
      }
    }

    await prisma.cicloEstudo.updateMany({
      where: { planoId: tarefa.missao.planoId, status: "EM_ANDAMENTO" },
      data: { conteudosVistos: { increment: tarefa.missao.conteudosParaEstudar.length } },
    });
  }

  // Verificar conclusão da missão
  const todasTarefas = await prisma.tarefaEstudo.count({
    where: { missaoId: tarefa.missaoId },
  });
  const tarefasConcluidas = await prisma.tarefaEstudo.count({
    where: { missaoId: tarefa.missaoId, concluida: true },
  });

  if (todasTarefas === tarefasConcluidas) {
    await prisma.missaoDiaria.update({
      where: { id: tarefa.missaoId },
      data: { concluida: true },
    });
  }

  return tarefa;
}

// ============================================================
// FINALIZAR CICLO
// ============================================================

export async function finalizarCiclo(usuarioId: string) {
  const plano = await prisma.planoEstudo.findUnique({
    where: { usuarioId },
    include: {
      metodo: true,
      ciclos: { where: { status: "EM_ANDAMENTO" }, orderBy: { numero: "desc" }, take: 1 },
    },
  });
  if (!plano) throw new Error("Plano não encontrado");

  const cicloAtual = plano.ciclos[0];
  if (!cicloAtual) throw new Error("Nenhum ciclo em andamento");

  const totalTemas = await prisma.tema.count();
  const totalFlashcards = await prisma.flashcard.count();

  // Calcular progresso real do ciclo
  const progressoUsuario = await prisma.progresso.count({
    where: { usuarioId, lido: true },
  });

  const taxaAcerto = cicloAtual.totalQuestoes > 0
    ? (cicloAtual.acertos / cicloAtual.totalQuestoes) * 100
    : 0;

  const topicosCriticos = await prisma.topicoCritico.findMany({
    where: { planoId: plano.id },
    orderBy: { totalErros: "desc" },
    take: 10,
  });

  // Finalizar ciclo atual
  const cicloFinalizado = await prisma.cicloEstudo.update({
    where: { id: cicloAtual.id },
    data: {
      status: "CONCLUIDO",
      dataConclusao: new Date(),
      conteudosVistos: progressoUsuario,
      totalConteudos: totalTemas,
      taxaAcerto,
    },
  });

  // Criar histórico
  await prisma.historicoCiclo.create({
    data: {
      cicloId: cicloAtual.id,
      usuarioId,
      metodoNome: plano.metodo.nome,
      numeroCiclo: cicloAtual.numero,
      dataInicio: cicloAtual.dataInicio,
      dataFim: new Date(),
      conteudosVistos: progressoUsuario,
      flashcardsVistos: cicloAtual.flashcardsVistos,
      questoesRealizadas: cicloAtual.totalQuestoes,
      taxaAcerto,
      temasCriticos: topicosCriticos.map((t) => ({ nome: t.nome, totalErros: t.totalErros, taxaAcerto: t.taxaAcerto })),
    },
  });

  // Criar novo ciclo
  await prisma.cicloEstudo.create({
    data: {
      planoId: plano.id,
      numero: cicloAtual.numero + 1,
      status: "EM_ANDAMENTO",
      totalConteudos: totalTemas,
      totalFlashcards,
      dataInicio: new Date(),
    },
  });

  // Gerar nova missão
  await prisma.missaoDiaria.deleteMany({ where: { planoId: plano.id } });
  const novoCiclo = await prisma.cicloEstudo.findFirst({
    where: { planoId: plano.id, status: "EM_ANDAMENTO" },
  });

  if (novoCiclo) {
    await gerarMissaoDiaria(plano.id, novoCiclo.id, plano.metodo);
  }

  return cicloFinalizado;
}

// ============================================================
// VERIFICAR CONCLUSÃO DO CICLO
// ============================================================

export async function verificarEAtualizarCiclo(usuarioId: string) {
  const plano = await prisma.planoEstudo.findUnique({
    where: { usuarioId },
    include: { metodo: true },
  });
  if (!plano) return null;

  const totalTemas = await prisma.tema.count();
  const progresso = await prisma.progresso.count({
    where: { usuarioId, lido: true },
  });

  // Se 100% concluído, finalizar ciclo automaticamente
  if (totalTemas > 0 && progresso >= totalTemas) {
    return finalizarCiclo(usuarioId);
  }

  return null;
}

// ============================================================
// BUSCAR DADOS COMPLETOS DO PLANO
// ============================================================

export async function buscarDadosPlano(usuarioId: string): Promise<DadosPlanoEstudo> {
  let plano = await prisma.planoEstudo.findUnique({
    where: { usuarioId },
    include: {
      metodo: true,
      ciclos: { orderBy: { numero: "desc" } },
    },
  });

  if (!plano) {
    try {
      const novoPlano = await inicializarPlano(usuarioId, "doutrina");
      plano = await prisma.planoEstudo.findUnique({
        where: { id: novoPlano.id },
        include: {
          metodo: true,
          ciclos: { orderBy: { numero: "desc" } },
        },
      });
    } catch {
      throw new Error("Não foi possível criar o plano de estudo. Verifique se o usuário está cadastrado.");
    }
  }

  if (!plano) throw new Error("Falha ao carregar plano");

  const cicloAtual = plano.ciclos.find((c) => c.status === "EM_ANDAMENTO") || null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  let missao = await prisma.missaoDiaria.findFirst({
    where: {
      planoId: plano.id,
      data: { gte: hoje, lt: amanha },
    },
    include: { tarefas: true },
  });

  if (!missao) {
    const novaMissao = await gerarMissaoDiaria(plano.id, cicloAtual?.id || plano.ciclos[0]?.id || "", plano.metodo);
    missao = await prisma.missaoDiaria.findUnique({
      where: { id: novaMissao.id },
      include: { tarefas: true },
    });
  } else {
    const hojeSemana = new Date().getDay();
    const ehDiaDescanso = plano.diasSemana.length > 0 && !plano.diasSemana.includes(hojeSemana);

    if (ehDiaDescanso) {
    // Não é dia de estudo: substituir missão existente por descanso
    await prisma.tarefaEstudo.deleteMany({ where: { missaoId: missao.id } });
    await prisma.missaoDiaria.update({
      where: { id: missao.id },
      data: {
        concluida: true,
        conteudosParaEstudar: [],
        revisoesParaFazer: [],
        flashcardsParaFazer: [],
        questoesParaFazer: 0,
        simuladoParaFazer: false,
        errosParaRevisar: [],
      },
    });
    missao = await prisma.missaoDiaria.findUnique({
      where: { id: missao.id },
      include: { tarefas: true },
    });
    }
  }

  const cronograma = await gerarCronogramaSemanal(plano.id, plano.metodo);

  const revisoes = await prisma.revisaoProgramada.findMany({
    where: { planoId: plano.id, concluida: false },
    orderBy: { dataRevisao: "asc" },
    take: 20,
    include: {
      plano: {
        include: {
          usuario: { select: { id: true } },
        },
      },
    },
  });

  // Buscar nomes dos temas para as revisões
  const temasRevisao = await prisma.tema.findMany({
    where: { id: { in: revisoes.map((r) => r.temaId) } },
    select: { id: true, titulo: true },
  });
  const temasMap = new Map(temasRevisao.map((t) => [t.id, t.titulo]));

  const topicosCriticos = await prisma.topicoCritico.findMany({
    where: { planoId: plano.id },
    orderBy: { totalErros: "desc" },
    take: 10,
  });

  const historico = await prisma.historicoCiclo.findMany({
    where: { usuarioId },
    orderBy: { numeroCiclo: "desc" },
    take: 10,
  });

  const totalTemas = await prisma.tema.count();
  const totalConteudosVistos = await prisma.progresso.count({
    where: { usuarioId, lido: true },
  });

  const totalFlashcards = await prisma.flashcard.count();
  const flashcardsVistos = await prisma.flashcardProgresso.count({
    where: { usuarioId },
  });

  return {
    plano: {
      id: plano.id,
      metodoNome: plano.metodo.nome,
      metodoSlug: plano.metodo.slug,
      metodoDescricao: plano.metodo.descricao,
      dataInicio: plano.dataInicio,
      status: plano.status as StatusCronograma,
      horasDia: plano.horasDia,
      diasSemana: plano.diasSemana,
      estudaFds: plano.estudaFds,
      dataProva: plano.dataProva,
      previsaoConclusao: plano.previsaoConclusao,
      minutosConteudo: plano.minutosConteudo,
      minutosFlashcards: plano.minutosFlashcards,
      minutosQuestoes: plano.minutosQuestoes,
      minutosSimulado: plano.minutosSimulado,
      metodoPesos: {
        conteudoNovo: plano.metodo.pesoConteudoNovo,
        revisaoFlashcards: plano.metodo.pesoRevisaoFlashcards,
        questoes: plano.metodo.pesoQuestoes,
        revisaoErros: plano.metodo.pesoRevisaoErros,
      },
    },
    ciclo: cicloAtual
      ? {
          numero: cicloAtual.numero,
          status: cicloAtual.status,
          dataInicio: cicloAtual.dataInicio,
          progresso: totalTemas > 0 ? Math.round((cicloAtual.conteudosVistos / totalTemas) * 100) : 0,
          conteudosVistos: cicloAtual.conteudosVistos,
          totalConteudos: cicloAtual.totalConteudos,
          flashcardsVistos: cicloAtual.flashcardsVistos,
          totalFlashcards: cicloAtual.totalFlashcards,
          acertos: cicloAtual.acertos,
          erros: cicloAtual.erros,
          taxaAcerto: cicloAtual.taxaAcerto || 0,
        }
      : null,
    missao: missao
      ? {
          id: missao.id,
          data: missao.data,
          concluida: missao.concluida,
          conteudosParaEstudar: missao.conteudosParaEstudar,
          revisoesParaFazer: missao.revisoesParaFazer,
          flashcardsParaFazer: missao.flashcardsParaFazer,
          questoesParaFazer: missao.questoesParaFazer,
          simuladoParaFazer: missao.simuladoParaFazer,
          errosParaRevisar: missao.errosParaRevisar,
          tarefas: missao.tarefas.map((t) => ({
            id: t.id,
            tipo: t.tipo,
            recursoId: t.recursoId,
            descricao: t.descricao,
            concluida: t.concluida,
          })),
        }
      : null,
    cronogramaSemanal: cronograma,
    revisoesProgramadas: revisoes.map((r) => ({
      id: r.id,
      temaId: r.temaId,
      nomeTema: temasMap.get(r.temaId) || "Tema",
      dataRevisao: r.dataRevisao,
      intervalo: r.intervalo,
      concluida: r.concluida,
    })),
    topicosCriticos: topicosCriticos.map((t) => ({
      id: t.id,
      temaId: t.temaId,
      nome: t.nome,
      totalErros: t.totalErros,
      taxaAcerto: t.taxaAcerto,
      nivel: t.nivel,
    })),
    historicoCiclos: historico.map((h) => ({
      numeroCiclo: h.numeroCiclo,
      metodoNome: h.metodoNome,
      dataInicio: h.dataInicio,
      dataFim: h.dataFim,
      conteudosVistos: h.conteudosVistos,
      flashcardsVistos: h.flashcardsVistos,
      questoesRealizadas: h.questoesRealizadas,
      taxaAcerto: h.taxaAcerto,
    })),
    progressoGeral: {
      percentualEstudado: totalTemas > 0 ? Math.round((totalConteudosVistos / totalTemas) * 100) : 0,
      percentualRevisado: 0,
      flashcardsConcluidos: flashcardsVistos,
      questoesRealizadas: 0,
    },
  };
}
