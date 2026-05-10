import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Edit3 } from "lucide-react";

export default async function AdminConteudoPage() {
  const materias = await prisma.materia.findMany({
    orderBy: { ordem: "asc" },
    include: {
      _count: {
        select: { temas: true }
      }
    }
  });

  return (
    <div className="grid" style={{ gap: 24, paddingBottom: 64 }}>
      <div>
        <h1 className="page-title">Editor de Matérias</h1>
        <p className="muted">Selecione uma matéria para editar todo o seu conteúdo em uma única página.</p>
      </div>

      <div className="grid grid-3" style={{ gap: 24 }}>
        {materias.map(materia => (
          <Card key={materia.id} style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 24 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <Badge>{materia.slug.toUpperCase().split("-").slice(0, 2).join("-")}</Badge>
                <span className="muted" style={{ fontSize: 12 }}>{materia._count.temas} capítulos</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, textTransform: "uppercase" }}>{materia.nome}</h3>
            </div>
            
            <Button href={`/admin/materia/${materia.slug}`} style={{ width: "100%" }}>
              <Edit3 size={16} /> Editar Matéria Completa
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
