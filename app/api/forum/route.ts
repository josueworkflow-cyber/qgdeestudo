import { NextResponse } from "next/server";
import { forumTopicos } from "@/lib/data";

export function GET() {
  return NextResponse.json({ topicos: forumTopicos });
}
