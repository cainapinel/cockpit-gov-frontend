import { useState, forwardRef, useCallback } from "react";

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
  desafios_atuais?: string;
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
  proposta?: string;
}

export interface Propostas {
  eixos?: EixoProposta[];
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
      tag: Tag = "span",
    }: {
      section: keyof BriefingStructured;
      field: string;
      value?: string;
      className?: string;
      tag?: keyof JSX.IntrinsicElements;
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

    /* ─────────────────── RENDER ─────────────────── */
    return (
      <>
      {/* Print styles — quando este componente é a fonte de impressão */}
      <style>{`
        @media print {
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
          .briefing-root table { break-inside: avoid; page-break-inside: avoid; }
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
          <SectionTitle number={1} title="VISÃO GERAL DO MUNICÍPIO" />

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, margin: "20px 0" }}>
            <KpiCard
              value={fmtNum(vg.populacao_censo)}
              label="População CENSO (2022)"
              editable={editable}
              onEdit={(v) => update("visao_geral", "populacao_censo", v)}
            />
            <KpiCard
              value={vg.pib_display || "N/D"}
              label="PIB TOTAL"
              editable={editable}
              onEdit={(v) => update("visao_geral", "pib_display", v)}
            />
            <KpiCard
              value={String(vg.idhm || 0)}
              label={`IDHM (${vg.idhm_classificacao || "N/D"}) ${vg.idhm_ranking_rj || ""}° RJ`}
              editable={editable}
              onEdit={(v) => update("visao_geral", "idhm", v)}
            />
          </div>

          {/* Meta line */}
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#333", margin: "8px 0 0" }}>
            <b>Área:</b> {vg.area_km2 || 0} km² | <b>Densidade:</b> {vg.densidade_hab_km2 || 0} hab/km² | <b>Motor Econômico:</b>{" "}
            <EditSpan section="visao_geral" field="motor_economico" value={vg.motor_economico} />
            {" "}<b>Região:</b> {vg.regiao || "N/D"}
          </p>

          {/* ═══ SEÇÃO 2 — CENÁRIO POLÍTICO ═══ */}
          <div style={{ marginTop: 40 }}>
            <SectionTitle number={2} title="CENÁRIO POLÍTICO (ATORES E DINÂMICA)" />

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
          <div style={{ marginTop: 40 }}>
            <SectionTitle number={3} title="HISTÓRIA E CONTEXTO" />

            <div
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
                <BulletItem label="População-Alvo:">
                  <EditSpan section="historia_contexto" field="populacao_alvo" value={hc.populacao_alvo} className="italic text-sm" />
                </BulletItem>
              </ul>

              <div style={{ marginTop: 20 }}>
                <span style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>CURIOSIDADE: </span>
                <EditSpan section="historia_contexto" field="curiosidade" value={hc.curiosidade} className="italic text-sm" />
              </div>
              <div style={{ marginTop: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 14, textTransform: "uppercase" }}>DESAFIOS ATUAIS: </span>
                <EditSpan section="historia_contexto" field="desafios_atuais" value={hc.desafios_atuais} className="italic text-sm" />
              </div>
            </div>
          </div>

          {/* ═══ SEÇÃO 4 — INVESTIMENTOS ═══ */}
          <div style={{ marginTop: 40 }}>
            <SectionTitle number={4} title="INVESTIMENTO E IMPACTO" />

            <EditSpan section="investimentos" field="intro" value={inv.intro} tag="p" className="text-sm leading-relaxed mt-4" />

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
                <div style={{ marginTop: 32, border: '1px solid #e0e0e0', borderRadius: 6, padding: '24px 28px 16px', background: '#fff' }}>
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
                </div>
              );
            })()}
          </div>

          {/* ═══ SEÇÃO 5 — PROPOSTAS (Cross layout) ═══ */}
          <div style={{ marginTop: 40 }}>
            <SectionTitle number={5} title="PROPOSTAS DO PLANO DE GOVERNO (Foco Local)" />

            {(() => {
              const eixos = prop.eixos || [];
              // Map eixos to fixed positions: 0=Seguro, 1=Eficiente, 2=ParaTodos, 3=Próspero, 4=Futuro
              const getEixo = (idx: number) => eixos[idx] || { nome: EIXO_META[idx]?.label, proposta: "Análise em processamento" };
              const truncate = (text: string) => text && text.length > 325 ? text.slice(0, 322) + "..." : text;

              const EixoCard = ({ idx, style: extraStyle }: { idx: number; style?: React.CSSProperties }) => {
                const meta = EIXO_META[idx];
                const eixo = getEixo(idx);
                return (
                  <div
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
                    <p
                      contentEditable={editable}
                      suppressContentEditableWarning
                      style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "#333", outline: "none" }}
                    >
                      {truncate(eixo.proposta || "Análise em processamento")}
                    </p>
                  </div>
                );
              };

              return (
                <div style={{ marginTop: 24 }}>
                  {/* Row 1: Seguro (left) + Próspero (right) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                    <EixoCard idx={0} />
                    <EixoCard idx={3} />
                  </div>

                  {/* Row 2: Eficiente (center) */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                    <div style={{ width: "55%" }}>
                      <EixoCard idx={1} />
                    </div>
                  </div>

                  {/* Row 3: Para Todos (left) + Do Futuro (right) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <EixoCard idx={2} />
                    <EixoCard idx={4} />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ═══ SEÇÃO 6 — EMENDAS & ORÇAMENTO ═══ */}
          <div style={{ marginTop: 40, paddingBottom: 40 }}>
            <SectionTitle number={6} title="EMENDAS & ORÇAMENTO" />

            {eo.nota_emendas && (
              <p style={{ fontSize: 12, color: "#888", fontStyle: "italic", margin: "8px 0 0" }}>
                {eo.nota_emendas}
              </p>
            )}

            {(eo.emendas?.length ?? 0) > 0 ? (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#1a2332", color: "#fff" }}>
                      <th style={thStyle}>AUTOR</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>VALOR (R$)</th>
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
                  <div style={{ fontSize: 13, color: "#666", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Orçamento Municipal</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#1a2332", marginTop: 4 }} contentEditable={editable} suppressContentEditableWarning>{eo.orcamento_municipal || "Dado em levantamento"}</div>
                </div>
                {eo.dependencia_transferencias && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "#666", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Dependência de Transferências</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#c0392b", marginTop: 4 }}>{eo.dependencia_transferencias}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* ═══ FONTES ═══ */}
          {(local.fontes?.length ?? 0) > 0 && (
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "2px solid #e5e5e5", paddingBottom: 32 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>FONTES</h4>
              <ul style={{ margin: 0, padding: "0 0 0 20px", fontSize: 12, color: "#666", lineHeight: 2 }}>
                {local.fontes?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
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
  editable,
  onEdit,
}: {
  value: string;
  label: string;
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
    <div style={{ fontSize: 13, color: "#444", marginTop: 4, fontWeight: 500 }}>{label}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */

const EIXO_COLORS = ["#c0392b", "#27ae60", "#8e44ad", "#2d8a4e", "#2c3e8f"];

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
