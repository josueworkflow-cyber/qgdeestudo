import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function stripHtml(texto: string): string {
  return texto
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function splitSentences(texto: string): string[] {
  const limpo = stripHtml(texto)
  return limpo
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú"'(])/g)
    .map(s => s.trim())
    .filter(s => s.length > 30 && s.length < 400 && /\w/.test(s))
}

const SIGLA_PATTERN = /\b([A-Z]{2,}(?:-[A-Za-z0-9]+)*)\b/g
const COMPOUND_TERM_PATTERN = /\b((?:[A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de|da|do|das|dos|e|em|no|na|nos|nas|para|com|por|a|à|ao)\s+)?){2,}(?:[A-ZÀ-Ú][a-zà-ú]+))\b/g
const PAREN_DEF_PATTERN = /\(([A-Z][A-Za-zÀ-ÿ0-9\- ]{2,40})\)/g
const DEFINITION_PATTERNS = [
  /(?:é|são|significa|entende-se por|denomina-se|chama-se)\s+(?:o\s+|a\s+|os\s+|as\s+)?([A-ZÀ-Ú][^.?!]{5,100}?)(?=[,;.!?]|$)/gi,
]

const STOP_WORDS = new Set([
  'que', 'não', 'para', 'com', 'por', 'uma', 'como', 'mais', 'seu', 'sua',
  'pelo', 'pela', 'pelos', 'pelas', 'dos', 'das', 'este', 'esta', 'esse',
  'essa', 'aquilo', 'cada', 'entre', 'sobre', 'sem', 'até', 'mas', 'ou',
  'quando', 'muito', 'onde', 'também', 'após', 'assim', 'deve', 'pode',
  'deverá', 'poderá', 'suas', 'seus', 'ser', 'são', 'qual', 'forma',
  'parte', 'caso', 'grande', 'sendo', 'todo', 'toda', 'todos', 'todas',
  'durante', 'porém', 'pois', 'ainda', 'apenas', 'então', 'deve', 'de',
  'da', 'do', 'no', 'na', 'ao', 'à', 'os', 'as', 'um', 'um', 'a', 'o',
  'se', 'ele', 'ela', 'eles', 'elas', 'foi', 'era', 'está', 'estão',
  'já', 'tem', 'têm', 'há', 'nos', 'nas', 'às', 'aos', 'sob', 'aqui',
  'ali', 'lá', 'muito', 'pouco', 'bem', 'mal'
])

function keywordScore(word: string): number {
  if (word.length < 4) return 0
  if (STOP_WORDS.has(word.toLowerCase())) return 0
  if (/^\d/.test(word)) return 0

  let score = 0
  if (/[A-Z]{3,}/.test(word)) score += 3 // sigla
  if (/^[A-ZÀ-Ú][a-zà-ú]/.test(word)) score += 1 // proper noun
  if (word.length > 10) score += 1 // compound term likely
  if (/[çãõêâôûáéíóú]/.test(word)) score += 1 // Portuguese chars
  return score
}

function extractKeywords(texto: string): string[] {
  const found: string[] = []

  // 1. Parenthetical definitions: "Força de Cobertura (FCob)" → "Força de Cobertura"
  let match
  while ((match = PAREN_DEF_PATTERN.exec(texto)) !== null) {
    const parent = match[1].trim()
    if (parent.length >= 3 && /[A-Z]/.test(parent[0]) && !STOP_WORDS.has(parent.toLowerCase())) {
      found.push(parent)
    }
  }

  // 2. Siglas standalone
  const siglaMatches = texto.match(SIGLA_PATTERN) || []
  for (const s of siglaMatches) {
    if (s.length >= 3 && !found.includes(s)) {
      found.push(s)
    }
  }

  // 3. Definition patterns: "é a Força de Desembarque"
  for (const pattern of DEFINITION_PATTERNS) {
    let defMatch
    while ((defMatch = pattern.exec(texto)) !== null) {
      const term = defMatch[1].trim()
      if (term.length >= 5 && term.length <= 100 && !STOP_WORDS.has(term.toLowerCase())) {
        found.push(term)
      }
    }
  }

  // 4. Compound proper nouns
  let compMatch
  while ((compMatch = COMPOUND_TERM_PATTERN.exec(texto)) !== null) {
    const term = compMatch[1].trim()
    if (term.length >= 8 && !STOP_WORDS.has(term.toLowerCase()) && !found.includes(term)) {
      found.push(term)
    }
  }

  return [...new Set(found)]
}

function generateCards(conteudo: string): { frente: string; verso: string }[] {
  const sentences = splitSentences(conteudo)
  const cards: { frente: string; verso: string }[] = []
  const usedVersos = new Set<string>()

  for (const sentence of sentences) {
    if (cards.length >= 5) break

    const keywords = extractKeywords(sentence)
    const scored = keywords
      .map(k => ({ word: k, score: keywordScore(k) }))
      .filter(k => k.score >= 2)
      .sort((a, b) => b.score - a.score)

    for (const { word } of scored) {
      if (cards.length >= 5) break
      if (usedVersos.has(word.toLowerCase())) continue

      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escaped}\\b`, 'u')
      const frente = sentence.replace(regex, '___________').replace(/\s{2,}/g, ' ').trim()

      if (frente === sentence) continue
      if (!frente.includes('___________')) continue

      cards.push({ frente, verso: word })
      usedVersos.add(word.toLowerCase())
      break
    }
  }

  return cards
}

async function main() {
  console.log('🔍 Buscando tópicos do banco...')

  const topicos = await prisma.topico.findMany({
    include: { tema: true }
  })

  console.log(`📚 ${topicos.length} tópicos encontrados`)

  // Limpar flashcards existentes
  console.log('🧹 Removendo flashcards existentes...')
  await prisma.flashcardProgresso.deleteMany()
  await prisma.flashcard.deleteMany()

  let total = 0
  let semCards = 0

  for (const topico of topicos) {
    const cards = generateCards(topico.conteudo)

    if (cards.length === 0) {
      semCards++
      continue
    }

    await prisma.flashcard.createMany({
      data: cards.map(c => ({
        temaId: topico.temaId,
        frente: c.frente,
        verso: c.verso
      }))
    })

    total += cards.length
  }

  console.log(`✅ ${total} flashcards gerados em ${topicos.length - semCards} tópicos`)
  console.log(`⚠️ ${semCards} tópicos sem cards (conteúdo curto ou sem palavras-chave)`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
