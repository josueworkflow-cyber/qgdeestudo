import { NextResponse } from "next/server";
import { ranking } from "@/lib/data";

export function GET() {
  return NextResponse.json({
    ranking: ranking.filter((item) => item.optIn),
    participacao: "opt-in"
  });
}
