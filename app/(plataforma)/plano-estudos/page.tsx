"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Layers,
  RefreshCw,
  Shield,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// ============================================================
// TIPOS
// ============================================================

interface Tarefa {
  id: string;
  tipo: string;
  recursoId: string | null;
  descricao: string;
  concluida: boolean;
}

interface Missao {
  id: string;
  data: string;
  concluida: boolean;
  conteudosParaEstudar: string[];
  revisoesParaFazer: string[];
  flashcardsParaFazer: string[];
  questoesParaFazer: number;
  simuladoParaFazer: boolean;
  tarefas: Tarefa[];
}

interface Ciclo {
  numero: number;
  status: string;
  dataInicio: string;
  progresso: number;
  conteudosVistos: number;
  totalConteudos: number;
  flashcardsVistos: number;
  totalFlashcards: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
}

interface Plano {
  id: string;
  metodoNome: string;
  metodoSlug: string;
  metodoDescricao: string;
  dataInicio: string;
  status: string;
  horasDia: number | null;
  diasSemana: number[];
  estudaFds: boolean;
  dataProva: string | null;
  previsaoConclusao: string | null;
  minutosConteudo: number | null;
  minutosFlashcards: number | null;
  minutosQuestoes: number | null;
  minutosSimulado: number | null;
  metodoPesos: {
    conteudoNovo: number;
    revisaoFlashcards: number;
    questoes: number;
  };
}

interface RevisaoProgramada {
  id: string;
  temaId: string;
  nomeTema: string;
  dataRevisao: string;
  intervalo: string;
  concluida: boolean;
}

interface HistoricoCiclo {
  numeroCiclo: number;
  metodoNome: string;
  dataInicio: string;
  dataFim: string;
  conteudosVistos: number;
  flashcardsVistos: number;
  questoesRealizadas: number;
  taxaAcerto: number;
}

interface CronogramaItem {
  dia: string;
  data: string;
  tarefas: { tipo: string; descricao: string }[];
}

interface DadosPlano {
  plano: Plano;
  ciclo: Ciclo | null;
  missao: Missao | null;
  cronogramaSemanal: CronogramaItem[];
  revisoesProgramadas: RevisaoProgramada[];
  historicoCiclos: HistoricoCiclo[];
  progressoGeral: {
    percentualEstudado: number;
    percentualRevisado: number;
    flashcardsConcluidos: number;
    questoesRealizadas: number;
  };
}

// ============================================================
// CONSTANTES
// ============================================================

const METODOS = [
  {
    slug: "doutrina",
    nome: "Doutrina",
    icon: BookOpen,
    descricao: "Repetição espaçada e memorização contínua",
    cor: "#8fa876",
    pesos: { conteudoNovo: 45, revisaoFlashcards: 30, questoes: 25 },
  },
  {
    slug: "combate",
    nome: "Combate",
    icon: Swords,
    descricao: "Active recall com questões e simulados",
    cor: "#d4900a",
    pesos: { conteudoNovo: 15, revisaoFlashcards: 20, questoes: 65 },
  },
  {
    slug: "operativo",
    nome: "Operativo",
    icon: Layers,
    descricao: "Interleaving e alternância estratégica",
    cor: "#2d5a9e",
    pesos: { conteudoNovo: 30, revisaoFlashcards: 25, questoes: 45 },
  },
  {
    slug: "sobrevivencia",
    nome: "Sobrevivência",
    icon: Shield,
    descricao: "Ritmo personalizado até a prova",
    cor: "#f0a820",
    pesos: { conteudoNovo: 30, revisaoFlashcards: 25, questoes: 45 },
  },
];

const TIPO_ICONES: Record<string, React.ReactNode> = {
  CONTEUDO: <BookOpen size={14} />,
  REVISAO: <RefreshCw size={14} />,
  FLASHCARD: <Brain size={14} />,
  QUESTAO: <Target size={14} />,
  SIMULADO: <Layers size={14} />,
};

const TIPO_LABELS: Record<string, string> = {
  CONTEUDO: "Conteúdo",
  REVISAO: "Revisão",
  FLASHCARD: "Flashcard",
  QUESTAO: "Questão",
  SIMULADO: "Simulado",
};

const STATUS_MESSAGES: Record<string, string> = {
  ON_TRACK:
    "Com esse ritmo, você consegue concluir todo o conteúdo antes da prova.",
  TIGHT: "Seu cronograma está apertado. Será necessário manter constância.",
  LATE: "Seu ritmo está abaixo do necessário. Considere aumentar a carga horária.",
  INSUFFICIENT:
    "Com essa carga horária, talvez você não consiga concluir todo o conteúdo até a prova.",
};

const NIVEL_CORES: Record<string, { bg: string; text: string }> = {
  ALERTA: { bg: "rgba(212, 70, 10, 0.16)", text: "#e05a30" },
  ATENCAO: { bg: "rgba(212, 144, 10, 0.16)", text: "#f0a820" },
  ESTAVEL: { bg: "rgba(143, 168, 118, 0.16)", text: "#8fa876" },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PlanoEstudosPage() {
  const [dados, setDados] = useState<DadosPlano | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarSobrevivencia, setMostrarSobrevivencia] = useState(false);
  const [mostrarConfigGeral, setMostrarConfigGeral] = useState(false);
  const [configGeralForm, setConfigGeralForm] = useState({ horasDia: 3, diasSemana: [1, 2, 3, 4, 5, 6] as number[] });
  const [sobrevivenciaForm, setSobrevivenciaForm] = useState({
    horasDia: 4,
    diasSemana: [1, 2, 3, 4, 5] as number[],
    estudaFds: false,
    dataProva: "",
    minutosConteudo: 60,
    minutosFlashcards: 40,
    minutosQuestoes: 40,
    minutosSimulado: 30,
  });

  const abrirConfigSobrevivencia = () => {
    if (dados?.plano) {
      setSobrevivenciaForm({
        horasDia: dados.plano.horasDia || 4,
        diasSemana: dados.plano.diasSemana,
        estudaFds: dados.plano.estudaFds,
        dataProva: dados.plano.dataProva
          ? new Date(dados.plano.dataProva).toISOString().split("T")[0]
          : "",
        minutosConteudo: dados.plano.minutosConteudo ?? 60,
        minutosFlashcards: dados.plano.minutosFlashcards ?? 40,
        minutosQuestoes: dados.plano.minutosQuestoes ?? 40,
        minutosSimulado: dados.plano.minutosSimulado ?? 30,
      });
    }
    setMostrarSobrevivencia(true);
  };

  const abrirConfigGeral = () => {
    if (dados?.plano) {
      setConfigGeralForm({
        horasDia: dados.plano.horasDia || 3,
        diasSemana: dados.plano.diasSemana.length > 0 ? dados.plano.diasSemana : [1, 2, 3, 4, 5, 6],
      });
    }
    setMostrarConfigGeral(true);
  };

  const previsaoEmTempoReal = () => {
    if (!dados?.ciclo || !sobrevivenciaForm.dataProva) return null;
    const faltantes = dados.ciclo.totalConteudos - dados.ciclo.conteudosVistos;
    const minPorDia = sobrevivenciaForm.minutosConteudo;
    if (minPorDia <= 0 || faltantes <= 0) return null;
    const temasPorDia = minPorDia / 20;
    const diasEstudo = sobrevivenciaForm.diasSemana.length;
    const temasPorSemana = temasPorDia * diasEstudo;
    if (temasPorSemana <= 0) return null;
    const semanas = Math.ceil(faltantes / temasPorSemana);
    const data = new Date();
    data.setDate(data.getDate() + semanas * 7);
    const dataProva = new Date(sobrevivenciaForm.dataProva);
    return { data, aposProva: data > dataProva };
  };

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/plano-estudo");
      if (!res.ok) throw new Error("Erro ao carregar dados");
      const data = await res.json();
      setDados(data);
      if (data.plano.horasDia) {
        setSobrevivenciaForm({
          horasDia: data.plano.horasDia,
          diasSemana: data.plano.diasSemana,
          estudaFds: data.plano.estudaFds,
          dataProva: data.plano.dataProva
            ? new Date(data.plano.dataProva).toISOString().split("T")[0]
            : "",
          minutosConteudo: data.plano.minutosConteudo || 60,
          minutosFlashcards: data.plano.minutosFlashcards || 40,
          minutosQuestoes: data.plano.minutosQuestoes || 40,
          minutosSimulado: data.plano.minutosSimulado || 30,
        });
      }
      setError("");
    } catch (e) {
      setError("Não foi possível carregar o plano de estudo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const concluirTarefa = async (tarefaId: string) => {
    try {
      const res = await fetch("/api/plano-estudo/missao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarefaId }),
      });
      if (res.ok) carregarDados();
    } catch {
      // silently fail
    }
  };

  const salvarSobrevivencia = async () => {
    try {
      const res = await fetch("/api/plano-estudo/sobrevivencia", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sobrevivenciaForm),
      });
      if (res.ok) {
        setMostrarSobrevivencia(false);
        carregarDados();
      }
    } catch {
      // silently fail
    }
  };

  const salvarConfigGeral = async () => {
    try {
      const res = await fetch("/api/plano-estudo/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configGeralForm),
      });
      if (res.ok) {
        setMostrarConfigGeral(false);
        carregarDados();
      }
    } catch {
      // silently fail
    }
  };

  const finalizarCiclo = async () => {
    try {
      const res = await fetch("/api/plano-estudo/ciclo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) carregarDados();
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <div className="grid" style={{ gap: 24 }}>
        <div>
          <Badge>Carregando...</Badge>
          <h2 className="page-title" style={{ marginTop: 14 }}>
            Plano de estudo
          </h2>
        </div>
        <p className="muted">Carregando seu plano de estudo...</p>
      </div>
    );
  }

  if (error || !dados) {
    return (
      <div className="grid" style={{ gap: 24 }}>
        <h2 className="page-title">Plano de estudo</h2>
        <Card>
          <p className="muted">{error || "Erro ao carregar"}</p>
          <Button onClick={carregarDados} style={{ marginTop: 12 }}>
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  const metodoAtual = METODOS.find((m) => m.slug === dados.plano.metodoSlug) || METODOS[0];

  return (
    <div className="grid" style={{ gap: 24 }}>
      {/* ===== CABEÇALHO ===== */}
      <section style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
        <div>
          <Badge>{metodoAtual.nome}</Badge>
          <h2 className="page-title" style={{ marginTop: 14 }}>
            Plano de estudo
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {dados.plano.metodoSlug === "sobrevivencia" ? (
            <Button variant="secondary" onClick={abrirConfigSobrevivencia}>
              <Clock size={16} /> Configurar ritmo
            </Button>
          ) : (
            <Button variant="secondary" onClick={abrirConfigGeral}>
              <Clock size={16} /> Configurar horas
            </Button>
          )}
        </div>
      </section>

      {/* ===== CONFIGURAÇÃO GERAL (HORAS/DIA) ===== */}
      {mostrarConfigGeral && dados.plano.metodoSlug !== "sobrevivencia" && (
        <Card>
          <h3 className="section-title" style={{ fontSize: 20, marginBottom: 16 }}>
            <Clock size={20} style={{ marginRight: 8 }} />
            Configurar horas de estudo
          </h3>

          <div className="grid grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Horas por dia
              </label>
              <select
                className="input"
                value={configGeralForm.horasDia}
                onChange={(e) => setConfigGeralForm({ ...configGeralForm, horasDia: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                  <option key={h} value={h}>{h}h / dia</option>
                ))}
              </select>
            </div>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Dias de estudo
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { value: 1, label: "Seg" },
                  { value: 2, label: "Ter" },
                  { value: 3, label: "Qua" },
                  { value: 4, label: "Qui" },
                  { value: 5, label: "Sex" },
                  { value: 6, label: "Sáb" },
                  { value: 0, label: "Dom" },
                ].map((dia) => {
                  const selecionado = configGeralForm.diasSemana.includes(dia.value);
                  return (
                    <button
                      key={dia.value}
                      type="button"
                      onClick={() => {
                        setConfigGeralForm({
                          ...configGeralForm,
                          diasSemana: selecionado
                            ? configGeralForm.diasSemana.filter((d) => d !== dia.value)
                            : [...configGeralForm.diasSemana, dia.value],
                        });
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                        border: selecionado ? "2px solid var(--color-olive-em)" : "2px solid var(--color-border)",
                        background: selecionado ? "rgba(143, 168, 118, 0.12)" : "transparent",
                        color: selecionado ? "var(--color-olive-em)" : "var(--color-text-muted)",
                        fontWeight: selecionado ? 600 : 400,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Distribuição do método */}
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              marginBottom: 16,
            }}
          >
            <p className="muted" style={{ fontSize: 13, marginBottom: 10, fontWeight: 500 }}>
              Distribuição do método <strong style={{ color: metodoAtual.cor }}>{metodoAtual.nome}</strong> ({configGeralForm.horasDia}h/dia):
            </p>
            <div className="grid" style={{ gap: 6 }}>
              {(() => {
                const pesos = dados.plano.metodoPesos || metodoAtual.pesos;
                const totalMin = configGeralForm.horasDia * 60;
                const conteudoTemas = Math.max(1, Math.round((totalMin * pesos.conteudoNovo / 100) / 20));
                const flashcardsQtd = Math.max(1, Math.round((totalMin * pesos.revisaoFlashcards / 100) / 1.5));
                const questoesQtd = Math.max(1, Math.round((totalMin * pesos.questoes / 100) / 2.5));
                const minConteudo = conteudoTemas * 20;
                const minFlash = Math.round(flashcardsQtd * 1.5);
                const minQuest = Math.round(questoesQtd * 2.5);
                const itens = [
                  { label: "Conteúdo novo", pct: pesos.conteudoNovo, min: minConteudo },
                  { label: "Flashcards", pct: pesos.revisaoFlashcards, min: minFlash },
                  { label: "Questões", pct: pesos.questoes, min: minQuest },
                ];
                return (
                  <>
                    {itens.map((item) => (
                      <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span>{item.label}</span>
                        <span className="muted">
                          {item.pct}% · ~{item.min} min
                        </span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: "1px solid var(--color-border)", paddingTop: 6 }}>
                      <span style={{ color: "var(--color-olive-em)" }}>+ Revisão espaçada (½ conteúdo)</span>
                      <span className="muted" style={{ color: "var(--color-olive-em)" }}>
                        +{Math.round(minConteudo / 2 / 20) * 20} min
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={salvarConfigGeral}>
              <CheckCircle2 size={16} /> Salvar
            </Button>
            <Button variant="secondary" onClick={() => setMostrarConfigGeral(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* ===== MODO SOBREVIVÊNCIA ===== */}
      {mostrarSobrevivencia && dados.plano.metodoSlug === "sobrevivencia" && (
        <Card>
          <h3 className="section-title" style={{ fontSize: 20, marginBottom: 16 }}>
            <Clock size={20} style={{ marginRight: 8 }} />
            Configuração do ritmo
          </h3>
          <div className="grid grid-2" style={{ gap: 16 }}>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 4 }}>
                Minutos de conteúdo por dia
              </label>
              <select
                className="input"
                value={sobrevivenciaForm.minutosConteudo}
                onChange={(e) => setSobrevivenciaForm({ ...sobrevivenciaForm, minutosConteudo: Number(e.target.value) })}
              >
                {[15, 30, 45, 60, 90, 120, 150, 180].map((m) => (
                  <option key={m} value={m}>{m} min ({Math.round(m / 20)} temas)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 4 }}>
                Minutos de flashcards por dia
              </label>
              <select
                className="input"
                value={sobrevivenciaForm.minutosFlashcards}
                onChange={(e) => setSobrevivenciaForm({ ...sobrevivenciaForm, minutosFlashcards: Number(e.target.value) })}
              >
                {[0, 15, 20, 30, 40, 60, 90].map((m) => (
                  <option key={m} value={m}>{m} min ({Math.round(m / 1.5)} cards)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 4 }}>
                Minutos de questões por dia
              </label>
              <select
                className="input"
                value={sobrevivenciaForm.minutosQuestoes}
                onChange={(e) => setSobrevivenciaForm({ ...sobrevivenciaForm, minutosQuestoes: Number(e.target.value) })}
              >
                {[0, 15, 30, 40, 60, 90].map((m) => (
                  <option key={m} value={m}>{m} min ({Math.round(m / 2.5)} questões)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 4 }}>
                Minutos de simulado por dia
              </label>
              <select
                className="input"
                value={sobrevivenciaForm.minutosSimulado}
                onChange={(e) => setSobrevivenciaForm({ ...sobrevivenciaForm, minutosSimulado: Number(e.target.value) })}
              >
                {[0, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m} min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 4 }}>
                Dias da semana
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { value: 1, label: "Seg" },
                  { value: 2, label: "Ter" },
                  { value: 3, label: "Qua" },
                  { value: 4, label: "Qui" },
                  { value: 5, label: "Sex" },
                  { value: 6, label: "Sáb" },
                  { value: 0, label: "Dom" },
                ].map((dia) => {
                  const selecionado = sobrevivenciaForm.diasSemana.includes(dia.value);
                  return (
                    <button
                      key={dia.value}
                      type="button"
                      className="button"
                      style={{
                        background: selecionado ? "var(--color-amber)" : "var(--color-surface-2)",
                        color: selecionado ? "#141007" : "var(--color-text)",
                        minHeight: 36,
                        padding: "0 12px",
                      }}
                      onClick={() => {
                        const dias = selecionado
                          ? sobrevivenciaForm.diasSemana.filter((d) => d !== dia.value)
                          : [...sobrevivenciaForm.diasSemana, dia.value];
                        setSobrevivenciaForm({ ...sobrevivenciaForm, diasSemana: dias });
                      }}
                    >
                      {dia.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="muted" style={{ display: "block", marginBottom: 4 }}>
                Data da prova
              </label>
              <input
                type="date"
                className="input"
                value={sobrevivenciaForm.dataProva}
                onChange={(e) => setSobrevivenciaForm({ ...sobrevivenciaForm, dataProva: e.target.value })}
              />
            </div>
          </div>

          {/* Previsão em tempo real */}
          {(() => {
            const p = previsaoEmTempoReal();
            if (!p) return null;
            return (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-em)",
                  background: p.aposProva ? "rgba(212, 70, 10, 0.06)" : "rgba(143, 168, 118, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <TrendingUp size={18} color={p.aposProva ? "#e05a30" : "var(--color-olive-em)"} />
                <div>
                  <strong style={{ fontSize: 14 }}>Previsão de conclusão do ciclo</strong>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 2 }}>
                    {p.data.toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {p.aposProva && (
                      <span style={{ color: "#e05a30", marginLeft: 8 }}>(após a prova!)</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Button onClick={salvarSobrevivencia}>
              <CheckCircle2 size={16} /> Salvar e recalcular
            </Button>
            <Button variant="secondary" onClick={() => setMostrarSobrevivencia(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* ===== PROGRESSO GERAL + STATUS ===== */}
      <section className="grid grid-4">
        <Card>
          <span className="muted">Método</span>
          <div className="metric-value" style={{ fontSize: 22 }}>{metodoAtual.nome}</div>
          <small className="muted">{dados.plano.metodoDescricao}</small>
        </Card>
        <Card>
          <span className="muted">Ciclo atual</span>
          <div className="metric-value">
            {dados.ciclo ? `Ciclo ${dados.ciclo.numero}` : "—"}
          </div>
          <small className="muted">
            {dados.ciclo?.status === "EM_ANDAMENTO" ? "Em andamento" : "Concluído"}
          </small>
        </Card>
        <Card>
          <span className="muted">Progresso do ciclo</span>
          <div className="metric-value">{dados.ciclo?.progresso || 0}%</div>
          <small className="muted">
            {dados.ciclo ? `${dados.ciclo.conteudosVistos} de ${dados.ciclo.totalConteudos} temas` : "—"}
          </small>
        </Card>
        <Card>
          <span className="muted">Status do cronograma</span>
          <div
            className="metric-value"
            style={{
              fontSize: 20,
              color:
                dados.plano.status === "ON_TRACK"
                  ? "var(--color-olive-em)"
                  : dados.plano.status === "TIGHT"
                  ? "var(--color-amber-em)"
                  : "#e05a30",
            }}
          >
            {dados.plano.status === "ON_TRACK"
              ? "No ritmo"
              : dados.plano.status === "TIGHT"
              ? "Apertado"
              : dados.plano.status === "LATE"
              ? "Atrasado"
              : "Insuficiente"}
          </div>
        </Card>
      </section>
      <p
        className="muted"
        style={{
          padding: "12px 16px",
          borderLeft: `3px solid ${
            dados.plano.status === "ON_TRACK"
              ? "var(--color-olive-em)"
              : dados.plano.status === "TIGHT"
              ? "var(--color-amber-em)"
              : "#e05a30"
          }`,
          background:
            dados.plano.status === "ON_TRACK"
              ? "rgba(143, 168, 118, 0.06)"
              : dados.plano.status === "TIGHT"
              ? "rgba(212, 144, 10, 0.06)"
              : "rgba(212, 70, 10, 0.06)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        {STATUS_MESSAGES[dados.plano.status] || ""}
      </p>

      {/* ===== MISSÃO DO DIA ===== */}
      <section>
        <h3 className="section-title" style={{ fontSize: 24, marginBottom: 16 }}>
          <Target size={20} style={{ marginRight: 8 }} />
          Missão do dia
        </h3>
        {dados.missao ? (
          <Card>
            {dados.missao.tarefas.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "rgba(143, 168, 118, 0.12)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 16,
                }}
              >
                <span style={{ color: "var(--color-olive-em)", fontWeight: 600 }}>
                  Hoje é dia de descanso!
                </span>
              </div>
            ) : dados.missao.concluida && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: "rgba(143, 168, 118, 0.12)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 16,
                }}
              >
                <Trophy size={18} color="var(--color-olive-em)" />
                <span style={{ color: "var(--color-olive-em)", fontWeight: 600 }}>
                  Missão do dia concluída!
                </span>
              </div>
            )}
            <div className="grid" style={{ gap: 2 }}>
              {dados.missao.tarefas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: tarefa.concluida
                      ? "rgba(143, 168, 118, 0.06)"
                      : "rgba(255,255,255,0.02)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      opacity: tarefa.concluida ? 0.6 : 1,
                      textDecoration: tarefa.concluida ? "line-through" : "none",
                    }}
                  >
                    <span style={{ color: METODOS.find((m) => m.slug === dados.plano.metodoSlug)?.cor }}>
                      {TIPO_ICONES[tarefa.tipo] || <Circle size={14} />}
                    </span>
                    <div>
                      <span style={{ fontWeight: 500 }}>{tarefa.descricao}</span>
                      <span
                        style={{
                          fontSize: 12,
                          marginLeft: 8,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {TIPO_LABELS[tarefa.tipo] || tarefa.tipo}
                      </span>
                    </div>
                  </div>
                  {!tarefa.concluida && (
                    <Button onClick={() => concluirTarefa(tarefa.id)}>
                      <CheckCircle2 size={16} /> Concluir
                    </Button>
                  )}
                  {tarefa.concluida && (
                    <CheckCircle2 size={18} color="var(--color-olive-em)" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <p className="muted">Nenhuma missão gerada para hoje.</p>
          </Card>
        )}
      </section>

      {/* ===== CRONOGRAMA SEMANAL ===== */}
      <section>
        <h3 className="section-title" style={{ fontSize: 24, marginBottom: 16 }}>
          <CalendarDays size={20} style={{ marginRight: 8 }} />
          Cronograma semanal
        </h3>
        <div className="grid grid-3">
          {dados.cronogramaSemanal.map((dia) => (
            <Card key={dia.dia}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <strong>{dia.dia}</strong>
                <span className="muted" style={{ fontSize: 13 }}>
                  {new Date(dia.data).toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              {dia.tarefas.length > 0 ? (
                <div className="grid" style={{ gap: 8 }}>
                  {dia.tarefas.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                      }}
                    >
                      {TIPO_ICONES[t.tipo] || <Circle size={14} />}
                      <span className="muted">{t.descricao}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 14 }}>
                  Descanso
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      <div className="grid grid-2">
        {/* ===== REVISÕES PROGRAMADAS ===== */}
        <section>
          <h3 className="section-title" style={{ fontSize: 24, marginBottom: 16 }}>
            <RefreshCw size={20} style={{ marginRight: 8 }} />
            Revisões programadas
          </h3>
          <Card>
            {dados.revisoesProgramadas.length > 0 ? (
              <div className="grid" style={{ gap: 8 }}>
                {dados.revisoesProgramadas.slice(0, 8).map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--color-border)",
                      background: rev.concluida
                        ? "rgba(143, 168, 118, 0.06)"
                        : "transparent",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>
                        {rev.nomeTema}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        {new Date(rev.dataRevisao).toLocaleDateString("pt-BR")} · {rev.intervalo}
                      </div>
                    </div>
                    <Badge>{rev.intervalo}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">
                As revisões serão geradas conforme você avança no conteúdo.
              </p>
            )}
          </Card>
        </section>
      </div>

      {/* ===== PROGRESSO GERAL ===== */}
      <section>
        <h3 className="section-title" style={{ fontSize: 24, marginBottom: 16 }}>
          <TrendingUp size={20} style={{ marginRight: 8 }} />
          Progresso geral
        </h3>
        <div className="grid grid-4">
          <Card>
            <span className="muted">Conteúdo estudado</span>
            <div className="metric-value">
              {dados.progressoGeral.percentualEstudado}%
            </div>
            <div className="progress" style={{ marginTop: 8 }}>
              <span style={{ width: `${dados.progressoGeral.percentualEstudado}%` }} />
            </div>
          </Card>
          <Card>
            <span className="muted">Flashcards</span>
            <div className="metric-value">
              {dados.progressoGeral.flashcardsConcluidos}
            </div>
            <small className="muted">revisados</small>
          </Card>
          <Card>
            <span className="muted">Questões realizadas</span>
            <div className="metric-value">
              {dados.progressoGeral.questoesRealizadas}
            </div>
            <small className="muted">no ciclo atual</small>
          </Card>
          <Card>
            <span className="muted">Ciclo atual</span>
            <div className="metric-value" style={{ fontSize: 24 }}>
              {dados.ciclo ? `Ciclo ${dados.ciclo.numero}` : "—"}
            </div>
            <div className="progress" style={{ marginTop: 8 }}>
              <span style={{ width: `${dados.ciclo?.progresso || 0}%` }} />
            </div>
          </Card>
        </div>
      </section>

      {/* ===== HISTÓRICO DE CICLOS ===== */}
      <section>
        <h3 className="section-title" style={{ fontSize: 24, marginBottom: 16 }}>
          <Trophy size={20} style={{ marginRight: 8 }} />
          Histórico de ciclos
        </h3>
        {dados.historicoCiclos.length > 0 ? (
          <div className="grid" style={{ gap: 12 }}>
            {dados.historicoCiclos.map((h) => (
              <Card key={h.numeroCiclo}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "var(--radius-sm)",
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        fontSize: 18,
                      }}
                    >
                      C{h.numeroCiclo}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>Ciclo {h.numeroCiclo}</div>
                      <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                        {h.metodoNome} ·{" "}
                        {new Date(h.dataInicio).toLocaleDateString("pt-BR")} →{" "}
                        {new Date(h.dataFim).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      fontSize: 14,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <Flame size={16} style={{ marginBottom: 2 }} />
                      <div style={{ fontFamily: "var(--font-mono)" }}>
                        {h.conteudosVistos}
                      </div>
                      <div style={{ fontSize: 11 }}>temas</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <Brain size={16} style={{ marginBottom: 2 }} />
                      <div style={{ fontFamily: "var(--font-mono)" }}>
                        {h.flashcardsVistos}
                      </div>
                      <div style={{ fontSize: 11 }}>flashcards</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <Target size={16} style={{ marginBottom: 2 }} />
                      <div style={{ fontFamily: "var(--font-mono)" }}>
                        {h.questoesRealizadas}
                      </div>
                      <div style={{ fontSize: 11 }}>questões</div>
                    </div>
                    <div style={{ textAlign: "center", color: "var(--color-amber-em)" }}>
                      <TrendingUp size={16} style={{ marginBottom: 2 }} />
                      <div style={{ fontFamily: "var(--font-mono)" }}>
                        {Math.round(h.taxaAcerto)}%
                      </div>
                      <div style={{ fontSize: 11 }}>acerto</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="muted">
              Nenhum ciclo concluído ainda. Complete o primeiro ciclo para ver seu histórico.
            </p>
          </Card>
        )}
      </section>

      {/* ===== CICLO: FINALIZAR ===== */}
      {dados.ciclo && dados.ciclo.status === "EM_ANDAMENTO" && (
        <Card
          style={{
            borderColor: "rgba(143, 168, 118, 0.24)",
            background: "rgba(143, 168, 118, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ fontSize: 18 }}>Finalizar ciclo {dados.ciclo.numero}</strong>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                O ciclo deve ser concluído após 100% do conteúdo. Use esta opção apenas se você
                concluiu todos os temas.
              </p>
            </div>
            <Button
              onClick={finalizarCiclo}
              style={{ background: "var(--color-olive)", whiteSpace: "nowrap" }}
            >
              <Zap size={16} /> Iniciar próximo ciclo
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
