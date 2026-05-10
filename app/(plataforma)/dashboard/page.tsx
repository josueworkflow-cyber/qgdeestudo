import { ArrowRight, BookOpen, CalendarDays, Target, CheckCircle2, Brain, RefreshCw, Layers, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardInicio } from "./DashboardInicio";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const usuarioId = session?.user?.id;

  // Real progress
  const userProgress = usuarioId ? await prisma.progresso.findMany({
    where: { usuarioId }
  }) : [];
  
  const totalLidos = userProgress.filter(p => p.lido).length;
  
  const materias = await prisma.materia.findMany({
    orderBy: { ordem: "asc" },
    include: {
      temas: {
        include: {
          progresso: usuarioId ? {
            where: { usuarioId }
          } : false
        }
      },
    },
  });

  const totalTemas = materias.reduce((acc, materia) => acc + materia.temas.length, 0);
  const progressoGeral = totalTemas > 0 ? Math.round((totalLidos / totalTemas) * 100) : 0;

  // Buscar plano de estudo
  let metodoNome = "—";
  let cicloNumero = 1;
  let missaoHoje: {
    concluida: boolean;
    tarefasPendentes: number;
    totalTarefas: number;
    tarefas: { id: string; tipo: string; descricao: string; concluida: boolean }[];
  } | null = null;
  let temPlano = false;
  let diaDescanso = false;

  if (usuarioId) {
    const plano = await prisma.planoEstudo.findUnique({
      where: { usuarioId },
      include: { metodo: true, ciclos: { where: { status: "EM_ANDAMENTO" }, orderBy: { numero: "desc" }, take: 1 } },
    });

    if (plano) {
      temPlano = true;
      metodoNome = plano.metodo.nome;
      cicloNumero = plano.ciclos[0]?.numero || 1;

      // Verificar se hoje é dia de descanso
      const hojeSemana = new Date().getDay();
      if (plano.diasSemana.length > 0 && !plano.diasSemana.includes(hojeSemana)) {
        diaDescanso = true;
      }

      if (!diaDescanso) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const missao = await prisma.missaoDiaria.findFirst({
        where: { planoId: plano.id, data: { gte: hoje, lt: amanha } },
        include: { tarefas: true },
      });

      if (missao) {
        const pendentes = missao.tarefas.filter(t => !t.concluida).length;
        missaoHoje = {
          concluida: missao.concluida,
          tarefasPendentes: pendentes,
          totalTarefas: missao.tarefas.length,
          tarefas: missao.tarefas.map(t => ({
            id: t.id,
            tipo: t.tipo,
            descricao: t.descricao,
            concluida: t.concluida,
          })),
        };
      }
      }
    }
  }

  const metricas = [
    { rotulo: "Progresso geral", valor: `${progressoGeral}%`, detalhe: `${totalLidos} de ${totalTemas} capítulos` },
    { rotulo: "Método", valor: metodoNome, detalhe: `Ciclo ${cicloNumero}` },
    { rotulo: "Media simulados", valor: "0%", detalhe: "sem dados" },
    { rotulo: "Sequencia", valor: "0", detalhe: "dias ativos" }
  ];

  return (
    <>
      <DashboardInicio temPlano={temPlano} />
      <div className="grid" style={{ gap: 28 }}>
        <section style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 18 }}>
          <div>
            <Badge>Fase 1</Badge>
            <h2 className="page-title" style={{ marginTop: 14 }}>
              Painel de prontidão
            </h2>
          </div>
          <Button href="/conteudo">
            Continuar estudo <ArrowRight size={18} />
          </Button>
        </section>

        <section className="grid grid-4">
          {metricas.map((metrica) => (
            <Card key={metrica.rotulo}>
              <span className="muted">{metrica.rotulo}</span>
              <div className="metric-value">{metrica.valor}</div>
              <small className="muted">{metrica.detalhe}</small>
            </Card>
          ))}
        </section>

        <section className="grid grid-2">
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h3 className="section-title" style={{ fontSize: 24 }}>Matérias</h3>
              <BookOpen size={20} color="var(--color-olive-em)" />
            </div>
            <div className="grid" style={{ gap: 16 }}>
              {materias.map((materia) => {
                const temasLidos = materia.temas.filter(t => t.progresso?.some(p => p.lido)).length;
                const tCount = materia.temas.length;
                const pPct = tCount > 0 ? Math.round((temasLidos / tCount) * 100) : 0;
                
                if (tCount === 0) return null;
                
                return (
                  <a key={materia.id} href={`/conteudo/${materia.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <strong style={{ color: "var(--color-text)", fontWeight: 600 }}>{materia.nome}</strong>
                      <span className="muted">{pPct}%</span>
                    </div>
                    <div className="progress">
                      <span style={{ width: `${pPct}%` }} />
                    </div>
                  </a>
                );
              })}
            </div>
          </Card>

          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h3 className="section-title" style={{ fontSize: 24 }}>Missão do dia</h3>
              <Target size={20} color="var(--color-amber-em)" />
            </div>
            {diaDescanso ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(143, 168, 118, 0.1)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: 16,
                }}
              >
                <span style={{ color: "var(--color-olive-em)", fontWeight: 600 }}>
                  Hoje é dia de descanso!
                </span>
              </div>
            ) : missaoHoje ? (
              <>
                {missaoHoje.concluida ? (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "rgba(143, 168, 118, 0.1)",
                      borderRadius: "var(--radius-sm)",
                      marginBottom: 16,
                    }}
                  >
                    <span style={{ color: "var(--color-olive-em)", fontWeight: 600 }}>
                      Todas as tarefas de hoje estão concluídas!
                    </span>
                  </div>
                ) : (
                  <p className="muted" style={{ lineHeight: 1.55, marginBottom: 12, fontSize: 14 }}>
                    {missaoHoje.tarefasPendentes} de {missaoHoje.totalTarefas} tarefas pendentes
                  </p>
                )}
                <div className="progress" style={{ marginBottom: 16 }}>
                  <span
                    style={{
                      width: `${missaoHoje.totalTarefas > 0 ? Math.round(((missaoHoje.totalTarefas - missaoHoje.tarefasPendentes) / missaoHoje.totalTarefas) * 100) : 0}%`,
                    }}
                  />
                </div>
                <div className="grid" style={{ gap: 6, marginBottom: 16 }}>
                  {missaoHoje.tarefas.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                        background: t.concluida ? "rgba(143, 168, 118, 0.06)" : "rgba(255,255,255,0.02)",
                        border: "1px solid var(--color-border)",
                        opacity: t.concluida ? 0.6 : 1,
                        textDecoration: t.concluida ? "line-through" : "none",
                        fontSize: 13,
                      }}
                    >
                      {t.tipo === "CONTEUDO" && <BookOpen size={14} color="#8fa876" />}
                      {t.tipo === "REVISAO" && <RefreshCw size={14} color="#d4900a" />}
                      {t.tipo === "FLASHCARD" && <Brain size={14} color="#6b7c5c" />}
                      {t.tipo === "QUESTAO" && <Target size={14} color="#2d5a9e" />}
                      {t.tipo === "SIMULADO" && <Layers size={14} color="#9a6e3d" />}
                      {t.tipo === "REVISAO_ERRO" && <TriangleAlert size={14} color="#e05a30" />}
                      <span>{t.descricao}</span>
                      {t.concluida && (
                        <CheckCircle2 size={14} color="var(--color-olive-em)" style={{ marginLeft: "auto", flexShrink: 0 }} />
                      )}
                    </div>
                  ))}
                </div>
                <Button href="/plano-estudos">
                  <CalendarDays size={16} /> Ver plano completo
                </Button>
              </>
            ) : (
              <>
                <p className="muted" style={{ lineHeight: 1.55, marginBottom: 24 }}>
                  Acesse o plano de estudos para receber sua missão diária com conteúdo, revisões, flashcards e questões.
                </p>
                <Button href="/plano-estudos">
                  <CalendarDays size={16} /> Acessar plano de estudo
                </Button>
              </>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}