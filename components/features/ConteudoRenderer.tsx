"use client";


type ImagemConteudo = {
  caminho: string;
  legenda: string;
  refTexto: string | null;
};

type Props = {
  conteudo: string;
  imagens?: ImagemConteudo[];
  materiaSlug: string;
};

export function ConteudoRenderer({ conteudo, imagens = [] }: Props) {
  // Replace newlines with <br /> for basic formatting if no HTML is present,
  // or just render the content and let dangerouslySetInnerHTML handle it.
  // To keep the "paragraph" look but allow custom HTML, we can split by double newlines.
  const blocks = conteudo.split(/\n\s*\n/).filter(b => b.trim() !== '');

  const renderBlock = (text: string, index: number) => {
    // --- Pre-processing for automatic features ---
    
    // 1. Automatic Image Linking (Fig. X.Y)
    const figRegex = /(?:Fig\.?\s*|Figura\s+)(\d+)[.-](\d+)/gi;
    const detectedImages: string[] = [];
    let match;
    figRegex.lastIndex = 0;
    while ((match = figRegex.exec(text)) !== null) {
      detectedImages.push(`/conteudo/Fig_${match[1]}-${match[2]}.jpg`);
    }

    // 2. Shortcodes {{IMG:filename}}
    const shortcodeRegex = /\{\{IMG:(.*?)\}\}/gi;
    let scMatch;
    shortcodeRegex.lastIndex = 0;
    while ((scMatch = shortcodeRegex.exec(text)) !== null) {
      detectedImages.push(`/conteudo/${scMatch[1].trim()}.jpg`);
    }

    // Clean text: remove shortcodes and handle auto-bolding
    let cleanText = text.replace(/\{\{IMG:.*?\}\}/gi, '');
    
    // Auto-bolding logic (for standard patterns)
    cleanText = cleanText.replace(/^(Art\.\s*[\d\-]+|§\s*\d+|Parágrafo único)/g, '<strong>$1</strong>');
    cleanText = cleanText.replace(/^([IVXLCDM]+[\.\-\)\s]+)/g, '<strong>$1</strong>');
    cleanText = cleanText.replace(/^([a-z]\)|\d+\.)/g, '<strong>$1</strong>');

    return (
      <div key={index} style={{ marginBottom: 20 }}>
        <div 
          style={{ 
            fontSize: 15, 
            lineHeight: 1.6, 
            color: "var(--color-text)",
            textAlign: "justify",
            whiteSpace: "pre-wrap" // Preserve single newlines within blocks
          }} 
          dangerouslySetInnerHTML={{ __html: cleanText }}
        />
        
        {detectedImages.map((src, i) => (
          <div key={`auto-img-${i}`} style={{ margin: "24px 0", textAlign: "center" }}>
            <div style={{ 
              position: "relative", 
              width: "100%", 
              minHeight: 200, 
              backgroundColor: "var(--color-surface-2)", 
              borderRadius: "var(--radius-lg)", 
              overflow: "hidden",
              border: "1px solid var(--color-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <img 
                src={src} 
                alt="Ilustração" 
                style={{ objectFit: "contain", width: "100%", height: "auto", maxHeight: 550, display: "block", margin: "0 auto" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  const parent = (e.target as HTMLElement).parentElement?.parentElement;
                  if (parent) parent.style.display = "none";
                }}
              />
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 13, fontWeight: 500 }}>
              Fonte: Apostila Preparatória
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="conteudo-renderer">
      {blocks.map(renderBlock)}
    </div>
  );
}
