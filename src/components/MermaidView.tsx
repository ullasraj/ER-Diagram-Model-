import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Download, Code2, Image as ImageIcon } from 'lucide-react';

interface MermaidViewProps {
  mermaidCode: string;
}

export const MermaidView: React.FC<MermaidViewProps> = ({ mermaidCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#090d16',
        primaryColor: '#6366f1',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#818cf8',
        lineColor: '#818cf8',
        secondaryColor: '#0ea5e9',
        tertiaryColor: '#1e293b',
      },
      er: {
        diagramPadding: 20,
        layoutDirection: 'TB',
      },
    });

    const renderDiagram = async () => {
      if (!mermaidCode) return;
      try {
        setRenderError(null);
        const uniqueId = `mermaid-svg-${Date.now()}`;
        const { svg } = await mermaid.render(uniqueId, mermaidCode);
        setSvgContent(svg);
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        setRenderError('Failed to render Mermaid diagram: ' + (err.message || String(err)));
      }
    };

    renderDiagram();
  }, [mermaidCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typeorm-er-diagram.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    if (!svgContent) return;
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = (img.width || 1000) * scale;
      canvas.height = (img.height || 800) * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.download = `typeorm-mermaid-diagram-${Date.now()}.png`;
        a.href = pngUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Action Header */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-100">Mermaid ER Diagram</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied Code!' : 'Copy Mermaid Code'}
          </button>

          <button
            onClick={handleDownloadSVG}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5" /> Export SVG
          </button>

          <button
            onClick={handleDownloadPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs text-white rounded-lg transition-colors font-medium shadow-md"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Export PNG
          </button>
        </div>
      </div>

      {/* Main Container Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Rendered SVG Preview */}
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center overflow-auto border-r border-slate-800">
          {renderError ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono max-w-md">
              {renderError}
            </div>
          ) : (
            <div
              ref={containerRef}
              className="w-full h-full flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
        </div>

        {/* Code Editor Preview */}
        <div className="p-4 bg-slate-900/50 flex flex-col overflow-hidden">
          <span className="text-xs font-mono text-slate-400 mb-2">Mermaid DSL Syntax:</span>
          <textarea
            readOnly
            value={mermaidCode}
            className="flex-1 w-full p-4 bg-slate-950 text-indigo-300 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
