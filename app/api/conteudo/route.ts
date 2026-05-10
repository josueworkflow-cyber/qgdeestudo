import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const materias = await prisma.materia.findMany({
    orderBy: { ordem: "asc" },
    include: {
      temas: {
        orderBy: { ordem: "asc" },
        include: {
          topicos: {
            orderBy: { ordem: "asc" },
            select: {
              id: true,
              titulo: true,
              slug: true,
              conteudo: true,
              ordem: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ materias });
}