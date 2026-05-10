"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ListTree, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Eye, 
  Save, 
  Bold, 
  Italic, 
  Type, 
  Image as ImageIcon 
} from "lucide-react";
import { ConteudoRenderer } from "@/components/features/ConteudoRenderer";
import { markTemaAsRead, updateTopico } from "@/lib/actions/topico";

interface Props {
  materia: any;
  initialIndex?: number;
  isAdmin?: boolean;
}

import { useRouter } from "next/navigation";

export function MateriaViewer({ materia, initialIndex = 0, isAdmin = true }: Props) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableTopics, setEditableTopics] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  
  const currentTema = materia.temas[activeIndex];
  const totalTemas = materia.temas.length;
  const progressPct = Math.round(((activeIndex + 1) / totalTemas) * 100);

  // Initialize editable topics when chapter changes
  useEffect(() => {
    const initial: Record<string, string> = {};
    if (currentTema && currentTema.topicos) {
      currentTema.topicos.forEach((t: any) => {
        initial[t.id] = t.conteudo;
      });
    }
    setEditableTopics(initial);
  }, [activeIndex, currentTema]);

  async function handleNext() {
    if (activeIndex < totalTemas - 1) {
      setLoading(true);
      await markTemaAsRead(currentTema.id);
      setActiveIndex(prev => prev + 1);
      window.scrollTo(0, 0);
      setLoading(false);
    } else {
      await markTemaAsRead(currentTema.id);
      window.location.href = "/conteudo";
    }
  }

  function handlePrev() {
    if (activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  }

  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});

  async function handleSaveTopic(id: string) {
    setSavingId(id);
    const result = await updateTopico(id, editableTopics[id]);
    if (result.success) {
      setSaveStatus({ ...saveStatus, [id]: "success" });
      setTimeout(() => {
        setSaveStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2000);
      router.refresh();
    }
    setSavingId(null);
  }

  const insertText = (topicId: string, before: string, after: string = "") => {
    const textarea = document.getElementById(`textarea-${topicId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editableTopics[topicId] || "";
    
    let newText;
    let newCursorPos;

    if (start !== end) {
      // User has selected text - wrap selection
      const selected = text.substring(start, end);
      newText = text.substring(0, start) + before + selected + after + text.substring(end);
      newCursorPos = end + before.length + after.length;
    } else {
      // No selection - put opening at cursor and closing at the VERY END of the text
      newText = text.substring(0, start) + before + text.substring(start) + after;
      newCursorPos = start + before.length;
    }
    
    setEditableTopics({ ...editableTopics, [topicId]: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 280px", gap: 32, alignItems: "start" }}>
      {/* Main Content Area */}
      <article className="grid" style={{ gap: 32, paddingBottom: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Badge>{materia.codigo} • Capítulo {activeIndex + 1} de {totalTemas}</Badge>
              {isAdmin && (
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', 
                    borderRadius: 99, border: '1px solid var(--color-border)', 
                    backgroundColor: isEditMode ? 'var(--color-amber)' : 'transparent',
                    color: isEditMode ? '#000' : 'var(--color-text)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {isEditMode ? <><Eye size={14} /> Modo Visualização</> : <><Edit3 size={14} /> Modo Edição</>}
                </button>
              )}
            </div>
            <h1 className="page-title" style={{ marginTop: 12, fontSize: 32 }}>{materia.nome}</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-amber-em)" }}>{progressPct}%</span>
            <div className="progress" style={{ width: 100, height: 6, marginTop: 4 }}>
              <span style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        <section key={currentTema?.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <span style={{ 
              backgroundColor: "var(--color-primary)", 
              color: "white", 
              width: 32, 
              height: 32, 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: 14, 
              fontWeight: 800 
            }}>
              {currentTema?.ordem}
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, textTransform: "uppercase" }}>{currentTema?.titulo}</h2>
          </div>

          <Card style={{ padding: isEditMode ? "16px" : "32px 40px", display: "flex", flexDirection: "column", gap: isEditMode ? 16 : 32 }}>
            {currentTema?.topicos.map((topico: any) => (
              <div key={topico.id} style={{ 
                border: isEditMode ? '1px solid var(--color-border)' : 'none', 
                borderRadius: 'var(--radius-md)',
                padding: isEditMode ? '20px' : '0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ 
                    fontSize: 18, 
                    fontWeight: 700, 
                    color: "var(--color-text)",
                    paddingLeft: 12,
                    borderLeft: "3px solid var(--color-primary)"
                  }}>
                    {topico.titulo}
                  </h3>
                  {isEditMode && (
                    <Button 
                      onClick={() => handleSaveTopic(topico.id)} 
                      disabled={savingId === topico.id}
                      style={{ 
                        backgroundColor: saveStatus[topico.id] === "success" ? "var(--color-olive-em)" : undefined,
                        borderColor: saveStatus[topico.id] === "success" ? "var(--color-olive-em)" : undefined,
                        color: saveStatus[topico.id] === "success" ? "#fff" : undefined
                      }}
                    >
                      {savingId === topico.id ? "Salvando..." : saveStatus[topico.id] === "success" ? "✅ Salvo!" : <><Save size={14} /> Salvar</>}
                    </Button>
                  )}
                </div>

                {isEditMode ? (
                  <div className="grid" style={{ gap: 16 }}>
                    <div style={{ display: 'flex', gap: 8, padding: '8px', backgroundColor: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                      <button onClick={() => insertText(topico.id, "<strong>", "</strong>")} style={toolIconStyle}><Bold size={14} /></button>
                      <button onClick={() => insertText(topico.id, "<em>", "</em>")} style={toolIconStyle}><Italic size={14} /></button>
                      <button onClick={() => insertText(topico.id, '<span style="color: #f0a820">', "</span>")} style={{...toolIconStyle, color: '#f0a820'}}><Type size={14} /></button>
                      <button onClick={() => insertText(topico.id, '{{IMG:', "}}")} style={toolIconStyle}><ImageIcon size={14} /></button>
                    </div>
                    <textarea
                      id={`textarea-${topico.id}`}
                      value={editableTopics[topico.id] || ""}
                      onChange={(e) => setEditableTopics({ ...editableTopics, [topico.id]: e.target.value })}
                      style={{
                        width: "100%",
                        height: "200px",
                        padding: 16,
                        backgroundColor: "var(--color-surface-1)",
                        color: "var(--color-text)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 14,
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        resize: "vertical"
                      }}
                    />

                    {/* Image thumbnails for editor */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                      {(() => {
                        const text = editableTopics[topico.id] || "";
                        const found: {src: string, tag: string}[] = [];
                        const figRegex = /(?:Fig\.?\s*|Figura\s+)(\d+)[.-](\d+)/gi;
                        let m;
                        while ((m = figRegex.exec(text)) !== null) found.push({ src: `/conteudo/Fig_${m[1]}-${m[2]}.jpg`, tag: m[0] });
                        const scRegex = /\{\{IMG:(.*?)\}\}/gi;
                        let scm;
                        while ((scm = scRegex.exec(text)) !== null) found.push({ src: `/conteudo/${scm[1].trim()}.jpg`, tag: scm[0] });

                        return found.map((img, i) => (
                          <div key={i} style={{ position: 'relative', width: 80, height: 80, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
                            <img src={img.src} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                            <button 
                              onClick={() => {
                                const newText = (editableTopics[topico.id] || "").replace(img.tag, '');
                                setEditableTopics({ ...editableTopics, [topico.id]: newText });
                              }}
                              style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 9, cursor: 'pointer' }}
                            >X</button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                ) : (
                  <ConteudoRenderer 
                    conteudo={topico.conteudo} 
                    imagens={currentTema.imagens} 
                    materiaSlug={materia.slug} 
                  />
                )}
              </div>
            ))}
          </Card>
        </section>

        {/* Navigation Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, borderTop: "1px solid var(--color-border)", paddingTop: 32 }}>
          <Button 
            onClick={handlePrev} 
            variant="secondary" 
            disabled={activeIndex === 0}
            style={{ minWidth: 140 }}
          >
            <ChevronLeft size={20} /> Capítulo Anterior
          </Button>
          
          <Button 
            onClick={handleNext} 
            disabled={loading}
            style={{ minWidth: 180 }}
          >
            {activeIndex === totalTemas - 1 ? "Concluir Matéria" : "Próximo Capítulo"} 
            <ChevronRight size={20} style={{ marginLeft: 8 }} />
          </Button>
        </div>
      </article>

      {/* Sidebar Navigation (Right Side) */}
      <aside style={{ position: "sticky", top: 24, maxHeight: "calc(100vh - 48px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Button href="/conteudo" variant="secondary" style={{ width: "fit-content" }}>
          <ArrowLeft size={16} /> Matérias
        </Button>
        
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <ListTree size={16} /> Capítulos
          </h3>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {materia.temas.map((tema: any, index: number) => {
              const isRead = tema.progresso?.some((p: any) => p.lido);
              return (
                <button 
                  key={tema.id} 
                  onClick={() => { setActiveIndex(index); window.scrollTo(0, 0); }}
                  style={{ 
                    textAlign: "left",
                    fontSize: 13, 
                    padding: "10px 12px", 
                    borderRadius: "var(--radius-sm)", 
                    color: activeIndex === index ? "var(--color-primary)" : "var(--color-text)", 
                    textDecoration: "none",
                    transition: "all 0.2s",
                    borderLeft: activeIndex === index ? "2px solid var(--color-primary)" : "2px solid transparent",
                    backgroundColor: activeIndex === index ? "var(--color-surface-2)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {index + 1}. {tema.titulo}
                  </span>
                  {isRead && <CheckCircle2 size={14} color="var(--color-olive-em)" />}
                </button>
              );
            })}
          </nav>
        </Card>
      </aside>
    </div>
  );
}

const toolIconStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--color-border)',
  borderRadius: '4px',
  color: 'var(--color-text)',
  padding: '4px 8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
