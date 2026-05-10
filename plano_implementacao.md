# Plano de Implementação — QG de Estudo

---

## Stack definida

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (fullstack — API Routes + frontend no mesmo repo) |
| ORM | Prisma |
| Banco de dados | PostgreSQL |
| Autenticação | NextAuth.js (email e senha) |
| Hospedagem | VPS Hostinger + EasyPanel |
| Storage externo | Não utilizado — conteúdo estruturado no PostgreSQL |
| Desenvolvimento | Claude Code / Codex |
| Pagamentos | A definir (última fase) |

---

## Identidade visual — Tático/Utilitário Refinado

A plataforma é uma ferramenta profissional voltada a militares em processo de promoção. O design reflete isso: sério, denso e motivador — sem parecer um cursinho genérico.

### Direção estética

- **Tema:** dark por padrão
- **Paleta:** verde oliva e azul naval como base, âmbar/amarelo como accent principal
- **Tipografia:** fonte condensada bold para headings e títulos (ex: Barlow Condensed, Bebas Neue ou similar), fonte técnica legível para corpo de texto (ex: IBM Plex Sans, Roboto Mono para dados)
- **Layout:** denso e organizado, sem elementos decorativos desnecessários. Inspiração em dashboards de ferramentas profissionais (Linear, Vercel) com toque militar
- **Composição:** assimetria intencional, grids quebrados em pontos estratégicos, uso de bordas finas e divisores para separar zonas de informação
- **Motion:** micro-interações precisas — hover states sutis, transições de página rápidas (150–200ms), nenhuma animação decorativa. Um reveal staggered na entrada do dashboard é suficiente
- **Backgrounds:** textura grain muito sutil sobre dark surface, bordas com opacidade baixa, sem gradientes chamativos

### CSS variables do projeto

```css
:root {
  --color-bg:         #0d0f0e;
  --color-surface:    #141714;
  --color-surface-2:  #1c1f1c;
  --color-border:     rgba(255,255,255,0.08);
  --color-border-em:  rgba(255,255,255,0.16);

  --color-olive:      #6b7c5c;
  --color-olive-em:   #8fa876;
  --color-navy:       #1e3a5f;
  --color-navy-em:    #2d5a9e;
  --color-amber:      #d4900a;
  --color-amber-em:   #f0a820;

  --color-text:       #e8e6df;
  --color-text-muted: #7a7d76;
  --color-text-faint: #3d4039;

  --font-display:     'Barlow Condensed', sans-serif;
  --font-body:        'Barlow', sans-serif;
  --font-mono:        'IBM Plex Mono', monospace;

  --radius-sm:        4px;
  --radius-md:        8px;
  --radius-lg:        12px;
}
```

### Regras de aplicação

- Headings de página e títulos de módulo: `--font-display`, peso 700, tracking levemente apertado
- Corpo de texto, descrições: `--font-body`, peso 400
- Dados numéricos (cronômetro, progresso, pontuação): `--font-mono`
- Accent âmbar: usado exclusivamente em elementos de ação, progresso, destaque e alertas positivos
- Verde oliva: navegação ativa, badges de matéria, elementos de estado
- Azul naval: informações secundárias, links, elementos de contexto
- Nunca usar branco puro (#ffffff) — usar `--color-text` (#e8e6df) para todo texto

---

## Estrutura do projeto Next.js

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── cadastro/
│   ├── (plataforma)/
│   │   ├── dashboard/
│   │   ├── conteudo/
│   │   │   └── [materiaSlug]/
│   │   │       └── [topicoSlug]/
│   │   ├── simulados/
│   │   │   ├── index/
│   │   │   └── [simuladoId]/
│   │   ├── flashcards/
│   │   │   └── [materiaSlug]/
│   │   ├── cronometro/
│   │   └── perfil/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── conteudo/
│       ├── simulados/
│       ├── flashcards/
│       └── progresso/
├── components/
│   ├── ui/              ← componentes base (Button, Card, Badge, Input...)
│   ├── layout/          ← Sidebar, Header, MobileNav
│   └── features/        ← componentes por módulo
├── lib/
│   ├── prisma.ts        ← client singleton
│   ├── auth.ts          ← config NextAuth
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── public/
```

---

## Modelagem do banco de dados (Prisma Schema)

```prisma
model Usuario {
  id            String    @id @default(cuid())
  nome          String
  email         String    @unique
  senhaHash     String
  ativo         Boolean   @default(true)
  criadoEm      DateTime  @default(now())
  assinatura    Assinatura?
  progresso     Progresso[]
  sessoes       SessaoEstudo[]
  resultados    ResultadoSimulado[]
  accounts      Account[]
  sessions      Session[]
}

model Assinatura {
  id          String   @id @default(cuid())
  usuarioId   String   @unique
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  status      String   // ativo | inativo | trial
  inicio      DateTime
  fim         DateTime?
  plano       String   // mensal | anual | vitalicio
}

model Materia {
  id      String   @id @default(cuid())
  nome    String
  slug    String   @unique
  ordem   Int
  temas   Tema[]
}

model Tema {
  id        String    @id @default(cuid())
  materiaId String
  materia   Materia   @relation(fields: [materiaId], references: [id])
  titulo    String
  slug      String
  ordem     Int
  topicos   Topico[]
  questoes  Questao[]
  flashcards Flashcard[]
}

model Topico {
  id        String   @id @default(cuid())
  temaId    String
  tema      Tema     @relation(fields: [temaId], references: [id])
  titulo    String
  slug      String
  conteudo  String   @db.Text
  ordem     Int
  progresso Progresso[]
}

model Questao {
  id            String   @id @default(cuid())
  temaId        String
  tema          Tema     @relation(fields: [temaId], references: [id])
  enunciado     String   @db.Text
  alternativas  Json
  gabarito      String
  explicacao    String?  @db.Text
  dificuldade   String   // facil | medio | dificil
  simulados     SimuladoQuestao[]
  respostas     Resposta[]
}

model Flashcard {
  id        String   @id @default(cuid())
  temaId    String
  tema      Tema     @relation(fields: [temaId], references: [id])
  frente    String   @db.Text
  verso     String   @db.Text
  progresso FlashcardProgresso[]
}

model Simulado {
  id          String   @id @default(cuid())
  titulo      String
  tipo        String   // por_materia | completo | cronometrado
  tempoLimite Int?     // em minutos
  questoes    SimuladoQuestao[]
  resultados  ResultadoSimulado[]
}

model SimuladoQuestao {
  simuladoId  String
  questaoId   String
  ordem       Int
  simulado    Simulado @relation(fields: [simuladoId], references: [id])
  questao     Questao  @relation(fields: [questaoId], references: [id])
  @@id([simuladoId, questaoId])
}

model ResultadoSimulado {
  id          String   @id @default(cuid())
  usuarioId   String
  simuladoId  String
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  simulado    Simulado @relation(fields: [simuladoId], references: [id])
  acertos     Int
  total       Int
  tempoGasto  Int?
  respostas   Resposta[]
  criadoEm   DateTime @default(now())
}

model Resposta {
  id          String   @id @default(cuid())
  resultadoId String
  questaoId   String
  resultado   ResultadoSimulado @relation(fields: [resultadoId], references: [id])
  questao     Questao  @relation(fields: [questaoId], references: [id])
  resposta    String
  correta     Boolean
}

model Progresso {
  id        String   @id @default(cuid())
  usuarioId String
  topicoId  String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  topico    Topico   @relation(fields: [topicoId], references: [id])
  lido      Boolean  @default(false)
  lidoEm   DateTime?
  @@unique([usuarioId, topicoId])
}

model FlashcardProgresso {
  id          String    @id @default(cuid())
  usuarioId   String
  flashcardId String
  flashcard   Flashcard @relation(fields: [flashcardId], references: [id])
  resultado   String    // acertou | errou | revisar
  revisarEm  DateTime?
  @@unique([usuarioId, flashcardId])
}

model SessaoEstudo {
  id        String   @id @default(cuid())
  usuarioId String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  inicio    DateTime
  fim       DateTime?
  duracaoMin Int?
  materiaId String?
  tipo      String   // livre | pomodoro | simulado
}
```

---

## Telas da plataforma

| Tela | Rota | Prioridade |
|---|---|---|
| Login | `/login` | Fase 1 |
| Dashboard | `/dashboard` | Fase 1 |
| Lista de matérias | `/conteudo` | Fase 1 |
| Conteúdo do tópico | `/conteudo/[materia]/[topico]` | Fase 1 |
| Simulado | `/simulados/[id]` | Fase 1 |
| Resultado do simulado | `/simulados/[id]/resultado` | Fase 1 |
| Flashcards | `/flashcards/[materia]` | Fase 2 |
| Cronômetro | `/cronometro` | Fase 2 |
| Perfil e progresso | `/perfil` | Fase 2 |
| Ranking | `/ranking` | Fase 3 |
| Admin (conteúdo) | `/admin` | Fase 3 |

---

## Fases de implementação

### Fase 1 — MVP (base funcional) ✅ CONCLUÍDA

Objetivo: plataforma no ar, com conteúdo acessível e simulados funcionando.

1. ✅ Setup do projeto Next.js + Prisma + PostgreSQL no EasyPanel
2. ✅ Configuração do NextAuth.js (email/senha, JWT, proteção de rotas)
3. ✅ Modelagem e migration do banco de dados
4. ✅ Tela de login com identidade visual definida
5. ✅ Dashboard inicial com progresso básico
6. ✅ Módulo de conteúdo — navegação por matéria > tema > tópico
7. ✅ Módulo de simulados — questões, cronômetro, gabarito e resultado
8. ⚠️ Seed inicial com conteúdo extraído do PDF (seed.ts em `conteudo/` precisa ser movido para `prisma/`)
9. ⚠️ Deploy no EasyPanel com domínio e SSL

### Fase 2 — Engajamento ✅ CONCLUÍDA

Objetivo: ferramentas que fazem o aluno voltar todo dia.

1. ✅ Módulo de flashcards com revisão espaçada
2. ✅ Cronômetro Pomodoro com log de sessões
3. ✅ Estatísticas de desempenho por matéria
4. ✅ Metas diárias e notificações
5. ✅ Página de perfil com histórico completo
6. ✅ Modo simulado oficial (condições reais de prova)

### Fase 3 — Comunidade e monetização 🟡 EM ANDAMENTO

Objetivo: crescimento, retenção e receita.

1. ✅ Ranking entre assinantes
2. ✅ Fórum de dúvidas por tema
3. ✅ Plano de estudos personalizado (dias até a prova)
4. ⚠️ Geração automática de flashcards via Claude API (implementado por código em `lib/flashcards.ts`)
5. ❌ Integração de pagamentos e controle de assinatura
6. ❌ Painel administrativo para gestão de conteúdo

---

## Status de implementação por tela

| Tela | Rota | Status |
|---|---|---|
| Login | `/login` | ✅ |
| Dashboard | `/dashboard` | ✅ |
| Lista de matérias | `/conteudo` | ✅ |
| Conteúdo do tópico | `/conteudo/[materia]/[topico]` | ✅ |
| Simulado | `/simulados/[id]` | ✅ |
| Resultado do simulado | `/simulados/[id]/resultado` | ✅ |
| Flashcards | `/flashcards/[materia]` | ✅ |
| Cronômetro | `/cronometro` | ✅ |
| Perfil e progresso | `/perfil` | ✅ |
| Ranking | `/ranking` | ✅ |
| Forum | `/forum` | ✅ |
| Plano de estudos | `/plano-estudos` | ✅ |
| Admin (conteúdo) | `/admin` | ❌ Pendente |

---

## Tarefas pendentes por prioridade

### Alta (bloqueia uso em produção)
1. ~~Mover `conteudo/seed.ts` para `prisma/seed.ts` e corrigir caminhos~~ ✅
2. ~~Conectar APIs ao banco PostgreSQL~~ ✅
3. ~~Verificar autenticação e proteção de rotas via middleware~~ ✅
4. [ ] Deploy no EasyPanel com PostgreSQL e SSL

### Média (funcionalidade completa)
5. Implementar geração de flashcards via Claude API
6. Seed de questões para simulados no banco
7. Persistir sessão Pomodoro e estatísticas no banco
8. FlashcardProgresso com revisão espaçada real (SRS)

### Baixa (escalabilidade)
9. Integrar sistema de pagamentos (assinaturas)
10. Painel administrativo para CRUD de conteúdo
11. Modelo de posts para fórum

---

## Configuração no EasyPanel

- 1 serviço Next.js (app principal)
- 1 serviço PostgreSQL
- Variáveis de ambiente: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- SSL via Let's Encrypt (automático no EasyPanel)
- Deploy via GitHub Actions ou push direto no painel

---

## Decisões técnicas importantes

- O conteúdo do PDF será processado uma única vez, extraído e inserido estruturado no PostgreSQL via seed Prisma — nunca servido como arquivo
- Não há storage externo — imagens do conteúdo (se houver) serão convertidas em base64 ou descritas em texto na fase de extração
- O app Next.js roda em modo fullstack — API Routes no mesmo projeto, sem backend separado
- Autenticação via NextAuth com provider Credentials (email + senha com bcrypt)
- Sessão gerenciada via JWT (sem banco de sessões para simplificar)
- Todas as rotas dentro de `(plataforma)/` protegidas via middleware Next.js verificando sessão ativa e assinatura válida

---

## Estado atual

✅ Seed em `prisma/seed.ts` com caminho corrigido para `../conteudo/`
✅ APIs de conteúdo e flashcards conectadas ao banco Prisma
✅ Páginas principais (dashboard, conteúdo, flashcards, plano de estudos) usando dados do banco
✅ Middleware de autenticação configurado e protegendo rotas

⚠️ Perfil, ranking e fórum ainda usam dados mock (requerem contexto de usuário)
⚠️ Simulados usam mock data com questões embutidas

### Pendências técnicas mais críticas

1. **Deploy**: subir para EasyPanel com PostgreSQL
2. **Flashcards IA**: substituir geração por código (`lib/flashcards.ts`) por chamada à Claude API
3. **Questões**: criar seed de questões para simulados no banco
4. **Modelo Forum**: adicionar tabela de posts do fórum no schema
5. **Pagamentos**: integração de assinaturas
