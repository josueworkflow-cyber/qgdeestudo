import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const flashcards = await prisma.flashcard.findMany({
    include: {
      tema: {
        select: {
          titulo: true,
          materia: { select: { nome: true, slug: true } }
        }
      }
    },
    orderBy: { id: "asc" }
  });

  return NextResponse.json({
    flashcards: flashcards.map(f => ({
      id: f.id,
      materiaSlug: f.tema.materia.slug,
      materiaNome: f.tema.materia.nome,
      temaTitulo: f.tema.titulo,
      frente: f.frente,
      verso: f.verso
    })),
    origem: "banco_de_dados"
  });
}
