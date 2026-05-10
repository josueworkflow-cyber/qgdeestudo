import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FlashcardTrainer } from "./FlashcardTrainer";
import { Layers3 } from "lucide-react";

type Props = {
  params: { materiaSlug: string };
};

export default async function FlashcardsMateriaPage({ params }: Props) {
  const materia = await prisma.materia.findUnique({
    where: { slug: params.materiaSlug }
  });

  if (!materia) notFound();

  const todasMaterias = await prisma.materia.findMany({
    orderBy: { ordem: "asc" },
    select: {
      nome: true,
      slug: true,
      temas: {
        select: {
          flashcards: { select: { id: true } }
        }
      }
    }
  });

  const flashcards = await prisma.flashcard.findMany({
    where: {
      tema: {
        materia: { slug: params.materiaSlug }
      }
    },
    include: {
      tema: {
        select: { titulo: true }
      }
    }
  });

  const cards = flashcards.map(f => ({
    id: f.id,
    materiaNome: materia.nome,
    materiaSlug: materia.slug,
    temaTitulo: f.tema.titulo,
    frente: f.frente,
    verso: f.verso
  }));

  // Embaralhar (Fisher-Yates)
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* === FLASHCARD TRAINER (topo) === */}
      {cards.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Layers3 size={32} color="var(--color-text-muted)" style={{ marginBottom: 12 }} />
            <p className="muted" style={{ marginBottom: 4 }}>
              Nenhum flashcard disponível para esta matéria.
            </p>
            <p className="muted" style={{ fontSize: 13 }}>
              Execute o seed de flashcards para gerar os cartões.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <Badge>{materia.nome}</Badge>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 6 }}>
              {cards.length} cartões · ordem aleatória
            </div>
          </div>
          <FlashcardTrainer cards={cards} />
        </>
      )}

      {/* === SELETOR DE MATÉRIAS (abaixo) === */}
      <Card style={{ marginTop: 32, padding: "18px 20px" }}>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 12, fontWeight: 500 }}>
          Escolha a matéria
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {todasMaterias.map((item) => {
            const count = item.temas.reduce((acc, t) => acc + t.flashcards.length, 0);
            const ativo = item.slug === params.materiaSlug;
            return (
              <Link
                href={`/flashcards/${item.slug}`}
                key={item.slug}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 13,
                  fontWeight: ativo ? 600 : 400,
                  textDecoration: "none",
                  background: ativo ? "var(--color-olive-em)" : "var(--color-surface-2)",
                  color: ativo ? "#fff" : "var(--color-text)",
                  border: ativo ? "1px solid var(--color-olive-em)" : "1px solid var(--color-border)",
                  opacity: count === 0 ? 0.4 : 1,
                  transition: "all 0.15s ease",
                }}
                title={count === 0 ? "Sem flashcards" : `${count} flashcards`}
              >
                <span>{item.nome}</span>
                <span style={{
                  fontSize: 10,
                  background: ativo ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                  padding: "1px 5px",
                  borderRadius: 999,
                }}>
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
