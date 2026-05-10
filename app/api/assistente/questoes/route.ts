import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarQuestoes } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { temaId, quantidade = 5, dificuldade = "medio" } = body;

    if (!temaId) {
      return NextResponse.json({ error: "temaId é obrigatório" }, { status: 400 });
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

    // Chama a API do Gemini para gerar as questões
    const questoes = await gerarQuestoes(conteudoCompleto, Number(quantidade), dificuldade);

    return NextResponse.json({ questoes });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : "";
    console.error("Erro na rota de gerador de questões:", errMsg);
    console.error("Stack:", errStack);
    return NextResponse.json({ error: "Erro interno do servidor", details: errMsg }, { status: 500 });
  }
}
