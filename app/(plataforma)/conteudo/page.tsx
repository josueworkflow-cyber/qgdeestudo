import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ConteudoPage() {
  const session = await getServerSession(authOptions);
  
  const materias = await prisma.materia.findMany({
    orderBy: { ordem: "asc" },
    include: {
      temas: {
        include: {
          progresso: session?.user?.id ? {
            where: { usuarioId: session.user.id }
          } : false
        }
      },
    },
  });

  return (
    <div className="grid" style={{ gap: 26 }}>
      <div>
        <Badge>Conteúdo estruturado</Badge>
        <h2 className="page-title" style={{ marginTop: 14 }}>
          Matérias
        </h2>
      </div>

      <section className="grid grid-3" style={{ gap: 32 }}>
        {materias.map((materia) => {
          const totalTemas = materia.temas.length;
          const temasLidos = materia.temas.filter(t => t.progresso?.some(p => p.lido)).length;
          const progressoPct = totalTemas > 0 ? Math.round((temasLidos / totalTemas) * 100) : 0;
          
          return (
            <Link key={materia.id} href={`/conteudo/${materia.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <div className="materia-list-item" style={{ height: "100%", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", gap: 32, padding: "28px" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)", margin: 0, fontFamily: "var(--font-display)", textTransform: "uppercase", lineHeight: 1.3 }}>
                  {materia.nome}
                </h3>
                
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span className="muted">{totalTemas} capítulos</span>
                    <span style={{ fontWeight: 700, color: "var(--color-amber-em)" }}>{progressoPct}%</span>
                  </div>
                  <div style={{ width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                     <div style={{ width: `${progressoPct}%`, height: "100%", backgroundColor: "var(--color-amber)" }} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}