import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { concluirTarefa } from "@/lib/plano-estudo";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tarefaId } = await req.json();
    if (!tarefaId) {
      return NextResponse.json({ error: "tarefaId is required" }, { status: 400 });
    }

    const tarefa = await concluirTarefa(tarefaId);
    return NextResponse.json(tarefa);
  } catch (error) {
    console.error("POST /api/plano-estudo/missao error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
