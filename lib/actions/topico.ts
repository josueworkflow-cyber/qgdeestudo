"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function updateTopico(id: string, titulo?: string, conteudo?: string) {
  try {
    const data: any = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (conteudo !== undefined) data.conteudo = conteudo;

    const topico = await prisma.topico.update({
      where: { id },
      data,
      include: {
        tema: {
          include: {
            materia: true
          }
        }
      }
    });

    revalidatePath(`/conteudo/${topico.tema.materia.slug}`);
    revalidatePath(`/admin/materia/${topico.tema.materia.slug}`);
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar tópico:", error);
    return { success: false, error: "Falha ao salvar as alterações." };
  }
}

export async function createTopico(temaId: string, titulo: string) {
  try {
    const lastTopico = await prisma.topico.findFirst({
      where: { temaId },
      orderBy: { ordem: "desc" }
    });
    
    const newOrdem = (lastTopico?.ordem || 0) + 1;

    const slug = titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 80);

    const newTopico = await prisma.topico.create({
      data: {
        temaId,
        titulo,
        slug,
        conteudo: "Novo conteúdo aqui...",
        ordem: newOrdem
      },
      include: {
        tema: {
          include: {
            materia: true
          }
        }
      }
    });

    const temaSlug = (newTopico.tema as { materia: { slug: string } }).materia.slug;

    revalidatePath(`/admin/materia/${temaSlug}`);
    revalidatePath(`/conteudo/${temaSlug}`);
    revalidatePath("/", "layout");

    return { success: true, id: newTopico.id };
  } catch (error) {
    console.error("Erro ao criar tópico:", error);
    return { success: false, error: "Falha ao criar tópico." };
  }
}

export async function deleteTopico(id: string) {
  try {
    const topico = await prisma.topico.delete({
      where: { id },
      include: {
        tema: {
          include: {
            materia: true
          }
        }
      }
    });

    revalidatePath(`/admin/materia/${topico.tema.materia.slug}`);
    revalidatePath(`/conteudo/${topico.tema.materia.slug}`);
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir tópico:", error);
    return { success: false, error: "Falha ao excluir tópico." };
  }
}

export async function markTemaAsRead(temaId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Não autenticado" };

    await prisma.progresso.upsert({
      where: {
        usuarioId_temaId: {
          usuarioId: session.user.id,
          temaId: temaId
        }
      },
      create: {
        usuarioId: session.user.id,
        temaId: temaId,
        lido: true
      },
      update: {
        lido: true
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/conteudo");
    revalidatePath(`/conteudo/${temaId}`); // Simplified, but revalidating main paths is usually enough
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao marcar como lido:", error);
    return { success: false, error: "Falha ao salvar progresso." };
  }
}
