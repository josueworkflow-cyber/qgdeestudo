"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Questao = {
  id: string;
  enunciado: string;
  alternativas: Record<string, string>;
  gabarito: string;
  explicacao: string;
};

export function SimuladoRunner({ questoes }: { questoes: Questao[] }) {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [finalizado, setFinalizado] = useState(false);
  const questao = questoes[indice];

  const acertos = useMemo(
    () => questoes.filter((item) => respostas[item.id] === item.gabarito).length,
    [questoes, respostas]
  );

  if (finalizado) {
    return (
      <Card>
        <h3 className="section-title">Resultado operacional</h3>
        <div className="metric-value">
          {acertos}/{questoes.length}
        </div>
        <p className="muted">
          Aproveitamento de {Math.round((acertos / questoes.length) * 100)}% neste diagnostico.
        </p>
        <div className="grid" style={{ marginTop: 22 }}>
          {questoes.map((item, index) => {
            const correta = respostas[item.id] === item.gabarito;
            return (
              <div className="card" key={item.id}>
                <strong>
                  {index + 1}. {correta ? "Correta" : "Revisar"} · gabarito {item.gabarito}
                </strong>
                <p className="muted">{item.explicacao}</p>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 22 }}>
          <Button href="/simulados">Voltar aos simulados</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span className="muted">
          Questao {indice + 1} de {questoes.length}
        </span>
        <span className="muted">Tempo alvo: 20 min</span>
      </div>

      <h3 className="section-title" style={{ marginTop: 18 }}>
        {questao.enunciado}
      </h3>

      <div className="grid" style={{ marginTop: 20 }}>
        {Object.entries(questao.alternativas).map(([letra, texto]) => {
          const selecionada = respostas[questao.id] === letra;
          return (
            <button
              className="question-option"
              key={letra}
              onClick={() => setRespostas((current) => ({ ...current, [questao.id]: letra }))}
              type="button"
            >
              {selecionada ? <CheckCircle2 color="var(--color-amber-em)" /> : <Circle />}
              <span>
                <strong>{letra}</strong> · {texto}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Button
          disabled={indice === 0}
          onClick={() => setIndice((current) => Math.max(0, current - 1))}
          type="button"
          variant="secondary"
        >
          Anterior
        </Button>
        {indice === questoes.length - 1 ? (
          <Button onClick={() => setFinalizado(true)} type="button">
            Finalizar
          </Button>
        ) : (
          <Button onClick={() => setIndice((current) => current + 1)} type="button">
            Proxima
          </Button>
        )}
      </div>
    </Card>
  );
}
