import { NextResponse } from "next/server";
import { simulados } from "@/lib/data";

export function GET() {
  return NextResponse.json({ simulados });
}
