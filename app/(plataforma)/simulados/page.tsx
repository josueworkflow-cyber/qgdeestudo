import { Clock, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { simulados } from "@/lib/data";

export default function SimuladosPage() {
  return (
    <div className="grid" style={{ gap: 26 }}>
      <div>
        <Badge>Treino objetivo</Badge>
        <h2 className="page-title" style={{ marginTop: 14 }}>
          Simulados
        </h2>
      </div>

      <section className="grid grid-2">
        {simulados.map((simulado) => (
          <Card key={simulado.id}>
            <Badge>{simulado.tipo}</Badge>
            <h3 className="section-title" style={{ marginTop: 18 }}>
              {simulado.titulo}
            </h3>
            <p className="muted" style={{ display: "flex", gap: 16 }}>
              <span>
                <ListChecks size={16} /> {simulado.questoes.length} questoes
              </span>
              <span>
                <Clock size={16} /> {simulado.tempoLimite} min
              </span>
            </p>
            <Button href={`/simulados/${simulado.id}`}>Comecar prova</Button>
          </Card>
        ))}
      </section>
    </div>
  );
}
