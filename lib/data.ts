export const materias = [
  {
    nome: "Direito Militar",
    slug: "direito-militar",
    progresso: 42,
    temas: [
      {
        titulo: "Hierarquia e Disciplina",
        slug: "hierarquia-disciplina",
        topicos: [
          {
            titulo: "Fundamentos da Disciplina",
            slug: "fundamentos-disciplina",
            tempo: "18 min",
            conteudo:
              "A disciplina militar organiza condutas, deveres e responsabilidades. Para a promocao, o candidato precisa dominar conceitos, exemplos praticos e efeitos administrativos."
          },
          {
            titulo: "Cadeia de Comando",
            slug: "cadeia-comando",
            tempo: "14 min",
            conteudo:
              "A cadeia de comando define autoridade, comunicacao formal e fluxo decisorio. O estudo deve conectar norma, situacao operacional e resposta esperada."
          }
        ]
      }
    ]
  },
  {
    nome: "Administracao Militar",
    slug: "administracao-militar",
    progresso: 27,
    temas: [
      {
        titulo: "Rotina Operacional",
        slug: "rotina-operacional",
        topicos: [
          {
            titulo: "Planejamento de Servico",
            slug: "planejamento-servico",
            tempo: "20 min",
            conteudo:
              "Planejamento de servico exige previsao de recursos, controle de efetivo e registro objetivo das decisoes tomadas."
          }
        ]
      }
    ]
  },
  {
    nome: "Tecnicas Operacionais",
    slug: "tecnicas-operacionais",
    progresso: 61,
    temas: [
      {
        titulo: "Resposta Inicial",
        slug: "resposta-inicial",
        topicos: [
          {
            titulo: "Avaliacao de Cena",
            slug: "avaliacao-cena",
            tempo: "16 min",
            conteudo:
              "A avaliacao de cena prioriza seguranca, comunicacao e definicao rapida dos proximos passos operacionais."
          }
        ]
      }
    ]
  }
];

export const simulados = [
  {
    id: "simulado-mvp-01",
    titulo: "Diagnostico Operacional 01",
    tipo: "Completo",
    tempoLimite: 20,
    questoes: [
      {
        id: "q1",
        enunciado: "Qual principio sustenta a organizacao vertical da estrutura militar?",
        alternativas: {
          A: "Publicidade",
          B: "Hierarquia",
          C: "Economicidade",
          D: "Informalidade"
        },
        gabarito: "B",
        explicacao: "A hierarquia estrutura os niveis de autoridade e responsabilidade."
      },
      {
        id: "q2",
        enunciado: "A disciplina militar se relaciona principalmente com:",
        alternativas: {
          A: "Cumprimento de deveres e ordens legais",
          B: "Livre escolha de procedimentos",
          C: "Dispensa de formalidade",
          D: "Substituicao da cadeia de comando"
        },
        gabarito: "A",
        explicacao: "Disciplina envolve observancia de normas, deveres e ordens legais."
      }
    ]
  }
];

export const metricas = [
  { rotulo: "Progresso geral", valor: "43%", detalhe: "12 de 28 topicos" },
  { rotulo: "Horas estudadas", valor: "18h", detalhe: "esta semana" },
  { rotulo: "Media simulados", valor: "82%", detalhe: "+9% em 14 dias" },
  { rotulo: "Sequencia", valor: "6", detalhe: "dias ativos" }
];

export const metasDiarias = [
  { rotulo: "Leitura", alvo: "2 topicos", atual: "1 concluido", progresso: 50 },
  { rotulo: "Questoes", alvo: "20 questoes", atual: "14 respondidas", progresso: 70 },
  { rotulo: "Revisao", alvo: "10 flashcards", atual: "6 revisados", progresso: 60 }
];

export const desempenhoPorMateria = [
  { materia: "Direito Militar", acertos: 84, tendencia: "+6%" },
  { materia: "Administracao Militar", acertos: 71, tendencia: "+3%" },
  { materia: "Tecnicas Operacionais", acertos: 89, tendencia: "+11%" }
];

export const ranking = [
  { posicao: 1, nome: "Aluno Alfa", pontos: 1840, media: "91%", optIn: true },
  { posicao: 2, nome: "Aluno Bravo", pontos: 1725, media: "88%", optIn: true },
  { posicao: 3, nome: "Voce", pontos: 1590, media: "82%", optIn: false },
  { posicao: 4, nome: "Aluno Charlie", pontos: 1510, media: "79%", optIn: true }
];

export const planoEstudos = [
  { dia: "Hoje", foco: "Direito Militar", tarefa: "2 topicos + 10 questoes", carga: "55 min" },
  { dia: "Amanha", foco: "Tecnicas Operacionais", tarefa: "Flashcards + simulado curto", carga: "45 min" },
  { dia: "Dia 3", foco: "Administracao Militar", tarefa: "Revisao guiada", carga: "40 min" }
];

export const forumTopicos = [];
