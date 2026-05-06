import { useState, forwardRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export interface VisaoGeral {
  municipio_nome?: string;
  populacao_censo?: number;
  pib_display?: string;
  pib_per_capita?: number;
  idhm?: number;
  idhm_classificacao?: string;
  idhm_ranking_rj?: number;
  area_km2?: number;
  densidade_hab_km2?: number;
  motor_economico?: string;
  regiao?: string;
  fontes?: Record<string, string>;
}

export interface CenarioPolitico {
  executivo_prefeito?: string;
  executivo_partido?: string;
  executivo_coligacao?: string;
  executivo_margem?: string;
  legislativo_presidente?: string;
  legislativo_composicao?: string;
  perfil_eleitorado?: string;
  principais_aliados?: string;
}

export interface HistoriaContexto {
  intro?: string;
  vocacao_economica?: string;
  posicao_geografica?: string;
  populacao_alvo?: string;
  curiosidade?: string;
  desafios_atuais?: string[] | string;
}

export interface ObraMunicipio {
  obra?: string;
  impacto?: string;
  investimento?: string;
  status?: string;
}

export interface ObraRegiao {
  municipio?: string;
  tipo?: string;
  status?: string;
  investimento?: string;
  investimento_raw?: number;
}

interface ChartBarItem {
  municipio: string;
  valor: number;
}

export interface Investimentos {
  intro?: string;
  obras_municipio?: ObraMunicipio[];
  obras_regiao?: ObraRegiao[];
  total_investido_regiao?: string;
  regiao_nome?: string;
  chart_investimentos_regiao?: ChartBarItem[];
}

export interface EixoProposta {
  nome?: string;
  proposta?: string;   // legado
  itens?: string[];    // novo formato
}

export interface Propostas {
  eixos?: EixoProposta[];
  frases_chave?: string[];
}

export interface EmendaAutor {
  autor?: string;
  valor?: string;
  valor_raw?: number;
}

export interface EmendasOrcamento {
  emendas?: EmendaAutor[];
  total_emendas?: string;
  qtd_emendas?: number;
  orcamento_municipal?: string;
  receita_total?: number;
  dependencia_transferencias?: string;
  nota_emendas?: string;
  /** Mapa campo → nome da fonte, ex: { emendas: "Portal da Transpariência", orcamento: "SICONFI" } */
  fontes?: Record<string, string>;
}

export interface DorPrincipal {
  titulo?: string;
  descricao?: string;
  contexto?: string;
  ranking?: number;
  crescimento?: string;
}

export interface TermometroSocial {
  exists?: boolean;
  temperatura?: number;
  nivel_tensao?: string;
  sentimento_positivo?: number;
  sentimento_critico?: number;
  sentimento_neutro?: number;
  dores?: DorPrincipal[];
  recomendacoes?: { evitar?: string[]; priorizar?: string[] };
  alerta_crise?: { nivel?: string; descricao?: string; recomendacoes?: string };
  mencoes_totais?: number;
  data_geracao?: string;
}

export interface BriefingStructured {
  municipio?: string;
  data_geracao?: string;
  politico_nome?: string;
  visao_geral?: VisaoGeral;
  cenario_politico?: CenarioPolitico;
  historia_contexto?: HistoriaContexto;
  investimentos?: Investimentos;
  propostas?: Propostas;
  emendas_orcamento?: EmendasOrcamento;
  termometro_social?: TermometroSocial;
  thermometer_pending?: boolean;
  fontes?: string[];
}

interface BriefingPreviewProps {
  data: BriefingStructured;
  editable?: boolean;
  onDataChange?: (updated: BriefingStructured) => void;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

const fmtNum = (n?: number) => {
  if (!n) return "0";
  return n.toLocaleString("pt-BR");
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const BriefingPreview = forwardRef<HTMLDivElement, BriefingPreviewProps>(
  ({ data, editable = false, onDataChange }, ref) => {
    const [local, setLocal] = useState<BriefingStructured>(data);

    const vg = local.visao_geral || {};
    const cp = local.cenario_politico || {};
    const hc = local.historia_contexto || {};
    const inv = local.investimentos || {};
    const prop = local.propostas || {};
    const eo = local.emendas_orcamento || {};

    // Deep-update helper
    const update = useCallback(
      (section: keyof BriefingStructured, field: string, value: string) => {
        setLocal((prev) => {
          const next = { ...prev };
          const sec = { ...(next[section] as Record<string, unknown>) };
          sec[field] = value;
          (next as Record<string, unknown>)[section] = sec;
          onDataChange?.(next);
          return next;
        });
      },
      [onDataChange]
    );

    const EditSpan = ({
      section,
      field,
      value,
      className = "",
      tag: Tag = "span" as React.ElementType,
    }: {
      section: keyof BriefingStructured;
      field: string;
      value?: string;
      className?: string;
      tag?: React.ElementType;
    }) => (
      <Tag
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e: React.FocusEvent<HTMLElement>) =>
          update(section, field, e.currentTarget.textContent || "")
        }
        className={`${className} ${editable ? "outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 rounded px-0.5 transition-colors" : ""}`}
      >
        {value || "—"}
      </Tag>
    );
    // ── Citation system ──────────────────────────────────────────
    // citationMap: nome_da_fonte → número (ex: "IBGE Censo 2022" → 1)
    const citationMap = useMemo(() => {
      const map = new Map<string, number>();
      (local.fontes || []).forEach((src, i) => map.set(src, i + 1));
      return map;
    }, [local.fontes]);

    /**
     * Retorna o número de citação para um campo de uma seção.
     * Ex: getCite(vg.fontes, "populacao") → 2
     */
    const getCite = (
      sectionFontes: Record<string, string> | undefined,
      key: string
    ): number | null => {
      const src = sectionFontes?.[key];
      return src ? (citationMap.get(src) ?? null) : null;
    };

    /** Superscript de citação: [N] em azul */
    const Cite = ({ n }: { n: number | null }) =>
      n ? (
        <sup
          style={{
            fontSize: "0.6em",
            color: "#2c4a7c",
            fontWeight: 800,
            marginLeft: 2,
            letterSpacing: 0,
          }}
        >
          [{n}]
        </sup>
      ) : null;
    // ────────────────────────────────────────────────────────────

    return (
      <>
      {/* Print styles — quando este componente é a fonte de impressão */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 16mm 14mm 16mm;
          }
          body * { visibility: hidden !important; }
          .briefing-root, .briefing-root * { visibility: visible !important; }
          .briefing-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            background: white !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
            overflow: visible !important;
            max-height: none !important;
          }
          .briefing-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* ── Regras de quebra de página (A4, impressão) ──

             REGRA FUNDAMENTAL:
             break-inside: avoid só em elementos PEQUENOS e atômicos.
             Em containers grandes, o navegador empurra o bloco inteiro
             para a próxima página, deixando um espaço em branco enorme.
             Sequência de página deve fluir naturalmente.
          */

          /* Header: sempre íntegro (pequeno, cabe em qualquer página) */
          .briefing-header {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* KPI grid: 3 cards em linha — pequeno, nunca cortar */
          .briefing-kpi-grid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Linhas de tabela: nível atômico correto para break-inside */
          .briefing-root table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          /* Cabeçalho de tabela nunca fica sozinho sem a primeira linha */
          .briefing-root table thead {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          /*
            Blocos decorativos PEQUENOS (card individual de eixo, bloco de
            desafios com poucos itens, frases-chave, rodapé de fontes).
            NÃO aplicar em blocos que possam ser maiores que meia página A4.
          */
          .briefing-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Título de seção: nunca fica orphão no final da página */
          .briefing-section-title {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          /*
            SEÇÕES QUE SEMPRE INICIAM EM NOVA PÁGINA (A4):
            3 = História e Contexto
            4 = Investimento e Impacto
            5 = Propostas
            7 = Termômetro Redes Sociais
            As seções 1 e 2 cabem na primeira página junto com o header.
          */
          .briefing-section-new-page {
            break-before: page !important;
            page-break-before: always !important;
          }

          /* Parágrafos: evitar linhas soltas (orphan/widow) */
          .briefing-root p {
            orphans: 2;
            widows: 2;
          }

          .briefing-root [contenteditable] {
            outline: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .custom-scrollbar { overflow: visible !important; max-height: none !important; }
        }
      `}</style>
      <div ref={ref} className="briefing-root" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#1a2332", background: "#fff", maxWidth: 794 }}>
        {/* ═══ HEADER ═══ */}
        <div
          className="briefing-header"
          style={{
            background: "linear-gradient(135deg, #1a2332 0%, #2c4a7c 100%)",
            color: "#fff",
            padding: "40px 48px 32px",
            borderRadius: "0",
          }}
        >
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: 1, margin: 0, lineHeight: 1.1 }}>BRIEFING DE RUA</h1>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0", opacity: 0.9 }}>{local.municipio}</h2>
        </div>

        {/* ═══ SEÇÃO 1 — VISÃO GERAL ═══ */}
        <div style={{ padding: "32px 48px" }}>
          <div className="briefing-section-title"><SectionTitle number={1} title="VISÃO GERAL DO MUNICÍPIO" /></div>

          {/* KPI Cards */}
          <div className="briefing-kpi-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, margin: "20px 0" }}>
            <KpiCard
              value={fmtNum(vg.populacao_censo)}
              label="População CENSO (2022)"
              cite={getCite(vg.fontes, "populacao")}
              editable={editable}
              onEdit={(v) => update("visao_geral", "populacao_censo", v)}
            />
            <KpiCard
              value={vg.pib_display || "N/D"}
              label="PIB TOTAL"
              cite={getCite(vg.fontes, "pib")}
              editable={editable}
              onEdit={(v) => update("visao_geral", "pib_display", v)}
            />
            <KpiCard
              value={String(vg.idhm || 0)}
              label={`IDHM (${vg.idhm_classificacao || "N/D"}) ${vg.idhm_ranking_rj || ""}° RJ`}
              cite={getCite(vg.fontes, "idhm")}
              editable={editable}
              onEdit={(v) => update("visao_geral", "idhm", v)}
            />
          </div>

          {/* Meta line */}
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#333", margin: "8px 0 0" }}>
            <b>Área:</b> {vg.area_km2 || 0} km²<Cite n={getCite(vg.fontes, "area")} /> | <b>Densidade:</b> {vg.densidade_hab_km2 || 0} hab/km²<Cite n={getCite(vg.fontes, "area")} /> | <b>Motor Econômico:</b>{" "}
            <EditSpan section="visao_geral" field="motor_economico" value={vg.motor_economico} />
            {" "}<b>Região:</b> {vg.regiao || "N/D"}
          </p>

          {/* ═══ SEÇÃO 2 — CENÁRIO POLÍTICO ═══ */}
          {/* Não usar break-inside:avoid aqui — seção grande, deixar o fluxo decidir */}
          <div style={{ marginTop: 40 }}>
            <div className="briefing-section-title"><SectionTitle number={2} title="CENÁRIO POLÍTICO (ATORES E DINÂMICA)" /></div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 20 }}>
              {/* Executivo */}
              <div>
                <Badge label="EXECUTIVO" />
                <div style={{ marginTop: 16, fontSize: 14, lineHeight: 2 }}>
                  <Row label="Prefeito (a):"><EditSpan section="cenario_politico" field="executivo_prefeito" value={cp.executivo_prefeito} /></Row>
                  <Row label="Partido:"><EditSpan section="cenario_politico" field="executivo_partido" value={cp.executivo_partido} /></Row>
                  <Row label="Coligação:"><EditSpan section="cenario_politico" field="executivo_coligacao" value={cp.executivo_coligacao} /></Row>
                  <Row label="Margem de vitória:"><EditSpan section="cenario_politico" field="executivo_margem" value={cp.executivo_margem} /></Row>
                </div>
              </div>
              {/* Legislativo */}
              <div>
                <Badge label="LEGISLATIVO" />
                <div style={{ marginTop: 16, fontSize: 14 }}>
                  <p style={{ margin: "0 0 8px" }}>
                    <b>Presidente da Câmara:</b><br />
                    <EditSpan section="cenario_politico" field="legislativo_presidente" value={cp.legislativo_presidente} />
                  </p>
                  <p style={{ margin: "16px 0 0" }}>
                    <b>Composição partidária relevante:</b><br />
                    <EditSpan section="cenario_politico" field="legislativo_composicao" value={cp.legislativo_composicao} />
                  </p>
                </div>
              </div>
            </div>

            {/* Perfil do Eleitorado */}
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, textDecoration: "underline", margin: "0 0 6px" }}>Perfil do Eleitorado:</h4>
              <EditSpan section="cenario_politico" field="perfil_eleitorado" value={cp.perfil_eleitorado} tag="p" className="text-sm leading-relaxed" />
            </div>
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, textDecoration: "underline", margin: "0 0 6px" }}>Principais Aliados:</h4>
              <EditSpan section="cenario_politico" field="principais_aliados" value={cp.principais_aliados} tag="p" className="text-sm leading-relaxed" />
            </div>
          </div>

          {/* ═══ SEÇÃO 3 — HISTÓRIA E CONTEXTO ═══ */}
          <div className="briefing-section-new-page" style={{ marginTop: 40 }}>
            <div className="briefing-section-title"><SectionTitle number={3} title="HISTÓRIA E CONTEXTO" /></div>

            <div
              className="briefing-block"
              style={{
                borderLeft: "4px solid #2c4a7c",
                background: "#f5f3ef",
                padding: "24px 28px",
                marginTop: 16,
                borderRadius: "0 8px 8px 0",
              }}
            >
              <EditSpan section="historia_contexto" field="intro" value={hc.intro} tag="p" className="text-sm leading-relaxed mb-4" />

              <h4 style={{ fontWeight: 800, fontSize: 14, margin: "20px 0 12px", textTransform: "uppercase" }}>PERFIL:</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <BulletItem label="Vocação econômica:">
                  <EditSpan section="historia_contexto" field="vocacao_economica" value={hc.vocacao_economica} className="italic text-sm" />
                </BulletItem>
                <BulletItem label="Posição Geográfica:">
                  <EditSpan section="historia_contexto" field="posicao_geografica" value={hc.posicao_geografica} className="italic text-sm" />
                </BulletItem>
                <BulletItem label="População-Alvo (Perfil e Gênero):">
                  <EditSpan section="historia_contexto" field="populacao_alvo" value={hc.populacao_alvo} className="italic text-sm" />
                </BulletItem>
              </ul>

              <div style={{ marginTop: 20 }}>
                <span style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>CURIOSIDADE: </span>
                <EditSpan section="historia_contexto" field="curiosidade" value={hc.curiosidade} className="italic text-sm" />
              </div>
            </div>
          </div>

          {/* ═══ SEÇÃO 3.5 — DESAFIOS ATUAIS ═══ */}
          {(() => {
            const desafios = Array.isArray(hc.desafios_atuais)
              ? hc.desafios_atuais
              : hc.desafios_atuais
                ? hc.desafios_atuais.split(/[.!?]+/).map(s => s.trim()).filter(Boolean)
                : [];
            if (desafios.length === 0) return null;
            return (
              <div className="briefing-block" style={{ marginTop: 32 }}>
                <div style={{
                  background: "#1a2332",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "6px 6px 0 0",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}>⚠️ Desafios Atuais</div>
                <div style={{
                  border: "1px solid #e0e0e0",
                  borderTop: "none",
                  borderRadius: "0 0 6px 6px",
                  padding: "16px 20px",
                  background: "#fff",
                }}>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {desafios.map((d, i) => (
                      <li key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.6 }}>
                        <span style={{ color: "#c0392b", fontWeight: 900, flexShrink: 0, marginTop: 2 }}>▸</span>
                        <span
                          contentEditable={editable}
                          suppressContentEditableWarning
                          style={{ outline: "none", flex: 1 }}
                        >{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}

          {/* ═══ SEÇÃO 4 — INVESTIMENTOS ═══ */}
          <div className="briefing-section-allow-break briefing-section-new-page" style={{ marginTop: 40 }}>
            {/* Lead block: título + intro juntos */}
            <div className="briefing-block" style={{ marginBottom: 4 }}>
              <div className="briefing-section-title"><SectionTitle number={4} title="INVESTIMENTO E IMPACTO" /></div>
              <EditSpan section="investimentos" field="intro" value={inv.intro} tag="p" className="text-sm leading-relaxed mt-4" />
            </div>

            {/* Tabela de obras do município */}
            {(inv.obras_municipio?.length ?? 0) > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#1a2332", color: "#fff" }}>
                    <th style={thStyle}>OBRA / INTERVENÇÃO:</th>
                    <th style={thStyle}>IMPACTO:</th>
                    <th style={thStyle}>INVESTIMENTO:</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.obras_municipio?.map((o, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={tdStyle} contentEditable={editable} suppressContentEditableWarning>{o.obra}</td>
                      <td style={tdStyle} contentEditable={editable} suppressContentEditableWarning>{o.impacto}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, fontStyle: "italic" }} contentEditable={editable} suppressContentEditableWarning>{o.investimento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Gráfico de barras regional — investimento por município */}
            {(inv.chart_investimentos_regiao?.length ?? 0) > 0 && (() => {
              const chartData = inv.chart_investimentos_regiao!;
              const maxVal = Math.max(...chartData.map(d => d.valor));
              const formatBR = (v: number) =>
                `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

              // Cores gradiente roxo → azul → teal → verde → olive (como na referência)
              const barColors = [
                '#5b3a8c', '#4a4e8a', '#3d6278', '#3a7868', '#4a8a5a',
                '#5c9c4e', '#6fa844', '#84b23e', '#9abc38', '#b0c632',
              ];

              // Calcular ticks do eixo X
              const niceMax = Math.ceil(maxVal / 10_000_000) * 10_000_000;
              const tickStep = niceMax > 0 ? niceMax / 5 : 10_000_000;
              const ticks = Array.from({ length: 6 }, (_, i) => i * tickStep);

              return (
                <div className="briefing-block" style={{ marginTop: 32, border: '1px solid #e0e0e0', borderRadius: 6, padding: '24px 28px 16px', background: '#fff' }}>
                  {/* Título */}
                  <h4 style={{ fontSize: 15, fontWeight: 700, textAlign: 'center', margin: '0 0 24px', color: '#1a2332' }}>
                    Total de Investimento por Município - {inv.regiao_nome}
                  </h4>

                  <div style={{ display: 'flex' }}>
                    {/* Y-axis label */}
                    <div style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}>
                      Município
                    </div>

                    {/* Chart area */}
                    <div style={{ flex: 1 }}>
                      {/* Bars */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                        {/* Grid lines (vertical) */}
                        {ticks.map((t, i) => (
                          <div key={`grid-${i}`} style={{
                            position: 'absolute',
                            left: `calc(140px + ${(t / niceMax) * (100 - 22)}%)`,
                            top: 0,
                            bottom: 0,
                            width: 1,
                            background: '#e8e8e8',
                            zIndex: 0,
                          }} />
                        ))}

                        {chartData.map((d, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0, zIndex: 1, minHeight: 32 }}>
                            {/* Municipality name */}
                            <span style={{
                              width: 140,
                              fontSize: 12,
                              fontWeight: 500,
                              textAlign: 'right',
                              paddingRight: 12,
                              flexShrink: 0,
                              color: '#333',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {d.municipio}
                            </span>
                            {/* Bar + value */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{
                                  width: `${niceMax > 0 ? (d.valor / niceMax) * 100 : 0}%`,
                                  minWidth: 3,
                                  height: 28,
                                  background: barColors[i % barColors.length],
                                  borderRadius: '0 3px 3px 0',
                                }}
                              />
                              <span style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#333',
                                whiteSpace: 'nowrap',
                              }}>
                                {formatBR(d.valor)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* X-axis ticks */}
                      <div style={{ display: 'flex', marginTop: 8, paddingLeft: 140 }}>
                        {ticks.map((t, i) => (
                          <span key={i} style={{
                            flex: i === 0 ? 'none' : 1,
                            fontSize: 10,
                            color: '#888',
                            textAlign: i === 0 ? 'left' : 'right',
                            width: i === 0 ? 0 : undefined,
                          }}>
                            {`R$ ${(t / 1_000_000).toFixed(0)}.000.000`}
                          </span>
                        ))}
                      </div>

                      {/* X-axis label */}
                      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#666', marginTop: 6, paddingLeft: 140 }}>
                        Valor Investido (R$)
                      </div>
                    </div>
                  </div>

                  {/* Total investido */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#1a2332',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '0 0 6px 6px',
                    marginTop: 16,
                    fontWeight: 800,
                    fontSize: 15,
                  }}>
                    <span>TOTAL INVESTIDO NA REGIÃO:</span>
                    <span contentEditable={editable} suppressContentEditableWarning style={{ outline: 'none' }}>
                      {inv.total_investido_regiao || formatBR(chartData.reduce((s, d) => s + d.valor, 0))}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ═══ SEÇÃO 5 — PROPOSTAS (Cross layout) ═══ */}
          {/* ═══ SEÇÃO 5 — PROPOSTAS ═══ */}
          <div className="briefing-section-allow-break briefing-section-new-page" style={{ marginTop: 40 }}>

            {(() => {
              const eixos = prop.eixos || [];
              // Map eixos to fixed positions: 0=Seguro, 1=Eficiente, 2=ParaTodos, 3=Próspero, 4=Futuro
              const getEixo = (idx: number) => eixos[idx] || { nome: EIXO_META[idx]?.label, proposta: "Análise em processamento" };

              const EixoCard = ({ idx, style: extraStyle }: { idx: number; style?: React.CSSProperties }) => {
                const meta = EIXO_META[idx];
                const eixo = getEixo(idx);
                // Support both legacy 'proposta' string and new 'itens' list
                const itens: string[] = eixo.itens?.length
                  ? eixo.itens
                  : eixo.proposta
                    ? [eixo.proposta]
                    : ["Análise em processamento"];
                return (
                  <div
                    className="briefing-block"
                    style={{
                      borderLeft: `4px solid ${meta.color}`,
                      padding: "18px 20px",
                      background: "#fff",
                      borderRadius: "0 6px 6px 0",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      ...extraStyle,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{meta.icon}</span>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: meta.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {eixo.nome || meta.label}
                      </h4>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                      {itens.map((item, i) => (
                        <li key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start", fontSize: 12, lineHeight: 1.6 }}>
                          <span style={{ color: meta.color, fontWeight: 900, flexShrink: 0, marginTop: 2 }}>•</span>
                          <span
                            contentEditable={editable}
                            suppressContentEditableWarning
                            style={{ outline: "none", flex: 1, color: "#333" }}
                          >{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              };

              return (
                <div>
                  {/*
                    "Lead block": título + Row 1 sempre juntos na mesma página.
                    break-inside: avoid impede que o título fique orphão
                    e garante que ao menos o primeiro par de cards o acompanhe.
                  */}
                  <div className="briefing-block" style={{ marginBottom: 20 }}>
                    <div className="briefing-section-title" style={{ marginBottom: 20 }}>
                      <SectionTitle number={5} title="PROPOSTAS DO PLANO DE GOVERNO (Foco Local)" />
                    </div>
                    {/* Row 1: Seguro (left) + Próspero (right) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <EixoCard idx={0} />
                      <EixoCard idx={3} />
                    </div>
                  </div>

                  {/* Row 2: Eficiente (center) */}
                  <div className="briefing-block" style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                    <div style={{ width: "55%" }}>
                      <EixoCard idx={1} />
                    </div>
                  </div>

                  {/* Row 3: Para Todos (left) + Do Futuro (right) */}
                  <div className="briefing-block" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <EixoCard idx={2} />
                    <EixoCard idx={4} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ═══ FRASES-CHAVE PARA A VISITA ═══ */}
          {(prop.frases_chave?.length ?? 0) > 0 && (
            <div className="briefing-block" style={{ marginTop: 32 }}>
              <div style={{
                background: "linear-gradient(135deg, #2c4a7c 0%, #1a2332 100%)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "6px 6px 0 0",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}>💬 Frases-Chave para a Visita</div>
              <div style={{
                border: "1px solid #2c4a7c",
                borderTop: "none",
                borderRadius: "0 0 6px 6px",
                padding: "16px 20px",
                background: "#f8f9fb",
              }}>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {prop.frases_chave?.map((frase, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.6, fontStyle: "italic" }}>
                      <span style={{ color: "#2c4a7c", fontWeight: 900, flexShrink: 0, fontSize: 16 }}>•</span>
                      <span
                        contentEditable={editable}
                        suppressContentEditableWarning
                        style={{ outline: "none", flex: 1, fontWeight: 600, color: "#1a2332" }}
                      >"{frase}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ═══ SEÇÃO 6 — EMENDAS & ORÇAMENTO ═══ */}
          <div className="briefing-section-allow-break" style={{ marginTop: 40, paddingBottom: 40 }}>
            {/* Lead block: título + nota juntos */}
            <div className="briefing-block" style={{ marginBottom: 4 }}>
              <div className="briefing-section-title"><SectionTitle number={6} title="EMENDAS & ORÇAMENTO" /></div>
              {eo.nota_emendas && (
                <p style={{ fontSize: 12, color: "#888", fontStyle: "italic", margin: "8px 0 0" }}>
                  {eo.nota_emendas}
                </p>
              )}
            </div>

            {(eo.emendas?.length ?? 0) > 0 ? (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#1a2332", color: "#fff" }}>
                      <th style={thStyle}>AUTOR</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>VALOR (R$)<Cite n={getCite(eo.fontes, "emendas")} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {eo.emendas?.map((e, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e5e5e5" }}>
                        <td style={tdStyle} contentEditable={editable} suppressContentEditableWarning>{e.autor}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }} contentEditable={editable} suppressContentEditableWarning>{e.valor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    background: "#1a2332",
                    color: "#fff",
                    padding: "12px 16px",
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  <span>TOTAL EMENDAS ({eo.qtd_emendas || 0})</span>
                  <span contentEditable={editable} suppressContentEditableWarning>{eo.total_emendas}</span>
                </div>
              </>
            ) : (
              <p style={{ marginTop: 16, fontSize: 14, color: "#888", fontStyle: "italic" }}>
                ⏳ Aguardando sincronização com base do Tesouro/Emendas Parlamentares.
              </p>
            )}

            {/* Orçamento */}
            <div style={{ marginTop: 24, padding: "20px 24px", background: "#f5f3ef", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#666", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Orçamento Municipal<Cite n={getCite(eo.fontes, "orcamento")} /></div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#1a2332", marginTop: 4 }} contentEditable={editable} suppressContentEditableWarning>{eo.orcamento_municipal || "Dado em levantamento"}</div>
                </div>
                {eo.dependencia_transferencias && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "#666", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Dependência de Transferências<Cite n={getCite(eo.fontes, "orcamento")} /></div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#c0392b", marginTop: 4 }}>{eo.dependencia_transferencias}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* ═══ FONTES (lista numerada) ═══ */}

          {/* ═══ SEÇÃO 7 — TERMÔMETRO REDES SOCIAIS ═══ */}
          {(() => {
            const ts = local.termometro_social;
            const pending = local.thermometer_pending;

            // Banner de aviso quando não gerado
            if (pending || !ts?.exists) {
              return (
                <div className="briefing-section-new-page" style={{ marginTop: 40 }}>
                  <div className="briefing-section-title"><SectionTitle number={7} title="TERMÔMETRO REDES SOCIAIS" /></div>
                  <div style={{
                    marginTop: 16,
                    background: "#fff8e1",
                    border: "2px dashed #f59e0b",
                    borderRadius: 10,
                    padding: "24px 28px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                  }}>
                    <span style={{ fontSize: 28 }}>📡</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#b45309", marginBottom: 6 }}>
                        Termômetro de Redes Sociais não gerado para {local.municipio || "este município"}
                      </div>
                      <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>
                        Para incluir os dados de sentimento social (dores da região, recomendações e alerta de crise) neste briefing,
                        gere o Termômetro na seção <strong>Sentimento Social</strong> do menu lateral antes de gerar o briefing.
                        As análises de sentimento enriquecem significativamente o planejamento de agenda de rua.
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Temperatura: cor por nível
            const temp = ts.temperatura ?? 0;
            const tempColor = temp >= 70 ? "#c0392b" : temp >= 40 ? "#e67e22" : "#27ae60";
            const nivelLabel = ts.nivel_tensao || "N/D";

            return (
              <div className="briefing-section-new-page" style={{ marginTop: 40 }}>
                <div className="briefing-section-title"><SectionTitle number={7} title="TERMÔMETRO REDES SOCIAIS" /></div>
                {ts.data_geracao && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Dados coletados em: {ts.data_geracao}</div>
                )}

                {/* Gauge + Sentimentos */}
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, marginTop: 20 }}>
                  {/* Gauge circular simples */}
                  <div style={{
                    background: "#1a2332",
                    borderRadius: 12,
                    padding: "28px 16px",
                    textAlign: "center",
                    color: "#fff",
                  }}>
                    <div style={{ fontSize: 52, fontWeight: 900, color: tempColor, lineHeight: 1 }}>{temp}°</div>
                    <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Temperatura</div>
                    <div style={{
                      marginTop: 12,
                      display: "inline-block",
                      background: tempColor,
                      color: "#fff",
                      padding: "4px 14px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}>{nivelLabel}</div>
                    {ts.mencoes_totais != null && (
                      <div style={{ marginTop: 10, fontSize: 11, opacity: 0.6 }}>{ts.mencoes_totais.toLocaleString("pt-BR")} menções</div>
                    )}
                  </div>

                  {/* Barras de sentimento */}
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                    {[
                      { label: "Positivo", value: ts.sentimento_positivo ?? 0, color: "#27ae60" },
                      { label: "Neutro", value: ts.sentimento_neutro ?? 0, color: "#7f8c8d" },
                      { label: "Crítico", value: ts.sentimento_critico ?? 0, color: "#c0392b" },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                          <span>{label}</span>
                          <span style={{ color }}>{value}%</span>
                        </div>
                        <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dores da Região */}
                {(ts.dores?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 28 }}>
                    <div style={{
                      background: "#1a2332",
                      color: "#fff",
                      padding: "10px 20px",
                      borderRadius: "6px 6px 0 0",
                      fontWeight: 800,
                      fontSize: 13,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}>⚠️ As "Dores" da Região — TOP {ts.dores!.length}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, padding: 16, border: "1px solid #e0e0e0", borderTop: "none", borderRadius: "0 0 6px 6px", background: "#fff" }}>
                      {ts.dores!.map((dor, i) => (
                        <div key={i} style={{ background: "#f9f9f9", borderRadius: 8, padding: "14px 16px", borderLeft: `4px solid ${tempColor}` }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: tempColor, textTransform: "uppercase", marginBottom: 4 }}>#{dor.ranking ?? i + 1}</div>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{dor.titulo}</div>
                          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{dor.descricao}</div>
                          {dor.crescimento && (
                            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: "#e67e22" }}>
                              ↗ {dor.crescimento} em menções
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recomendações */}
                {ts.recomendacoes && (ts.recomendacoes.evitar?.length || ts.recomendacoes.priorizar?.length) ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
                    {/* Evitar */}
                    {(ts.recomendacoes.evitar?.length ?? 0) > 0 && (
                      <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: 8, padding: "16px 18px" }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#c0392b", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>↓</span> Evitar
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                          {ts.recomendacoes.evitar!.map((item, i) => (
                            <li key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, lineHeight: 1.5, alignItems: "flex-start" }}>
                              <span style={{ color: "#c0392b", fontWeight: 900, flexShrink: 0 }}>▸</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Priorizar */}
                    {(ts.recomendacoes.priorizar?.length ?? 0) > 0 && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "16px 18px" }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#16a34a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>↑</span> Priorizar
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                          {ts.recomendacoes.priorizar!.map((item, i) => (
                            <li key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, lineHeight: 1.5, alignItems: "flex-start" }}>
                              <span style={{ color: "#16a34a", fontWeight: 900, flexShrink: 0 }}>▸</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Alerta de Crise */}
                {ts.alerta_crise?.nivel && ts.alerta_crise.nivel !== "BAIXO" && (
                  <div style={{
                    marginTop: 20,
                    background: ts.alerta_crise.nivel === "ALTO" ? "#fff5e0" : "#fffbeb",
                    border: `1px solid ${ts.alerta_crise.nivel === "ALTO" ? "#f59e0b" : "#fcd34d"}`,
                    borderRadius: 8,
                    padding: "16px 18px",
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#92400e", marginBottom: 6 }}>
                      ⚠️ Alerta de Crise — Nível {ts.alerta_crise.nivel}
                    </div>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>{ts.alerta_crise.descricao}</p>
                    {ts.alerta_crise.recomendacoes && (
                      <p style={{ margin: 0, fontSize: 12, color: "#92400e", fontStyle: "italic" }}>{ts.alerta_crise.recomendacoes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══ FONTES (lista numerada) ═══ */}
          {(local.fontes?.length ?? 0) > 0 && (
            <div
              className="briefing-block"
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: "2px solid #e5e5e5",
                paddingBottom: 32,
              }}
            >
              <h4 style={{ fontSize: 12, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 10px" }}>
                FONTES E REFERÊNCIAS
              </h4>
              <ol style={{ margin: 0, padding: "0 0 0 0", listStyle: "none" }}>
                {local.fontes?.map((f, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 4,
                      fontSize: 11,
                      color: "#555",
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        minWidth: 22,
                        fontWeight: 800,
                        color: "#2c4a7c",
                        flexShrink: 0,
                      }}
                    >
                      [{i + 1}]
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }
);

BriefingPreview.displayName = "BriefingPreview";

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const SectionTitle = ({ number, title }: { number: number; title: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ width: 14, height: 14, background: "#2c4a7c", borderRadius: 2, flexShrink: 0 }} />
    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a2332" }}>
      <span style={{ marginRight: 8 }}>{number}.</span>{title}
    </h3>
  </div>
);

const Badge = ({ label }: { label: string }) => (
  <div
    style={{
      display: "inline-block",
      background: "#1a2332",
      color: "#fff",
      padding: "6px 24px",
      fontWeight: 800,
      fontSize: 13,
      letterSpacing: 1.5,
      borderRadius: "0 6px 6px 0",
    }}
  >
    {label}
  </div>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", gap: 8 }}>
    <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>
    {children}
  </div>
);

const BulletItem = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <li style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
    <div style={{ width: 10, height: 10, background: "#2c4a7c", borderRadius: 2, marginTop: 4, flexShrink: 0 }} />
    <div>
      <b>{label}</b> {children}
    </div>
  </li>
);

const KpiCard = ({
  value,
  label,
  cite,
  editable,
  onEdit,
}: {
  value: string;
  label: string;
  cite?: number | null;
  editable: boolean;
  onEdit: (v: string) => void;
}) => (
  <div
    style={{
      background: "#e8e4df",
      borderRadius: 10,
      padding: "24px 20px",
      textAlign: "center",
    }}
  >
    <div
      contentEditable={editable}
      suppressContentEditableWarning
      onBlur={(e) => onEdit(e.currentTarget.textContent || "")}
      style={{
        fontSize: 32,
        fontWeight: 900,
        color: "#1a2332",
        outline: "none",
        cursor: editable ? "text" : "default",
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 13, color: "#444", marginTop: 4, fontWeight: 500 }}>
      {label}
      {cite != null && (
        <sup style={{ fontSize: "0.6em", color: "#2c4a7c", fontWeight: 800, marginLeft: 2 }}>
          [{cite}]
        </sup>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */

// EIXO_COLORS removido — cores definidas em EIXO_META

const EIXO_META = [
  { label: "Estado Seguro", color: "#c0392b", icon: "🛡️" },
  { label: "Estado Eficiente", color: "#27ae60", icon: "⚙️" },
  { label: "Estado Para Todos", color: "#8e44ad", icon: "🧱" },
  { label: "Estado Próspero", color: "#2d8a4e", icon: "🌿" },
  { label: "Estado do Futuro", color: "#2c3e8f", icon: "🚀" },
];

const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 14px",
  verticalAlign: "top",
  fontSize: 13,
  lineHeight: 1.5,
};
