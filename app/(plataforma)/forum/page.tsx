import { Badge } from "@/components/ui/Badge";
import { AssistenteEstudo } from "@/components/features/AssistenteEstudo";

export default function AssistentePage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <div>
        <Badge>Inteligência Artificial</Badge>
        <h2 className="page-title" style={{ marginTop: 14 }}>
          Assistente de Estudo
        </h2>
      </div>

      <AssistenteEstudo />
    </div>
  );
}
