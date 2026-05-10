# QG de Estudo

MVP Next.js fullstack baseado no `plano_implementacao.md`.

## Stack

- Next.js App Router
- NextAuth com Credentials
- Prisma
- PostgreSQL
- UI dark tatico/utilitaria

## Rodar localmente

1. Copie `.env.example` para `.env` e ajuste as variaveis.
2. Suba o PostgreSQL local ou configure um banco externo.
3. Instale dependencias:

```powershell
npm.cmd install
```

4. Gere o Prisma Client e rode a migration:

```powershell
npm.cmd run prisma:generate
npm.cmd run prisma:migrate -- --name init
npm.cmd run prisma:seed
```

5. Inicie o projeto:

```powershell
npm.cmd run dev
```

Se as portas `3000`/`3001` ja estiverem ocupadas:

```powershell
npm.cmd run dev -- -p 3010
```

Usuario admin do seed:

- Email: `admin@plataforma.com.br`
- Senha: `Admin@2025`

## Status atual

### Fase 1 — MVP (base funcional) ✅ CONCLUÍDA
- [x] Setup Next.js + Prisma + PostgreSQL
- [x] NextAuth com Credentials (JWT)
- [x] Schema do banco completo
- [x] Tela de login com identidade visual tática
- [x] Dashboard com métricas e progresso
- [x] Módulo de conteúdo (matéria > tema > tópico)
- [x] Módulo de simulados com cronômetro e gabarito
- [x] Seed com conteúdo real (14 matérias, ~155 temas, ~1.200 tópicos)
- [x] Middleware de proteção de rotas
- [x] APIs conectadas ao banco (conteúdo, flashcards)
- [ ] Deploy no EasyPanel

### Fase 2 — Engajamento ✅ CONCLUÍDA
- [x] Flashcards com revisão espaçada
- [x] Cronômetro Pomodoro com log de sessões
- [x] Estatísticas de desempenho por matéria
- [x] Metas diárias
- [x] Página de perfil com histórico
- [x] Modo simulado oficial

### Fase 3 — Comunidade e monetização 🟡 EM ANDAMENTO
- [x] Ranking entre assinantes (UI pronta, usa mock data)
- [x] Fórum de dúvidas por tema (UI pronta, usa mock data)
- [x] Plano de estudos personalizado (gera baseado nas matérias do banco)
- [x] Geração de flashcards (por código a partir dos tópicos)
- [ ] Geração de flashcards via Claude API
- [ ] Integração de pagamentos (assinaturas)
- [ ] Painel administrativo

## Pendências técnicas

1. Deploy no EasyPanel com SSL
2. Geração de flashcards via Claude API (substituir lógica em `lib/flashcards.ts`)
3. Adicionar questões aos simulados no banco (atualmente usa mock)
4. Modelo de banco para posts do fórum
5. Integração de pagamentos (assinaturas)
6. Painel admin para gestão de conteúdo

## Notas

- Páginas de perfil, ranking e fórum ainda usam dados mock (requerem contexto de usuário autenticado)
- Simulados usam mock data com questões embutidas (não há seed de questões ainda)
- O seed está em `prisma/seed.ts` e carrega dados de `conteudo/*.json`