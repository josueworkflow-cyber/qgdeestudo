"use client";

import { useState } from "react";
import { BookOpen, Brain, Clock, Layers, Repeat, Shield, Swords, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MetodoInfo {
  slug: string;
  nome: string;
  icon: React.ReactNode;
  descricao: string;
  perfil: string;
  duracao: string;
  detalhes: { label: string; value: string }[];
}

const METODOS: MetodoInfo[] = [
  {
    slug: "doutrina",
    nome: "Doutrina",
    icon: <BookOpen size={28} />,
    descricao: "Repetição espaçada, flashcards e memorização contínua. Ideal para quem aprende melhor repetindo.",
    perfil: "Aluno que aprende melhor repetindo.",
    duracao: "~4 meses para concluir 100%",
    detalhes: [
      { label: "Conteúdo novo", value: "30% do tempo" },
      { label: "Revisão + Flashcards", value: "45% do tempo" },
      { label: "Questões", value: "15% do tempo" },
      { label: "Revisão de erros", value: "10% do tempo" },
    ],
  },
  {
    slug: "combate",
    nome: "Combate",
    icon: <Swords size={28} />,
    descricao: "Active recall, questões e simulados. Ideal para quem aprende melhor executando.",
    perfil: "Aluno que aprende melhor executando.",
    duracao: "~3 meses para concluir 100%",
    detalhes: [
      { label: "Conteúdo novo", value: "25% do tempo" },
      { label: "Revisão + Flashcards", value: "25% do tempo" },
      { label: "Questões + Simulados", value: "35% do tempo" },
      { label: "Revisão de erros", value: "15% do tempo" },
    ],
  },
  {
    slug: "operativo",
    nome: "Operativo",
    icon: <Layers size={28} />,
    descricao: "Interleaving e alternância estratégica de disciplinas. Ideal para quem aprende melhor alternando.",
    perfil: "Aluno que aprende melhor alternando disciplinas.",
    duracao: "~3-4 meses para concluir 100%",
    detalhes: [
      { label: "Conteúdo novo", value: "30% do tempo" },
      { label: "Revisão + Flashcards", value: "30% do tempo" },
      { label: "Questões", value: "25% do tempo" },
      { label: "Revisão de erros", value: "15% do tempo" },
    ],
  },
  {
    slug: "sobrevivencia",
    nome: "Sobrevivência",
    icon: <Shield size={28} />,
    descricao: "Ritmo totalmente personalizado. Você define horas por dia, dias da semana e data da prova. O sistema distribui o conteúdo proporcionalmente.",
    perfil: "Aluno com rotina restrita que precisa de controle total sobre o ritmo.",
    duracao: "Depende da sua configuração",
    detalhes: [
      { label: "Horas por dia", value: "Você define" },
      { label: "Dias por semana", value: "Você define" },
      { label: "Data da prova", value: "Você informa" },
      { label: "Distribuição", value: "Proporcional ao tempo" },
    ],
  },
];

export function EscolherMetodoModal({ onSelecionar, onClose }: { onSelecionar: (slug: string) => Promise<void>; onClose?: () => void }) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passo, setPasso] = useState<"escolher" | "explicacao">("explicacao");

  const handleConfirmar = async () => {
    if (!selecionado) return;
    setLoading(true);
    try {
      await onSelecionar(selecionado);
    } finally {
      setLoading(false);
    }
  };

  const metodoSelecionado = METODOS.find((m) => m.slug === selecionado);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        padding: 16,
        overflow: "auto",
      }}
    >
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-em)",
          borderRadius: "var(--radius-lg)",
          padding: "28px 24px",
          maxWidth: 720,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {passo === "explicacao" ? (
          <>
            {/* ===== EXPLICAÇÃO DA LÓGICA ===== */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
                <Zap size={32} color="var(--color-amber-em)" />
                <Target size={32} color="var(--color-olive-em)" />
                <Brain size={32} color="var(--color-navy-em)" />
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>
                Como funciona seu plano de estudo
              </h2>
              <p className="muted" style={{ fontSize: 14, maxWidth: 540, margin: "0 auto", lineHeight: 1.6 }}>
                Antes de escolher um método, entenda como o sistema organiza seus estudos automaticamente.
              </p>
            </div>

            <div className="grid" style={{ gap: 16, marginBottom: 24 }}>
              {/* CICLOS */}
              <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Repeat size={18} color="var(--color-amber-em)" />
                  <strong>Sistema de Ciclos</strong>
                </div>
                <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.55 }}>
                  Um ciclo é concluído quando você passa por <strong>100% da matéria</strong>. Após concluir, inicia-se automaticamente o próximo ciclo, que aumenta revisões, flashcards, questões e foco em erros. Não há data fixa — o ritmo é seu.
                </p>
              </div>

              {/* CÁLCULO */}
              <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Clock size={18} color="var(--color-olive-em)" />
                  <strong>Como o sistema calcula</strong>
                </div>
                <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.55 }}>
                  Base de <strong>3h/dia</strong> (ou a que você definir no modo Sobrevivência). Cada tema = ~20 min, cada flashcard = ~1,5 min, cada questão = ~2,5 min. A distribuição do tempo segue o percentual do método escolhido. O sistema aloca automaticamente os conteúdos na sua missão diária.
                </p>
              </div>

              {/* REVISÕES */}
              <div style={{ padding: "14px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Brain size={18} color="var(--color-navy-em)" />
                  <strong>Revisões automáticas</strong>
                </div>
                <p className="muted" style={{ fontSize: 13, margin: 0, lineHeight: 1.55 }}>
                  Todo conteúdo estudado gera revisões programadas automaticamente nos intervalos: 24h, 3 dias, 7 dias, 15 dias e 30 dias. Isso garante retenção de longo prazo sem você precisar se preocupar em agendar.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button onClick={() => setPasso("escolher")}>
                Entendi, quero escolher meu método <Zap size={16} />
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* ===== ESCOLHA DO MÉTODO ===== */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, textTransform: "uppercase", margin: "0 0 4px" }}>
                Escolha seu método de estudo
              </h2>
              <p className="muted" style={{ fontSize: 14 }}>
                Você poderá trocar depois nas configurações do perfil.
              </p>
            </div>

            <div className="grid" style={{ gap: 10, marginBottom: 20 }}>
              {METODOS.map((metodo) => {
                const ativo = selecionado === metodo.slug;
                return (
                  <div
                    key={metodo.slug}
                    onClick={() => setSelecionado(metodo.slug)}
                    style={{
                      cursor: "pointer",
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      border: ativo ? "2px solid var(--color-amber)" : "1px solid var(--color-border)",
                      background: ativo ? "rgba(212, 144, 10, 0.06)" : "var(--color-surface-2)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ color: ativo ? "var(--color-amber-em)" : "var(--color-text-muted)", marginTop: 2 }}>
                        {metodo.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <strong style={{ fontSize: 17 }}>{metodo.nome}</strong>
                          <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                            {metodo.duracao}
                          </span>
                        </div>
                        <p className="muted" style={{ fontSize: 13, margin: "0 0 8px", lineHeight: 1.5 }}>
                          {metodo.descricao}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--color-olive-em)", margin: "0 0 8px" }}>
                          {metodo.perfil}
                        </p>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {metodo.detalhes.map((d) => (
                            <span
                              key={d.label}
                              style={{
                                fontSize: 11,
                                padding: "2px 7px",
                                borderRadius: 999,
                                background: "rgba(107, 124, 92, 0.12)",
                                color: "var(--color-olive-em)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {d.label}: {d.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setPasso("explicacao")}>
                Voltar
              </Button>
              <Button onClick={handleConfirmar} disabled={!selecionado || loading}>
                {loading ? "Configurando..." : "Iniciar com este método"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
