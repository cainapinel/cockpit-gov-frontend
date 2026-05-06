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
            @page {
              size: A4 portrait;
              margin: 14mm 16mm 14mm 16mm;
            }

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

            /* ── Regras de quebra de página A4 ──*/

            /* Seções que sempre iniciam em nova página */
            .printable-briefing .briefing-section-new-page {
              break-before: page !important;
              page-break-before: always !important;
            }

            /* Header sempre íntegro */
            .printable-briefing .briefing-header {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            /* KPI grid: compacto, nunca cortar */
            .printable-briefing .briefing-kpi-grid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            /* Linhas de tabela: nível atômico correto */
            .printable-briefing table tr {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            /* Cabeçalho de tabela nunca fica sozinho */
            .printable-briefing table thead {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }

            /* Blocos decorativos pequenos */
            .printable-briefing .briefing-block {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            /* Título de seção nunca fica orphão no final da página */
            .printable-briefing .briefing-section-title {
              break-after: avoid !important;
              page-break-after: avoid !important;
            }

            /* Parágrafos: evitar linhas soltas */
            .printable-briefing p {
              orphans: 2;
              widows: 2;
            }

            .printable-briefing .briefing-root { padding: 0 !important; }
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
