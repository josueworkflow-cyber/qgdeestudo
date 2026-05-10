import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { atualizarSobrevivencia } from "@/lib/plano-estudo";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { horasDia, diasSemana, estudaFds, dataProva, minutosConteudo, minutosFlashcards, minutosQuestoes, minutosSimulado } = await req.json();

    if (!diasSemana || !dataProva) {
      return NextResponse.json({ error: "diasSemana and dataProva are required" }, { status: 400 });
    }

    const totalMinutos = (minutosConteudo || 0) + (minutosFlashcards || 0) + (minutosQuestoes || 0) + (minutosSimulado || 0);
    const horasCalculadas = Math.max(1, Math.round(totalMinutos / 60));

    const plano = await atualizarSobrevivencia(session.user.id, {
      horasDia: horasDia || horasCalculadas,
      diasSemana,
      estudaFds: estudaFds || false,
      dataProva,
      minutosConteudo: minutosConteudo || 0,
      minutosFlashcards: minutosFlashcards || 0,
      minutosQuestoes: minutosQuestoes || 0,
      minutosSimulado: minutosSimulado || 0,
    });

    return NextResponse.json(plano);
  } catch (error) {
    console.error("PUT /api/plano-estudo/sobrevivencia error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
