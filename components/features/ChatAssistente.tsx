"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User } from "lucide-react";

type Mensagem = { role: "user" | "assistant"; content: string };

export function ChatAssistente({ temaId }: { temaId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false); // Trava para evitar envio duplo (React Strict Mode)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  // Função simples para formatar markdown básico (negrito e quebras de linha)
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Formata **texto** para <strong>texto</strong>
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      return (
        <span key={i}>
          {parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          <br />
        </span>
      );
    });
  };

  const enviarMensagem = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !temaId || isLoading || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const novaMensagem: Mensagem = { role: "user", content: input };
    const historicoAtual = [...mensagens];
    
    setMensagens([...historicoAtual, novaMensagem]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistente/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temaId,
          mensagem: novaMensagem.content,
          historico: historicoAtual,
        }),
      });

      if (!response.body) throw new Error("No response body");

      // Prepara a mensagem do assistente vazia para ser preenchida pelo stream
      setMensagens(prev => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMensagens(prev => {
          const ultimas = [...prev];
          const ultimaMsg = ultimas[ultimas.length - 1];
          if (ultimaMsg && ultimaMsg.role === "assistant") {
            ultimaMsg.content += chunk;
          }
          return ultimas;
        });
      }
    } catch (error) {
      console.error("Erro no chat:", error);
      setMensagens(prev => [...prev, { 
        role: "assistant", 
        content: "Desculpe, ocorreu um erro ao tentar gerar a resposta. Tente novamente." 
      }]);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (!temaId) {
    return (
      <div className="chat-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="welcome-message">
          <Bot size={48} />
          <h3 style={{ margin: 0 }}>Selecione um tema</h3>
          <p>Para começarmos, selecione a matéria e o tema acima.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {mensagens.length === 0 ? (
          <div className="welcome-message">
            <Bot size={48} />
            <h3 style={{ margin: 0 }}>Como posso ajudar?</h3>
            <p>Faça uma pergunta sobre o tema selecionado. Responderei com base no material do curso.</p>
          </div>
        ) : (
          mensagens.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`} style={{ display: 'flex', gap: 12 }}>
              {msg.role === "assistant" ? <Bot size={20} style={{ flexShrink: 0, marginTop: 2 }} /> : <User size={20} style={{ flexShrink: 0, marginTop: 2 }} />}
              <div>{renderMarkdown(msg.content)}</div>
            </div>
          ))
        )}

        {isLoading && mensagens[mensagens.length - 1]?.role !== "assistant" && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={enviarMensagem}>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua dúvida..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={!input.trim() || isLoading}>
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
}
