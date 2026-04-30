import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

let mermaidCounter = 0;

export function MermaidBlock({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const id = `mermaid-${Date.now()}-${++mermaidCounter}`;
    mermaid
      .render(id, chart)
      .then(({ svg: renderedSvg }) => setSvg(renderedSvg))
      .catch((err) => {
        console.warn('[MermaidBlock] Render error:', err);
        setError(String(err));
      });
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 font-mono overflow-x-auto">
        <p className="font-semibold mb-1">⚠️ Gráfico não pôde ser renderizado</p>
        <pre className="whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="animate-pulse text-sm text-gray-400">Renderizando gráfico...</div>
      </div>
    );
  }

  return (
    <div className="mermaid-block my-6 flex justify-center">
      <div
        ref={ref}
        className="w-full max-w-3xl max-h-80 flex justify-center items-center overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm p-4"
        style={{ contain: 'layout' }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <style>{`
        .mermaid-block svg {
          max-width: 100%;
          max-height: 300px;
          height: auto;
          width: auto;
        }
      `}</style>
    </div>
  );
}
