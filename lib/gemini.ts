// lib/gemini.ts — Módulo de IA usando NVIDIA NIM API (OpenAI-compatible)

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL = "meta/llama-3.1-8b-instruct";

if (!NVIDIA_API_KEY) {
  console.warn("NVIDIA_API_KEY não está configurada. A IA não funcionará.");
}

// ===================== CHAT (streaming) =====================

export async function gerarRespostaChat(
  conteudo: string,
  pergunta: string,
  historico: { role: "user" | "assistant"; content: string }[] = []
) {
  const systemMessage = `Responda APENAS com base no conteúdo abaixo. Se a pergunta não estiver no conteúdo, diga que não está no material.

${conteudo}`;

  const messages = [
    { role: "system", content: systemMessage },
    ...historico.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: pergunta },
  ];

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 2048,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API Error [${response.status}]: ${errorText}`);
  }

  return response;
}

// ===================== GERADOR DE QUESTÕES (não-streaming) =====================

export async function gerarQuestoes(
  conteudo: string,
  quantidade: number,
  dificuldade: "facil" | "medio" | "dificil"
) {
  const prompt = `Gere exatamente ${quantidade} questões de múltipla escolha com base EXCLUSIVAMENTE no conteúdo abaixo.
Dificuldade: ${dificuldade}.

Retorne APENAS um JSON válido e puro (sem blocos de código markdown) no seguinte formato:
[
  {
    "enunciado": "Texto da questão...",
    "alternativas": {
      "A": "Primeira opção",
      "B": "Segunda opção",
      "C": "Terceira opção",
      "D": "Quarta opção"
    },
    "gabarito": "A",
    "explicacao": "Explicação detalhada."
  }
]

CONTEÚDO BASE PARA GERAR AS QUESTÕES:
${conteudo}`;

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API Error [${response.status}]: ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.choices?.[0]?.message?.content || "";

  try {
    // Busca um array JSON na string de resposta
    const match = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return JSON.parse(responseText);
  } catch {
    console.error("Erro ao fazer parse do JSON das questões. Resposta crua:", responseText);
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }
}
