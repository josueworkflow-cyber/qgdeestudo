"use client";

import { useState } from "react";
import { Eye, EyeOff, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ranking } from "@/lib/data";

export function RankingPanel() {
  const [participando, setParticipando] = useState(false);
  const lista = ranking.filter((item) => item.optIn || (participando && item.nome === "Voce"));

  return (
    <div className="grid grid-2">
      <Card>
        <Trophy size={28} color="var(--color-amber-em)" />
        <h3 className="section-title" style={{ marginTop: 14 }}>
          Participacao opcional
        </h3>
        <p className="muted">
          O aluno so aparece no ranking se aceitar participar. Sem opt-in, ele ve a classificacao sem expor nome,
          pontos ou desempenho.
        </p>
        <Button onClick={() => setParticipando((current) => !current)} type="button">
          {participando ? <EyeOff size={18} /> : <Eye size={18} />}
          {participando ? "Sair do ranking" : "Participar do ranking"}
        </Button>
      </Card>

      <Card>
        <h3 className="section-title">Classificacao</h3>
        <div className="grid" style={{ marginTop: 18 }}>
          {lista.map((item) => (
            <div
              key={item.nome}
              style={{
                alignItems: "center",
                borderBottom: "1px solid var(--color-border)",
                display: "grid",
                gap: 10,
                gridTemplateColumns: "42px 1fr 80px 70px",
                padding: "10px 0"
              }}
            >
              <strong className="metric-value" style={{ fontSize: 22, margin: 0 }}>
                #{item.posicao}
              </strong>
              <span>{item.nome}</span>
              <span className="muted">{item.pontos} pts</span>
              <span className="badge">{item.media}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
