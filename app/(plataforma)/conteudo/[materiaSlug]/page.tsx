import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MateriaViewer } from "@/components/features/MateriaViewer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function MateriaPage({ params }: { params: { materiaSlug: string } }) {
  const session = await getServerSession(authOptions);

  const materia = await prisma.materia.findUnique({
    where: { slug: params.materiaSlug },
    include: {
      temas: {
        orderBy: { ordem: "asc" },
        include: {
          topicos: {
            orderBy: { ordem: "asc" }
          },
          imagens: {
            orderBy: { ordem: "asc" }
          },
          progresso: session?.user?.id ? {
            where: { usuarioId: session.user.id }
          } : false
        }
      }
    }
  });

  if (!materia) {
    notFound();
  }

  // Find the first unread chapter to start from
  let initialIndex = 0;
  if (session?.user?.id) {
    const firstUnread = materia.temas.findIndex(t => !t.progresso?.some(p => p.lido));
    if (firstUnread !== -1) initialIndex = firstUnread;
  }

  const isAdmin = session?.user?.email === "admin@estudo.com";

  return (
    <MateriaViewer materia={materia} initialIndex={initialIndex} isAdmin={isAdmin} />
  );
}
