import { useState, useCallback, useEffect, useRef } from "react";
import {
  Thermometer as ThermometerIcon, AlertTriangle, TrendingUp, Users, MessageSquare,
  RefreshCw, CheckCircle2, XCircle, Loader2, ArrowUp, ArrowDown, Zap,
  AtSign, Camera, Plus, X as XIcon, Settings, ChevronDown, ChevronUp, Save,
} from "lucide-react";
import { thermometerService, type ThermometerKeyAccounts } from "@/services/thermometerService";
import { MentionsModal } from "@/components/MentionsModal";
import type { ThermometerData, ThermometerMencao } from "@/types/thermometer";

// ── Paleta por nível de tensão ──────────────────────────────────────────────
const TENSAO_CONFIG = {
  BAIXO:   { color: "text-green-400",  bg: "bg-green-500/20",   border: "border-green-500/40",  label: "BAIXO",   dot: "bg-green-500" },
  MÉDIO:   { color: "text-yellow-400", bg: "bg-yellow-500/20",  border: "border-yellow-500/40", label: "MÉDIO",   dot: "bg-yellow-500" },
  ALTO:    { color: "text-orange-400", bg: "bg-orange-500/20",  border: "border-orange-500/40", label: "ALTO",    dot: "bg-orange-500" },
  CRÍTICO: { color: "text-red-400",    bg: "bg-red-500/20",     border: "border-red-500/40",    label: "CRÍTICO", dot: "bg-red-500" },
};

const tempColor = (t: number) => {
  if (t >= 80) return "#ef4444";
  if (t >= 60) return "#f97316";
  if (t >= 40) return "#eab308";
  if (t >= 20) return "#22c55e";
  return "#3b82f6";
};

// ── Sub-componentes ─────────────────────────────────────────────────────────
const MetricCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
    <p className="text-slate-400 text-xs uppercase tracking-widest mb-1.5">{label}</p>
    <p className="text-3xl font-black text-white leading-none">{value}</p>
    {sub && <p className="text-slate-400 text-xs mt-2">{sub}</p>}
  </div>
);

// ── Page ────────────────────────────────────────────────────────────────────
export function Thermometer() {
  const [municipio, setMunicipio] = useState("");
  const [data, setData] = useState<ThermometerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedDor, setExpandedDor] = useState<number | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<{ keyword: string; mentions: ThermometerMencao[] } | null>(null);

  // ── Contas Chave ──────────────────────────────────────────────────────────
  const [showKeyAccounts, setShowKeyAccounts] = useState(false);
  const [keyAccounts, setKeyAccounts] = useState<ThermometerKeyAccounts | null>(null);
  const [keyAccountsLoading, setKeyAccountsLoading] = useState(false);
  const [keyAccountsSaving, setKeyAccountsSaving] = useState(false);
  const [keyAccountsSaved, setKeyAccountsSaved] = useState(false);
  const [twitterInput, setTwitterInput] = useState("");
  const [instagramInput, setInstagramInput] = useState("");
  const [facebookInput, setFacebookInput] = useState("");
  const [localTwitter, setLocalTwitter] = useState<string[]>([]);
  const [localInstagram, setLocalInstagram] = useState<string[]>([]);
  const [localFacebook, setLocalFacebook] = useState<string[]>([]);
  const twitterRef = useRef<HTMLInputElement>(null);
  const instagramRef = useRef<HTMLInputElement>(null);
  const facebookRef = useRef<HTMLInputElement>(null);

  // Carrega contas chave ao selecionar município
  const loadKeyAccounts = useCallback(async (m: string) => {
    if (!m.trim()) return;
    setKeyAccountsLoading(true);
    try {
      const ka = await thermometerService.getKeyAccounts(m.trim());
      setKeyAccounts(ka);
      setLocalTwitter(ka.twitter_handles || []);
      setLocalInstagram(ka.instagram_usernames || []);
      setLocalFacebook(ka.facebook_pages || []);
    } catch {
      setKeyAccounts(null);
      setLocalTwitter([]);
      setLocalInstagram([]);
      setLocalFacebook([]);
    } finally {
      setKeyAccountsLoading(false);
    }
  }, []);

  // Dispara o load ao abrir o painel
  useEffect(() => {
    if (showKeyAccounts && municipio.trim()) {
      loadKeyAccounts(municipio);
    }
  }, [showKeyAccounts, municipio, loadKeyAccounts]);

  const addHandle = (type: "twitter" | "instagram" | "facebook") => {
    const raw = type === "twitter" ? twitterInput.trim()
              : type === "instagram" ? instagramInput.trim()
              : facebookInput.trim();
    const handle = raw.replace(/^@/, "");
    if (!handle) return;
    if (type === "twitter") {
      if (!localTwitter.includes(handle)) setLocalTwitter(prev => [...prev, handle]);
      setTwitterInput("");
      twitterRef.current?.focus();
    } else if (type === "instagram") {
      if (!localInstagram.includes(handle)) setLocalInstagram(prev => [...prev, handle]);
      setInstagramInput("");
      instagramRef.current?.focus();
    } else {
      if (!localFacebook.includes(handle)) setLocalFacebook(prev => [...prev, handle]);
      setFacebookInput("");
      facebookRef.current?.focus();
    }
  };

  const removeHandle = (type: "twitter" | "instagram" | "facebook", handle: string) => {
    if (type === "twitter") setLocalTwitter(prev => prev.filter(h => h !== handle));
    else if (type === "instagram") setLocalInstagram(prev => prev.filter(h => h !== handle));
    else setLocalFacebook(prev => prev.filter(h => h !== handle));
  };

  const saveKeyAccounts = async () => {
    if (!municipio.trim()) return;
    setKeyAccountsSaving(true);
    try {
      const saved = await thermometerService.saveKeyAccounts({
        municipio: municipio.trim(),
        twitter_handles: localTwitter,
        instagram_usernames: localInstagram,
        facebook_pages: localFacebook,
        descricao: "",
      });
      setKeyAccounts(saved);
      setKeyAccountsSaved(true);
      setTimeout(() => setKeyAccountsSaved(false), 3000);
    } catch {
      // silencioso
    } finally {
      setKeyAccountsSaving(false);
    }
  };

  const handleGenerate = useCallback(async (forceRefresh = false) => {
    const m = municipio.trim();
    if (!m) return;
    setLoading(true);
    setError(null);
    setElapsedSeconds(0);
    try {
      const result = await thermometerService.generateAndPoll(
        m,
        forceRefresh,
        (elapsedMs) => setElapsedSeconds(Math.floor(elapsedMs / 1000))
      );
      setData(result as ThermometerData);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error
        || (err as { message?: string })?.message
        || "Erro ao gerar análise";
      setError(msg);
    } finally {
      setLoading(false);
      setElapsedSeconds(0);
    }
  }, [municipio]);

  const tensao = data ? (TENSAO_CONFIG[data.termometro.nivel_tensao] ?? TENSAO_CONFIG.MÉDIO) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* ── Header ── */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <ThermometerIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Termômetro de Redes Sociais</h1>
              <p className="text-slate-400 text-xs mt-0.5">Análise de sentimento popular por município</p>
            </div>
          </div>

          {data && (
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              {/* Badge de fonte dos dados */}
              {data._data_source === "real" ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/15 border border-green-500/30 rounded-full text-green-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  Dados Reais
                  {data._posts_collected && (
                    <span className="text-green-500/70">({data._posts_collected} posts)</span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/15 border border-yellow-500/30 rounded-full text-yellow-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                  Análise por IA
                </span>
              )}
              {data._cached && <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-400" /> Cache 72h</span>}
              <span>Gerado em: {data.data_analise}</span>
            </div>
          )}

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ── Seletor de Município ── */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">Município</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Digite o município (ex: Búzios, Niterói...)"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <button
              onClick={() => handleGenerate(false)}
              disabled={loading || !municipio.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/20"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {loading
                ? `Analisando... ${elapsedSeconds > 0 ? `${elapsedSeconds}s` : ""}`
                : "Gerar Análise"}
            </button>
            {data && (
              <button
                onClick={() => handleGenerate(true)}
                disabled={loading}
                title="Regenerar (ignora cache)"
                className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-xl font-semibold text-sm transition-colors"
              >
                <RefreshCw size={15} />
              </button>
            )}
          </div>
          {loading && (
            <p className="text-xs text-slate-400 mt-2 animate-pulse">
              ⏳ Coletando dados de X (Twitter), Instagram e Facebook e analisando com IA — isso pode levar alguns minutos. Aguarde.
            </p>
          )}
          {error && (
            <div className="flex items-start gap-2 mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Contas Chave ── */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowKeyAccounts(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-700/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Settings size={16} className="text-slate-400 group-hover:text-slate-300" />
              <span className="text-sm font-semibold text-slate-300">Contas Chave Monitoradas</span>
              {(localTwitter.length > 0 || localInstagram.length > 0) && (
                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold">
                  {localTwitter.length + localInstagram.length} contas
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-xs">{showKeyAccounts ? "Fechar" : "Configurar"}</span>
              {showKeyAccounts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {showKeyAccounts && (
            <div className="border-t border-slate-700/40 px-6 py-5 space-y-5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Adicione perfis oficiais, jornalistas ou lideranças locais. Os posts dessas contas serão
                coletados <strong className="text-slate-400">além</strong> da busca pelo nome do município,
                enriquecendo a análise com fontes relevantes.
              </p>

              {keyAccountsLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Carregando contas salvas...
                </div>
              ) : (
                <>
                  {/* Twitter/X */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AtSign size={14} className="text-sky-400" />
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Twitter / X</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {localTwitter.map(h => (
                        <span key={h} className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 border border-sky-500/25 rounded-full text-sky-300 text-xs">
                          @{h}
                          <button onClick={() => removeHandle("twitter", h)} className="hover:text-red-400 transition-colors"><XIcon size={10} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={twitterRef}
                        type="text"
                        value={twitterInput}
                        onChange={e => setTwitterInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addHandle("twitter")}
                        placeholder="@handle (Enter para adicionar)"
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
                      />
                      <button
                        onClick={() => addHandle("twitter")}
                        className="flex items-center gap-1 px-3 py-2 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-600/40 rounded-lg text-sky-300 text-xs transition-colors"
                      >
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Camera size={14} className="text-pink-400" />
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Instagram</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {localInstagram.map(u => (
                        <span key={u} className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 border border-pink-500/25 rounded-full text-pink-300 text-xs">
                          @{u}
                          <button onClick={() => removeHandle("instagram", u)} className="hover:text-red-400 transition-colors"><XIcon size={10} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={instagramRef}
                        type="text"
                        value={instagramInput}
                        onChange={e => setInstagramInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addHandle("instagram")}
                        placeholder="@username (Enter para adicionar)"
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-xs transition-colors"
                      />
                      <button
                        onClick={() => addHandle("instagram")}
                        className="flex items-center gap-1 px-3 py-2 bg-pink-600/30 hover:bg-pink-600/50 border border-pink-600/40 rounded-lg text-pink-300 text-xs transition-colors"
                      >
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>
                  </div>


                  {/* Facebook */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Facebook</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {localFacebook.map(p => (
                        <span key={p} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/10 border border-blue-600/25 rounded-full text-blue-300 text-xs max-w-[200px] truncate">
                          {p.replace("https://www.facebook.com/", "fb/")}
                          <button onClick={() => removeHandle("facebook", p)} className="hover:text-red-400 transition-colors flex-shrink-0"><XIcon size={10} /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={facebookRef}
                        type="text"
                        value={facebookInput}
                        onChange={e => setFacebookInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addHandle("facebook")}
                        placeholder="URL ou nome da página (ex: prefeitura.buzios)"
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs transition-colors"
                      />
                      <button
                        onClick={() => addHandle("facebook")}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-600/40 rounded-lg text-blue-300 text-xs transition-colors"
                      >
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Salvar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
                    <p className="text-xs text-slate-500">
                      {keyAccounts?.updated_at
                        ? `Atualizado em ${new Date(keyAccounts.updated_at).toLocaleString("pt-BR")}`
                        : "Ainda não salvo para este município"}
                    </p>
                    <button
                      onClick={saveKeyAccounts}
                      disabled={keyAccountsSaving || !municipio.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-600/40 disabled:opacity-50 rounded-lg text-emerald-300 text-xs font-semibold transition-colors"
                    >
                      {keyAccountsSaving ? (
                        <><Loader2 size={12} className="animate-spin" /> Salvando...</>
                      ) : keyAccountsSaved ? (
                        <><CheckCircle2 size={12} /> Salvo!</>
                      ) : (
                        <><Save size={12} /> Salvar Contas Chave</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {!data && !loading && (
          <div className="text-center py-24 text-slate-600">
            <ThermometerIcon size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Digite um município e clique em "Gerar Análise"</p>
            <p className="text-sm mt-1">O resultado é cacheado por 72h para economizar recursos.</p>
          </div>
        )}

        {data && tensao && (
          <>
            {/* ── Termômetro + Métricas ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Termômetro visual */}
              <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/40 rounded-2xl p-7">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold">{data.municipio}</h2>
                    <p className="text-slate-400 text-sm">{data.periodo}</p>
                  </div>
                  <span className={`flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full border ${tensao.color} ${tensao.bg} ${tensao.border}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${tensao.dot}`} />
                    Tensão {tensao.label}
                  </span>
                </div>

                {/* Medidor */}
                <div className="flex items-end gap-8">
                  {/* Visual do termômetro */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="relative w-16 h-52 bg-slate-700 rounded-full border-2 border-slate-600 overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                        style={{
                          height: `${data.termometro.temperatura_geral}%`,
                          background: `linear-gradient(to top, ${tempColor(data.termometro.temperatura_geral)}, ${tempColor(data.termometro.temperatura_geral)}88)`,
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col justify-between py-3 items-end pr-1.5 text-[10px] font-bold text-slate-400">
                        <span>100°</span>
                        <span>50°</span>
                        <span>0°</span>
                      </div>
                    </div>
                    <p className="mt-2 text-2xl font-black" style={{ color: tempColor(data.termometro.temperatura_geral) }}>
                      {data.termometro.temperatura_geral}°
                    </p>
                  </div>

                  {/* Barras de sentimento */}
                  <div className="flex-1 space-y-5">
                    {[
                      { label: "Crítico", value: data.termometro.sentimento_critico, color: "from-red-600 to-red-400" },
                      { label: "Neutro", value: data.termometro.sentimento_neutro, color: "from-yellow-500 to-yellow-300" },
                      { label: "Positivo", value: data.termometro.sentimento_positivo, color: "from-green-600 to-green-400" },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-300 font-semibold">{s.label}</span>
                          <span className="font-black">{s.value}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${s.color} transition-all duration-700`}
                            style={{ width: `${s.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 content-start">
                <MetricCard
                  label="Menções Totais"
                  value={data.metricas.mencoes_totais.toLocaleString("pt-BR")}
                  sub={`${data.metricas.crescimento_mencoes} vs. mês anterior`}
                />
                <MetricCard
                  label="Engajamento"
                  value={data.metricas.engajamento_total >= 1000
                    ? `${(data.metricas.engajamento_total / 1000).toFixed(1)}K`
                    : String(data.metricas.engajamento_total)}
                  sub="Comentários e reações"
                />
                <MetricCard
                  label="Influenciadores"
                  value={String(data.metricas.influenciadores)}
                  sub="Perfis com alto alcance"
                />
              </div>
            </div>

            {/* ── TOP 3 Dores ── */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold mb-5">
                <AlertTriangle size={20} className="text-orange-400" />
                As "Dores" da Região — TOP {data.dores_principais.length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {data.dores_principais
                  .sort((a, b) => a.ranking - b.ranking)
                  .map((dor) => (
                    <div
                      key={dor.ranking}
                      onClick={() => setExpandedDor(expandedDor === dor.ranking ? null : dor.ranking)}
                      className="cursor-pointer group bg-gradient-to-br from-red-950/40 to-slate-800/60 border border-red-700/25 hover:border-red-500/50 rounded-xl p-5 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                          <AlertTriangle size={17} className="text-red-400" />
                        </div>
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-0.5">
                          #{dor.ranking}
                        </span>
                      </div>
                      <h3 className="font-bold text-white mb-1">{dor.titulo}</h3>
                      <p className="text-slate-300 text-sm mb-3">{dor.descricao}</p>
                      <div className="flex items-center gap-1.5 text-orange-400 text-sm font-semibold">
                        <TrendingUp size={14} />
                        <span>{dor.crescimento} em menções</span>
                      </div>
                      {expandedDor === dor.ranking && (
                        <div className="mt-4 pt-4 border-t border-red-700/20">
                          <p className="text-slate-300 text-xs leading-relaxed">{dor.contexto}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              <p className="text-slate-500 text-xs text-center mt-3">Clique em cada card para expandir o contexto</p>
            </section>

            {/* ── Nuvem de Palavras-Chave ── */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold mb-5">
                <MessageSquare size={20} className="text-blue-400" />
                Palavras-Chave em Destaque
              </h2>
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-7">
                <div className="flex flex-wrap gap-3 justify-center">
                  {data.palavras_chave.map((pk, i) => {
                    const maxMencoes = Math.max(...data.palavras_chave.map((k) => k.mencoes));
                    const ratio = pk.mencoes / maxMencoes;
                    const fontSize = 14 + Math.round(ratio * 20);
                    const sentColor =
                      pk.sentimento === "Crítico" ? "text-red-300 hover:text-red-100 border-red-700/30 hover:border-red-500/60" :
                      pk.sentimento === "Positivo" ? "text-green-300 hover:text-green-100 border-green-700/30 hover:border-green-500/60" :
                      "text-slate-300 hover:text-white border-slate-600/30 hover:border-slate-400/60";
                    return (
                      <button
                        key={i}
                        onClick={() =>
                          setSelectedKeyword({ keyword: pk.palavra, mentions: pk.exemplos_mencoes })
                        }
                        className={`px-3 py-1.5 bg-slate-700/50 border rounded-lg transition-all duration-200 group ${sentColor}`}
                      >
                        <span className="font-bold block" style={{ fontSize }}>{pk.palavra}</span>
                        <span className="text-xs text-slate-500 text-center block mt-0.5">{pk.mencoes} menções</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Recomendações ── */}
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold mb-5">
                <Users size={20} className="text-purple-400" />
                Recomendações para a Agenda
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-red-950/30 border border-red-700/25 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowDown size={18} className="text-red-400" />
                    <h3 className="font-bold text-red-300">Evitar</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {data.recomendacoes.evitar.map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-slate-300 text-sm">
                        <span className="text-red-400 font-black flex-shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-950/30 border border-green-700/25 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUp size={18} className="text-green-400" />
                    <h3 className="font-bold text-green-300">Priorizar</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {data.recomendacoes.priorizar.map((item, i) => (
                      <li key={i} className="flex gap-2.5 text-slate-300 text-sm">
                        <span className="text-green-400 font-black flex-shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Alerta de Crise */}
              {["ALTO", "CRÍTICO"].includes(data.alerta_crise.nivel) && (
                <div className="mt-5 bg-yellow-950/40 border border-yellow-600/30 rounded-xl p-5 flex gap-4">
                  <AlertTriangle size={22} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-yellow-300 mb-1">
                      Alerta de Crise — Nível {data.alerta_crise.nivel}
                    </h4>
                    <p className="text-slate-300 text-sm mb-2">{data.alerta_crise.descricao}</p>
                    <p className="text-slate-400 text-xs">{data.alerta_crise.recomendacoes}</p>
                  </div>
                </div>
              )}
            </section>

            {/* ── Rodapé ── */}
            <div className="border-t border-slate-800 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-400 mb-1">Metodologia</p>
                <p>Análise via Gemini AI — dados analíticos baseados em padrões de sentimento regional</p>
              </div>
              <div>
                <p className="font-semibold text-slate-400 mb-1">Plataformas</p>
                <p>Instagram, Facebook, X (Twitter) — dados contextualizados por IA</p>
              </div>
              <div>
                <p className="font-semibold text-slate-400 mb-1">Período</p>
                <p>{data.periodo} • Gerado em {data.data_analise}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modal de Menções ── */}
      {selectedKeyword && (
        <MentionsModal
          isOpen
          onClose={() => setSelectedKeyword(null)}
          keyword={selectedKeyword.keyword}
          count={selectedKeyword.mentions.length}
          mentions={selectedKeyword.mentions}
        />
      )}
    </div>
  );
}
