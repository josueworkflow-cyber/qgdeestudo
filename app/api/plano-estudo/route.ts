import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buscarDadosPlano, inicializarPlano } from "@/lib/plano-estudo";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dados = await buscarDadosPlano(session.user.id);
    return NextResponse.json(dados);
  } catch (error) {
    console.error("GET /api/plano-estudo error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { metodoSlug } = await req.json();
    const plano = await inicializarPlano(session.user.id, metodoSlug || "doutrina");

    return NextResponse.json(plano);
  } catch (error) {
    console.error("POST /api/plano-estudo error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
