"use client";

import { useEffect, useState } from "react";

type Tema = { id: string; titulo: string };
type Materia = { id: string; nome: string; temas: Tema[] };

export function SeletorTema({
  onTemaSelecionado
}: {
  onTemaSelecionado: (temaId: string | null) => void;
}) {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaId, setMateriaId] = useState<string>("");
  const [temaId, setTemaId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assistente/temas")
      .then(res => res.json())
      .then(data => {
        if (data.materias) {
          setMaterias(data.materias);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar matérias:", err);
        setIsLoading(false);
      });
  }, []);

  const materiaSelecionada = materias.find(m => m.id === materiaId);

  return (
    <div className="grid grid-2" style={{ marginBottom: 24 }}>
      <div>
        <select 
          className="input" 
          value={materiaId} 
          onChange={(e) => {
            setMateriaId(e.target.value);
            setTemaId("");
            onTemaSelecionado(null);
          }}
          disabled={isLoading}
        >
          <option value="">{isLoading ? "Carregando..." : "Selecione a matéria"}</option>
          {materias.map(m => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </div>
      <div>
        <select 
          className="input"
          value={temaId}
          onChange={(e) => {
            setTemaId(e.target.value);
            onTemaSelecionado(e.target.value || null);
          }}
          disabled={!materiaId || isLoading}
        >
          <option value="">Selecione o tema</option>
          {materiaSelecionada?.temas.map(t => (
            <option key={t.id} value={t.id}>{t.titulo}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
