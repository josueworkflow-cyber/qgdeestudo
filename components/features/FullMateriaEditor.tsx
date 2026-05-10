"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { updateTopico, createTopico, deleteTopico } from "@/lib/actions/topico";
import { ListTree, Save, Bold, Italic, Type, Image as ImageIcon, CheckCircle, Plus, Trash2 } from "lucide-react";
import { ConteudoRenderer } from "@/components/features/ConteudoRenderer";

interface Props {
  materia: any;
}

import { useRouter } from "next/navigation";

export function FullMateriaEditor({ materia }: Props) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [changedTopicIds, setChangedTopicIds] = useState<Set<string>>(new Set());
  const [editableTopics, setEditableTopics] = useState<Record<string, string>>({});
  const [editableTitles, setEditableTitles] = useState<Record<string, string>>({});

  // Initialize editable content and titles
  useEffect(() => {
    const topics: Record<string, string> = {};
    const titles: Record<string, string> = {};
    materia.temas.forEach((tema: any) => {
      tema.topicos.forEach((topico: any) => {
        topics[topico.id] = topico.conteudo;
        titles[topico.id] = topico.titulo;
      });
    });
    setEditableTopics(topics);
    setEditableTitles(titles);
  }, [materia]);

  // Warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  async function handleSaveTopic(id: string) {
    setSavingId(id);
    const result = await updateTopico(id, editableTitles[id], editableTopics[id]);
    if (result.success) {
      setSaveStatus({ ...saveStatus, [id]: "success" });
      setTimeout(() => {
        setSaveStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2000);
      
      const newChanged = new Set(changedTopicIds);
      newChanged.delete(id);
      setChangedTopicIds(newChanged);
      if (newChanged.size === 0) setHasUnsavedChanges(false);

      router.refresh();
    }
    setSavingId(null);
  }

  async function handleSaveAll() {
    if (changedTopicIds.size === 0) return;
    
    setIsSavingAll(true);
    const idsToSave = Array.from(changedTopicIds);
    
    try {
      // Save all changed topics in parallel
      await Promise.all(idsToSave.map(id => updateTopico(id, editableTitles[id], editableTopics[id])));
      
      setChangedTopicIds(new Set());
      setHasUnsavedChanges(false);
      setIsSavingAll(false);
      router.refresh();
      alert("✅ Todas as alterações foram salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar tudo:", error);
      alert("❌ Ocorreu um erro ao salvar alguns tópicos.");
      setIsSavingAll(false);
    }
  }

  async function handleAddTopic(temaId: string) {
    const titulo = prompt("Digite o título do novo tópico:");
    if (!titulo) return;

    const result = await createTopico(temaId, titulo);
    if (result.success) {
      router.refresh();
    } else {
      alert("Erro ao criar tópico.");
    }
  }

  async function handleDeleteTopic(id: string, titulo: string) {
    if (!confirm(`Tem certeza que deseja excluir o tópico "${titulo}"? Esta ação não pode ser desfeita.`)) return;

    const result = await deleteTopico(id);
    if (result.success) {
      router.refresh();
    } else {
      alert("Erro ao excluir tópico.");
    }
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
    setHasUnsavedChanges(true);
    setChangedTopicIds((prev) => new Set(prev).add(topicId));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "280px 1fr", gap: 32, alignItems: "start" }}>
      {/* Sticky Header with Save All */}
      {isEditMode && (
        <div style={{ 
          position: 'fixed', bottom: 32, right: 32, zIndex: 100, 
          display: 'flex', gap: 16, alignItems: 'center', 
          backgroundColor: 'var(--color-surface-2)', padding: '12px 24px', 
          borderRadius: 99, border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          {hasUnsavedChanges && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-amber)' }}>⚠️ Alterações não salvas</span>
          )}
          <Button onClick={handleSaveAll} disabled={isSavingAll || !hasUnsavedChanges} style={{ minWidth: 200 }}>
            {isSavingAll ? "Salvando tudo..." : <><Save size={18} /> SALVAR {changedTopicIds.size} ALTERAÇÕES</>}
          </Button>
        </div>
      )}

      {/* Sidebar for Navigation */}
      <aside style={{ position: "sticky", top: 24, maxHeight: "calc(100vh - 48px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <ListTree size={16} /> Ir para Capítulo
          </h3>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {materia.temas.map((tema: any) => (
              <a 
                key={tema.id} 
                href={`#tema-${tema.id}`} 
                style={{ 
                  fontSize: 13, 
                  padding: "8px 12px", 
                  borderRadius: "var(--radius-sm)", 
                  color: "var(--color-text)", 
                  textDecoration: "none",
                  transition: "background 0.2s"
                }}
                className="nav-link-anchor"
              >
                {tema.ordem}. {tema.titulo}
              </a>
            ))}
          </nav>
        </Card>
      </aside>

      {/* Main Full Content Editor */}
      <div className="grid" style={{ gap: 48, paddingBottom: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Badge>Modo Editor Completo</Badge>
            <h1 className="page-title" style={{ marginTop: 12, fontSize: 32 }}>{materia.nome}</h1>
            <p className="muted">Toda a matéria em uma única página para edição rápida.</p>
          </div>
          <Button onClick={() => setIsEditMode(!isEditMode)} variant="secondary">
            {isEditMode ? "Visualizar como Aluno" : "Voltar a Editar"}
          </Button>
        </div>

        <div className="grid" style={{ gap: 64 }}>
          {materia.temas.map((tema: any) => (
            <section key={tema.id} id={`tema-${tema.id}`} style={{ scrollMarginTop: 24 }}>
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
                  {tema.ordem}
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 800, textTransform: "uppercase" }}>{tema.titulo}</h2>
              </div>

              <Card style={{ padding: isEditMode ? "20px" : "32px 40px", display: "flex", flexDirection: "column", gap: 32 }}>
                {tema.topicos.map((topico: any) => (
                  <div key={topico.id} style={{ 
                    border: isEditMode ? '1px solid var(--color-border)' : 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: isEditMode ? '24px' : '0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      {isEditMode ? (
                        <input 
                          value={editableTitles[topico.id] || ""}
                          onChange={(e) => {
                            setEditableTitles({ ...editableTitles, [topico.id]: e.target.value });
                            setHasUnsavedChanges(true);
                            setChangedTopicIds((prev) => new Set(prev).add(topico.id));
                          }}
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--color-text)",
                            backgroundColor: "var(--color-surface-2)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            padding: "4px 12px",
                            width: "70%",
                            fontFamily: "inherit"
                          }}
                        />
                      ) : (
                        <h3 style={{ 
                          fontSize: 18, 
                          fontWeight: 700, 
                          color: "var(--color-text)",
                          paddingLeft: 12,
                          borderLeft: "3px solid var(--color-primary)"
                        }}>
                          {topico.titulo}
                        </h3>
                      )}
                      {isEditMode && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button 
                            variant="secondary"
                            onClick={() => handleDeleteTopic(topico.id, topico.titulo)}
                            style={{ color: '#ef4444', borderColor: '#ef4444' }}
                            title="Excluir tópico"
                          >
                            <Trash2 size={14} />
                          </Button>
                          <Button 
                            onClick={() => handleSaveTopic(topico.id)} 
                            disabled={savingId === topico.id}
                            style={{ 
                              backgroundColor: saveStatus[topico.id] === "success" ? "var(--color-olive-em)" : undefined,
                              borderColor: saveStatus[topico.id] === "success" ? "var(--color-olive-em)" : undefined,
                              color: saveStatus[topico.id] === "success" ? "#fff" : undefined
                            }}
                          >
                            {savingId === topico.id ? "Salvando..." : saveStatus[topico.id] === "success" ? "✅ Salvo!" : <><Save size={14} /> Salvar Tópico</>}
                          </Button>
                        </div>
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
                          onChange={(e) => {
                            setEditableTopics({ ...editableTopics, [topico.id]: e.target.value });
                            setHasUnsavedChanges(true);
                            setChangedTopicIds((prev) => new Set(prev).add(topico.id));
                          }}
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

                        {/* List of images in this topic */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                          {(() => {
                            const text = editableTopics[topico.id] || "";
                            const found: {src: string, tag: string}[] = [];
                            
                            // Check for Fig. X-Y
                            const figRegex = /(?:Fig\.?\s*|Figura\s+)(\d+)[.-](\d+)/gi;
                            let m;
                            while ((m = figRegex.exec(text)) !== null) {
                              found.push({ src: `/conteudo/Fig_${m[1]}-${m[2]}.jpg`, tag: m[0] });
                            }
                            
                            // Check for {{IMG:xxx}}
                            const scRegex = /\{\{IMG:(.*?)\}\}/gi;
                            let scm;
                            while ((scm = scRegex.exec(text)) !== null) {
                              found.push({ src: `/conteudo/${scm[1].trim()}.jpg`, tag: scm[0] });
                            }

                            return found.map((img, i) => (
                              <div key={i} style={{ position: 'relative', width: 100, height: 100, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }}>
                                <img src={img.src} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                                <button 
                                  onClick={() => {
                                    const newText = (editableTopics[topico.id] || "").replace(img.tag, '');
                                    setEditableTopics({ ...editableTopics, [topico.id]: newText });
                                  }}
                                  style={{
                                    position: 'absolute', top: 4, right: 4, backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                  title="Remover imagem"
                                >
                                  X
                                </button>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, fontSize: 8, padding: 2, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                  {img.tag}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    ) : (
                      <ConteudoRenderer 
                        conteudo={editableTopics[topico.id]} 
                        imagens={tema.imagens} 
                        materiaSlug={materia.slug} 
                      />
                    )}
                  </div>
                ))}
                {isEditMode && (
                  <Button 
                    variant="secondary" 
                    onClick={() => handleAddTopic(tema.id)}
                    style={{ width: '100%', borderStyle: 'dashed', marginTop: 16 }}
                  >
                    <Plus size={16} /> ADICIONAR NOVO TÓPICO NESTE CAPÍTULO
                  </Button>
                )}
              </Card>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

const toolIconStyle = {
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
