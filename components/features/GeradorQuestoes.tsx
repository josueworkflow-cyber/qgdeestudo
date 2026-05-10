"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BrainCircuit, CheckCircle2, XCircle } from "lucide-react";

type QuestaoGerada = {
  enunciado: string;
  alternativas: Record<string, string>;
  gabarito: string;
  explicacao: string;
};

export function GeradorQuestoes({ temaId }: { temaId: string }) {
  const [quantidade, setQuantidade] = useState(5);
  const [dificuldade, setDificuldade] = useState<"facil" | "medio" | "dificil">("medio");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questoes, setQuestoes] = useState<QuestaoGerada[] | null>(null);
  
  // Estado para a resolução
  const [respostasAluno, setRespostasAluno] = useState<Record<number, string>>({});
  const [mostrarGabarito, setMostrarGabarito] = useState(false);

  const gerarQuestoes = async () => {
    if (!temaId || isGenerating) return;

    setIsGenerating(true);
    setQuestoes(null);
    setRespostasAluno({});
    setMostrarGabarito(false);

    try {
      const response = await fetch("/api/assistente/questoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temaId, quantidade, dificuldade }),
      });

      const data = await response.json();
      if (data.questoes) {
        setQuestoes(data.questoes);
      } else {
        alert("Erro ao gerar questões. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao gerar questões:", error);
      alert("Erro de comunicação com o servidor.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selecionarAlternativa = (indexQuestao: number, letra: string) => {
    if (mostrarGabarito) return;
    setRespostasAluno(prev => ({ ...prev, [indexQuestao]: letra }));
  };

  const calcularAcertos = () => {
    if (!questoes) return 0;
    return questoes.reduce((total, q, idx) => {
      return total + (respostasAluno[idx] === q.gabarito ? 1 : 0);
    }, 0);
  };

  if (!temaId) {
    return (
      <div className="chat-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="welcome-message">
          <BrainCircuit size={48} />
          <h3 style={{ margin: 0 }}>Gerador de Questões</h3>
          <p>Selecione um tema acima para gerar um simulado rápido inédito.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      {!questoes && (
        <div className="questao-card">
          <h3 style={{ marginTop: 0 }}>Configurar Questões</h3>
          <p className="muted" style={{ marginBottom: 24 }}>A IA criará questões inéditas focadas no tema selecionado.</p>
          
          <div className="questao-config">
            <div className="field">
              <label className="muted">Quantidade: <strong>{quantidade}</strong></label>
              <input 
                type="range" 
                min="3" 
                max="10" 
                value={quantidade} 
                onChange={e => setQuantidade(Number(e.target.value))}
                className="range-slider"
                style={{ height: 40 }}
              />
            </div>
            
            <div className="field">
              <label className="muted">Dificuldade</label>
              <div className="difficulty-group">
                <button 
                  className={`difficulty-btn ${dificuldade === "facil" ? "selected" : ""}`}
                  onClick={() => setDificuldade("facil")}
                >Fácil</button>
                <button 
                  className={`difficulty-btn ${dificuldade === "medio" ? "selected" : ""}`}
                  onClick={() => setDificuldade("medio")}
                >Médio</button>
                <button 
                  className={`difficulty-btn ${dificuldade === "dificil" ? "selected" : ""}`}
                  onClick={() => setDificuldade("dificil")}
                >Difícil</button>
              </div>
            </div>
          </div>

          <Button 
            className="w-full" 
            style={{ marginTop: 24, width: '100%' }} 
            onClick={gerarQuestoes}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="spinner"></span>
                Gerando questões com IA...
              </>
            ) : (
              <>
                <BrainCircuit size={18} />
                Gerar Questões Agora
              </>
            )}
          </Button>
        </div>
      )}

      {questoes && (
        <>
          <div className="grid">
            {questoes.map((q, idx) => (
              <div key={idx} className="questao-card">
                <h4 style={{ margin: "0 0 16px 0", fontSize: 18 }}>{idx + 1}. {q.enunciado}</h4>
                
                <div className="grid" style={{ gap: 8 }}>
                  {Object.entries(q.alternativas).map(([letra, texto]) => {
                    const isSelected = respostasAluno[idx] === letra;
                    const isCorrect = q.gabarito === letra;
                    
                    let btnClass = "question-option";
                    if (isSelected) btnClass += " selected";
                    
                    if (mostrarGabarito) {
                      if (isCorrect) btnClass += " correct";
                      else if (isSelected && !isCorrect) btnClass += " wrong";
                    }

                    return (
                      <button 
                        key={letra} 
                        className={btnClass}
                        onClick={() => selecionarAlternativa(idx, letra)}
                        disabled={mostrarGabarito}
                      >
                        <span style={{ fontWeight: "bold", width: 24 }}>{letra}.</span>
                        <span>{texto}</span>
                        {mostrarGabarito && isCorrect && <CheckCircle2 size={18} color="#4caf50" style={{ marginLeft: "auto" }} />}
                        {mostrarGabarito && isSelected && !isCorrect && <XCircle size={18} color="#f44336" style={{ marginLeft: "auto" }} />}
                      </button>
                    );
                  })}
                </div>

                {mostrarGabarito && (
                  <div className="explicacao">
                    <strong>Explicação:</strong> {q.explicacao}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!mostrarGabarito ? (
            <Button 
              style={{ width: "100%", padding: "20px 0", fontSize: 16 }}
              onClick={() => {
                if (Object.keys(respostasAluno).length < questoes.length) {
                  if (!confirm("Você ainda não respondeu todas as questões. Deseja ver o gabarito mesmo assim?")) return;
                }
                setMostrarGabarito(true);
              }}
            >
              Concluir e Ver Gabarito
            </Button>
          ) : (
            <div className="grid grid-2" style={{ alignItems: "center" }}>
              <div className="score-card">
                <div>
                  <div className="muted" style={{ textTransform: "uppercase", fontWeight: "bold" }}>Seu Resultado</div>
                  <div className="score-value">{calcularAcertos()} / {questoes.length}</div>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setQuestoes(null)} style={{ height: "100%" }}>
                Gerar Novas Questões
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
