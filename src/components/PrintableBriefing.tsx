import { forwardRef } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface PrintableBriefingProps {
  content: string;
  title: string;
}

/**
 * Componente invisível de impressão.
 * Renderiza o briefing sem UI chrome (botões, sidebars) para print/PDF nativo.
 * Deve ser usado com useReactToPrint.
 */
export const PrintableBriefing = forwardRef<HTMLDivElement, PrintableBriefingProps>(
  ({ content, title }, ref) => {
    return (
      <div ref={ref} className="printable-briefing">
        <style>{`
          @media print {
            /* Reset para impressão */
            body * { visibility: hidden; }
            .printable-briefing, .printable-briefing * { visibility: visible; }
            .printable-briefing {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: #111 !important;
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.5;
              padding: 20mm;
            }

            /* Tipografia para impressão */
            .printable-briefing h1 { font-size: 18pt; margin-bottom: 12pt; page-break-after: avoid; }
            .printable-briefing h2 { font-size: 14pt; margin-top: 16pt; margin-bottom: 8pt; page-break-after: avoid; border-bottom: 1px solid #ccc; padding-bottom: 4pt; }
            .printable-briefing h3 { font-size: 12pt; margin-top: 12pt; page-break-after: avoid; }

            /* Evitar quebras dentro de blocos */
            .printable-briefing table { break-inside: avoid; page-break-inside: avoid; }
            .printable-briefing .mermaid-block { break-inside: avoid; page-break-inside: avoid; }
            .printable-briefing pre { break-inside: avoid; }
            .printable-briefing ul, .printable-briefing ol { break-inside: avoid; }

            /* Tabelas limpas */
            .printable-briefing table { width: 100%; border-collapse: collapse; font-size: 9pt; }
            .printable-briefing th, .printable-briefing td {
              border: 1px solid #999;
              padding: 4pt 6pt;
              text-align: left;
            }
            .printable-briefing th { background: #f0f0f0 !important; font-weight: bold; }

            /* SVGs Mermaid — contenção no PDF */
            .printable-briefing svg { max-width: 100% !important; height: auto !important; }
            .printable-briefing .mermaid-block {
              max-width: 100% !important;
              page-break-inside: avoid;
              break-inside: avoid;
              margin: 8pt 0;
            }
            .printable-briefing .mermaid-block svg {
              max-height: 250px !important;
              max-width: 480px !important;
              width: auto !important;
              display: block;
              margin: 0 auto;
            }

          }

          /* Estilo da tela (componente invisível) */
          @media screen {
            .printable-briefing {
              position: absolute;
              left: -9999px;
              top: -9999px;
              width: 210mm;
              background: white;
              color: #111;
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 11pt;
              line-height: 1.5;
              padding: 20mm;
            }
          }
        `}</style>

        <h1 style={{ textAlign: "center", marginBottom: "8mm" }}>{title}</h1>
        <MarkdownRenderer
          content={content}
          className="prose prose-sm max-w-none"
        />
      </div>
    );
  }
);

PrintableBriefing.displayName = "PrintableBriefing";
