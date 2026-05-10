import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarRespostaChat } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { temaId, mensagem, historico } = body;

    if (!temaId || !mensagem) {
      return NextResponse.json({ error: "temaId e mensagem são obrigatórios" }, { status: 400 });
    }

    // Busca o conteúdo dos tópicos do tema selecionado
    const topicos = await prisma.topico.findMany({
      where: { temaId },
      orderBy: { ordem: "asc" },
      select: { titulo: true, conteudo: true }
    });

    if (topicos.length === 0) {
      return NextResponse.json({ error: "Nenhum conteúdo encontrado para este tema." }, { status: 404 });
    }

    // Concatena todo o conteúdo do tema
    const conteudoCompleto = topicos
      .map(t => `TÓPICO: ${t.titulo}\n${t.conteudo}`)
      .join("\n\n");

    console.log(`Enviando ${conteudoCompleto.length} caracteres para a IA...`);

    // Chama a API da NVIDIA e obtém a response SSE
    const nvidiaResponse = await gerarRespostaChat(conteudoCompleto, mensagem, historico || []);

    if (!nvidiaResponse.body) {
      throw new Error("NVIDIA response has no body");
    }

    // Converte o stream SSE da NVIDIA para texto puro para o frontend
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");
    const reader = nvidiaResponse.body.getReader();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // Ignora linhas que não são JSON válido
              }
            }
          }
        } catch (error) {
          console.error("Erro durante o streaming:", error);
          controller.enqueue(encoder.encode("\n\n[Erro na comunicação com a IA]"));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Erro na rota de chat:", errMsg);
    return NextResponse.json({ error: "Erro interno do servidor", details: errMsg }, { status: 500 });
  }
}
