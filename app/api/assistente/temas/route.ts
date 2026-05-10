import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const materias = await prisma.materia.findMany({
      orderBy: { ordem: "asc" },
      include: {
        temas: {
          orderBy: { ordem: "asc" },
          select: {
            id: true,
            titulo: true,
          }
        }
      }
    });
    
    return NextResponse.json({ materias });
  } catch (error) {
    console.error("Erro ao buscar temas para o assistente:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
