import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const rotasProtegidas = [
  "/dashboard",
  "/conteudo",
  "/simulados",
  "/flashcards",
  "/cronometro",
  "/perfil",
  "/plano-estudos",
  "/ranking",
  "/forum",
  "/admin"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protegida = rotasProtegidas.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));

  if (!protegida) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("callbackUrl", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
