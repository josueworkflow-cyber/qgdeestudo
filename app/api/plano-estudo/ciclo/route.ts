import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { finalizarCiclo } from "@/lib/plano-estudo";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ciclo = await finalizarCiclo(session.user.id);
    return NextResponse.json(ciclo);
  } catch (error) {
    console.error("POST /api/plano-estudo/ciclo error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
