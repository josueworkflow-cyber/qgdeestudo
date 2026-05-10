import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { atualizarConfigHoras } from "@/lib/plano-estudo";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { horasDia, diasSemana } = await req.json();

    if (!horasDia || !diasSemana || !Array.isArray(diasSemana)) {
      return NextResponse.json({ error: "horasDia and diasSemana are required" }, { status: 400 });
    }

    await atualizarConfigHoras(session.user.id, { horasDia, diasSemana });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/plano-estudo/config error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
