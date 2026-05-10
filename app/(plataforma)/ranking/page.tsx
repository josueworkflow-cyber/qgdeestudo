import { Badge } from "@/components/ui/Badge";
import { RankingPanel } from "./RankingPanel";

export default function RankingPage() {
  return (
    <div className="grid" style={{ gap: 24 }}>
      <div>
        <Badge>Fase 3</Badge>
        <h2 className="page-title" style={{ marginTop: 14 }}>
          Ranking
        </h2>
      </div>
      <RankingPanel />
    </div>
  );
}
