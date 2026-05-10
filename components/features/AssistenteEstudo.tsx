"use client";

import { useState } from "react";
import { MessageSquare, BrainCircuit } from "lucide-react";
import { SeletorTema } from "./SeletorTema";
import { ChatAssistente } from "./ChatAssistente";
import { GeradorQuestoes } from "./GeradorQuestoes";

export function AssistenteEstudo() {
  const [activeTab, setActiveTab] = useState<"chat" | "questoes">("chat");
  const [temaSelecionado, setTemaSelecionado] = useState<string | null>(null);

  return (
    <div className="grid">
      <SeletorTema onTemaSelecionado={setTemaSelecionado} />

      <div className="tabs">
        <button 
          className={`tab ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <MessageSquare size={18} />
          Tirar Dúvidas
        </button>
        <button 
          className={`tab ${activeTab === "questoes" ? "active" : ""}`}
          onClick={() => setActiveTab("questoes")}
        >
          <BrainCircuit size={18} />
          Gerar Questões
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        {activeTab === "chat" ? (
          <ChatAssistente temaId={temaSelecionado || ""} />
        ) : (
          <GeradorQuestoes temaId={temaSelecionado || ""} />
        )}
      </div>
    </div>
  );
}
