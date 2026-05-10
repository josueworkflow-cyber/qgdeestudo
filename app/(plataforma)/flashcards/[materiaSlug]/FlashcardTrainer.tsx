"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { FlashcardData } from "@/lib/flashcards";

type Props = {
  cards: FlashcardData[];
};

export function FlashcardTrainer({ cards }: Props) {
  const [indice, setIndice] = useState(0);
  const [virado, setVirado] = useState(false);
  const [resultados, setResultados] = useState<Record<string, "acertou" | "errou">>({});
  const [animando, setAnimando] = useState(false);

  const card = cards[indice];

  const resumo = useMemo(() => {
    const valores = Object.values(resultados);
    return {
      acertou: valores.filter(v => v === "acertou").length,
      errou: valores.filter(v => v === "errou").length,
      restantes: cards.length - valores.length
    };
  }, [resultados, cards.length]);

  const flip = useCallback(() => {
    if (animando) return;
    setAnimando(true);
    setVirado(v => !v);
    setTimeout(() => setAnimando(false), 600);
  }, [animando]);

  const responder = useCallback(
    (resultado: "acertou" | "errou") => {
      setResultados(prev => ({ ...prev, [card.id]: resultado }));
      setVirado(false);
      if (indice < cards.length - 1) {
        setIndice(prev => prev + 1);
      }
    },
    [card.id, indice, cards.length]
  );

  const embaralhar = useCallback(() => {
    setIndice(0);
    setVirado(false);
    setResultados({});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      }
      if (virado) {
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          responder("acertou");
        }
        if (e.key === "e" || e.key === "E") {
          e.preventDefault();
          responder("errou");
        }
      }
      if (!virado) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setIndice(prev => Math.min(prev + 1, cards.length - 1));
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setIndice(prev => Math.max(prev - 1, 0));
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [virado, flip, responder, cards.length]);

  if (!card) return null;

  const progresso = ((indice + 1) / cards.length) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      {/* --- FLASHCARD SCENE --- */}
      <div
        style={{
          perspective: "1200px",
          width: "100%",
          maxWidth: 720,
          height: "clamp(320px, 55vh, 480px)"
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            transformStyle: "preserve-3d",
            transform: virado ? "rotateY(180deg)" : "rotateY(0deg)",
            cursor: "pointer"
          }}
          onClick={flip}
        >
          {/* FRENTE */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: 20,
              background: "linear-gradient(145deg, rgba(12,17,23,0.95) 0%, rgba(22,32,42,0.95) 100%)",
              border: "1px solid rgba(100,130,160,0.15)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 48px",
              overflow: "hidden"
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 20,
                left: 24,
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-amber)",
                opacity: 0.8
              }}
            >
              {card.materiaNome}
            </span>

            <p
              style={{
                fontSize: "clamp(1rem, 2.2vw, 1.35rem)",
                lineHeight: 1.7,
                textAlign: "center",
                color: "rgba(220,228,240,0.92)",
                maxWidth: 560,
                fontWeight: 400,
                fontFamily: "var(--font-body)"
              }}
            >
              {card.frente.split("___________").map((parte, i, arr) => (
                <span key={i}>
                  {parte}
                  {i < arr.length - 1 && (
                    <span
                      style={{
                        display: "inline-block",
                        minWidth: "clamp(80px, 12vw, 160px)",
                        borderBottom: "2px dashed var(--color-amber)",
                        margin: "0 4px",
                        color: "var(--color-amber)",
                        lineHeight: "1em",
                        verticalAlign: "baseline"
                      }}
                    >
                      &nbsp;
                    </span>
                  )}
                </span>
              ))}
            </p>

            <div
              style={{
                position: "absolute",
                bottom: 28,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.8rem"
              }}
            >
              <RotateCw size={16} />
              <span>Toque para virar</span>
            </div>
          </div>

          {/* VERSO */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              borderRadius: 20,
              background: "linear-gradient(145deg, rgba(18,24,32,0.95) 0%, rgba(28,38,52,0.95) 100%)",
              border: "1px solid rgba(240,168,32,0.2)",
              boxShadow: "0 8px 48px rgba(0,0,0,0.4), 0 0 32px rgba(240,168,32,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
              transform: "rotateY(180deg)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 48px",
              overflow: "hidden"
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 20,
                left: 24,
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-amber)",
                opacity: 0.8
              }}
            >
              {card.materiaNome}
            </span>

            <span
              style={{
                position: "absolute",
                top: 20,
                right: 24,
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.25)"
              }}
            >
              {card.temaTitulo}
            </span>

            <p
              style={{
                fontSize: "clamp(1rem, 2.2vw, 1.35rem)",
                lineHeight: 1.7,
                textAlign: "center",
                color: "rgba(220,228,240,0.85)",
                maxWidth: 560,
                fontWeight: 400,
                fontFamily: "var(--font-body)"
              }}
            >
              {card.frente.split("___________").map((parte, i, arr) => (
                <span key={i}>
                  {parte}
                  {i < arr.length - 1 && (
                    <span
                      style={{
                        color: "var(--color-amber)",
                        fontWeight: 600,
                        background: "rgba(240,168,32,0.08)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        margin: "0 2px"
                      }}
                    >
                      {card.verso}
                    </span>
                  )}
                </span>
              ))}
            </p>

            <div
              style={{
                position: "absolute",
                bottom: 28,
                display: "flex",
                gap: 12
              }}
            >
              <Button onClick={(e) => { e.stopPropagation(); responder("errou"); }} variant="secondary">
                <ThumbsDown size={16} /> Errei
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); responder("acertou"); }}>
                <ThumbsUp size={16} /> Acertei
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTROLS --- */}
      <div style={{ width: "100%", maxWidth: 720 }}>

        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            height: 3,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 2,
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              width: `${progresso}%`,
              background: "var(--color-amber)",
              borderRadius: 2,
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>

        {/* Navigation + stats */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => { setVirado(false); setIndice(p => Math.max(p - 1, 0)); }}
              disabled={indice === 0}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.5)",
                padding: "6px 10px",
                cursor: indice === 0 ? "default" : "pointer",
                opacity: indice === 0 ? 0.3 : 1,
                display: "flex",
                alignItems: "center"
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", minWidth: 90, textAlign: "center" }}>
              {indice + 1} / {cards.length}
            </span>

            <button
              onClick={() => { setVirado(false); setIndice(p => Math.min(p + 1, cards.length - 1)); }}
              disabled={indice === cards.length - 1}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.5)",
                padding: "6px 10px",
                cursor: indice === cards.length - 1 ? "default" : "pointer",
                opacity: indice === cards.length - 1 ? 0.3 : 1,
                display: "flex",
                alignItems: "center"
              }}
            >
              <ChevronRight size={18} />
            </button>

            <button
              onClick={embaralhar}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.35)",
                padding: "6px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                marginLeft: 4
              }}
              title="Reiniciar"
            >
              <Shuffle size={14} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 20, fontSize: "0.8rem" }}>
            <span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: 4 }}>
              <ThumbsUp size={13} /> {resumo.acertou}
            </span>
            <span style={{ color: "#f87171", display: "flex", alignItems: "center", gap: 4 }}>
              <ThumbsDown size={13} /> {resumo.errou}
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
              {resumo.restantes} restantes
            </span>
          </div>
        </div>

        {/* Keyboard hints */}
        <p style={{
          textAlign: "center",
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.15)",
          marginTop: 12
        }}>
          Espaço/Enter → virar &nbsp;|&nbsp; A → acertei &nbsp;|&nbsp; E → errei &nbsp;|&nbsp; ← → → navegar
        </p>
      </div>
    </div>
  );
}
