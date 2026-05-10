import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { simulados } from "@/lib/data";
import { SimuladoRunner } from "./SimuladoRunner";

type Props = {
  params: { simuladoId: string };
};

export default function SimuladoPage({ params }: Props) {
  const { simuladoId } = params;
  const simulado = simulados.find((item) => item.id === simuladoId);
  if (!simulado) notFound();

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div>
        <Badge>{simulado.tipo}</Badge>
        <h2 className="page-title" style={{ marginTop: 14 }}>
          {simulado.titulo}
        </h2>
        <p className="muted">{simulado.questoes.length} questoes · {simulado.tempoLimite} minutos</p>
      </div>
      <SimuladoRunner questoes={simulado.questoes} />
    </div>
  );
}
