import { NextResponse, NextRequest } from "next/server";
import { desempenhoPorMateria, metasDiarias, metricas, planoEstudos } from "@/lib/data";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json({ metricas, metasDiarias, desempenhoPorMateria, planoEstudos });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { temaId } = await req.json();

    if (!temaId) {
      return NextResponse.json({ error: "temaId is required" }, { status: 400 });
    }

    const progresso = await prisma.progresso.upsert({
      where: {
        usuarioId_temaId: {
          usuarioId: session.user.id,
          temaId,
        },
      },
      update: {
        lido: true,
        lidoEm: new Date(),
      },
      create: {
        usuarioId: session.user.id,
        temaId,
        lido: true,
        lidoEm: new Date(),
      },
    });

    return NextResponse.json(progresso);
  } catch (error) {
    console.error("POST /api/progresso error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { temaId } = await req.json();

    if (!temaId) {
      return NextResponse.json({ error: "temaId is required" }, { status: 400 });
    }

    await prisma.progresso.deleteMany({
      where: {
        usuarioId: session.user.id,
        temaId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/progresso error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
