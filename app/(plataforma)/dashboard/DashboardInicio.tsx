"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EscolherMetodoModal } from "@/components/features/EscolherMetodoModal";

export function DashboardInicio({ temPlano }: { temPlano: boolean }) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!temPlano) {
      setMostrarModal(true);
    }
  }, [temPlano]);

  const handleSelecionar = async (slug: string) => {
    const res = await fetch("/api/plano-estudo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metodoSlug: slug }),
    });
    if (res.ok) {
      setMostrarModal(false);
      router.refresh();
      window.location.reload();
    }
  };

  if (!mostrarModal) return null;

  return (
    <EscolherMetodoModal
      onSelecionar={handleSelecionar}
    />
  );
}
