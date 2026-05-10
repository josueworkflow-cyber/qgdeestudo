import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function FlashcardsPage() {
  const primeiraMateria = await prisma.materia.findFirst({
    orderBy: { ordem: "asc" },
    select: { slug: true },
  });

  if (primeiraMateria) {
    redirect(`/flashcards/${primeiraMateria.slug}`);
  }
}