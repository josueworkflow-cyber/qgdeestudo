"use client";

import { useEffect, useState } from "react";
import { BookOpen, RefreshCw, Shield, Swords, Layers } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EscolherMetodoModal } from "@/components/features/EscolherMetodoModal";

const METODO_ICONES: Record<string, React.ReactNode> = {
  doutrina: <BookOpen size={22} color="#8fa876" />,
  combate: <Swords size={22} color="#d4900a" />,
  operativo: <Layers size={22} color="#2d5a9e" />,
  sobrevivencia: <Shield size={22} color="#f0a820" />,
};

export default function PerfilPage() {
  const [dados, setDados] = useState<{
    plano: { metodoNome: string; metodoSlug: string; metodoDescricao: string };
    ciclo: { numero: number; progresso: number } | null;
    progressoGeral: { percentualEstudado: number; flashcardsConcluidos: number };
  } | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      const res = await fetch("/api/plano-estudo");
      if (res.ok) setDados(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleTrocarMetodo = async (slug: string) => {
    await fetch("/api/plano-estudo/metodo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoSlug: slug }),
    });
    setMostrarModal(false);
    carregar();
  };

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div>
        <Badge>{dados?.plano?.metodoNome || "Aluno"}</Badge>
        <h2 className="page-title" style={{ marginTop: 14 }}>
          Perfil
        </h2>
      </div>

      <section className="grid grid-2">
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            {dados?.plano ? METODO_ICONES[dados.plano.metodoSlug] || null : null}
            <h3 className="section-title" style={{ fontSize: 20 }}>
              {dados?.plano?.metodoNome || "Carregando..."}
            </h3>
          </div>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
            {dados?.plano?.metodoDescricao || "Configure seu método de estudo para começar."}
          </p>
          {dados?.ciclo && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>Ciclo {dados.ciclo.numero}</span>
                <span className="muted" style={{ fontSize: 14 }}>{dados.ciclo.progresso}%</span>
              </div>
              <div className="progress">
                <span style={{ width: `${dados.ciclo.progresso}%` }} />
              </div>
            </div>
          )}
          <Button variant="secondary" onClick={() => setMostrarModal(true)}>
            <RefreshCw size={16} /> Trocar método de estudo
          </Button>
        </Card>

        <Card>
          <h3 className="section-title" style={{ fontSize: 20, marginBottom: 16 }}>Progresso</h3>
          <div className="grid grid-3">
            <div>
              <span className="muted" style={{ fontSize: 13 }}>Conteúdo</span>
              <div className="metric-value">
                {dados?.progressoGeral?.percentualEstudado || 0}%
              </div>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 13 }}>Flashcards</span>
              <div className="metric-value">
                {dados?.progressoGeral?.flashcardsConcluidos || 0}
              </div>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 13 }}>Ciclo</span>
              <div className="metric-value" style={{ fontSize: 24 }}>
                {dados?.ciclo ? dados.ciclo.numero : "—"}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {mostrarModal && (
        <EscolherMetodoModal onSelecionar={handleTrocarMetodo} onClose={() => setMostrarModal(false)} />
      )}
    </div>
  );
}
