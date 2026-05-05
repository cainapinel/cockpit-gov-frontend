import { forwardRef } from "react";
import { BriefingPreview } from "./BriefingPreview";
import type { BriefingStructured } from "./BriefingPreview";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface PrintableBriefingProps {
  content: string;
  title: string;
  structured?: BriefingStructured | null;
}

/**
 * Componente invisível de impressão.
 * Se structured data está disponível, renderiza o layout executivo.
 * Caso contrário, fallback para markdown (backward compat).
 * Deve ser usado com useReactToPrint.
 */
export const PrintableBriefing = forwardRef<HTMLDivElement, PrintableBriefingProps>(
  ({ content, title, structured }, ref) => {
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
              font-size: 11pt;
              line-height: 1.5;
            }

            /* Forçar cores no PDF */
            .printable-briefing * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            /* Evitar quebras dentro de blocos */
            .printable-briefing table { break-inside: avoid; page-break-inside: avoid; }
            .printable-briefing .briefing-root { padding: 0 !important; }
            
            /* KPI cards — manter background no print */
            .printable-briefing div[style*="background: rgb(232"] {
              -webkit-print-color-adjust: exact !important;
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
            }
          }
        `}</style>

        {structured ? (
          <BriefingPreview data={structured} editable={false} />
        ) : (
          <>
            <h1 style={{ textAlign: "center", marginBottom: "8mm", fontFamily: "Georgia, serif", fontSize: "18pt" }}>{title}</h1>
            <MarkdownRenderer
              content={content}
              className="prose prose-sm max-w-none"
            />
          </>
        )}
      </div>
    );
  }
);

PrintableBriefing.displayName = "PrintableBriefing";
