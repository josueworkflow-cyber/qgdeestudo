import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trocarMetodo } from "@/lib/plano-estudo";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { metodoSlug } = await req.json();
    if (!metodoSlug) {
      return NextResponse.json({ error: "metodoSlug is required" }, { status: 400 });
    }

    await trocarMetodo(session.user.id, metodoSlug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/plano-estudo/metodo error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
