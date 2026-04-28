import { useState, useEffect, useRef } from 'react';

import { api } from '@/lib/api';
import { MessageSquare, Swords, Search, Loader2, Send, Link as LinkIcon, Crosshair, ArrowRight, ShieldAlert, Cpu, Trash2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function Guidelines() {
  const [activeTab, setActiveTab] = useState<'sabatina' | 'dossier' | 'debate'>('sabatina');

  return (
    <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 border-l-4 border-primary pl-4">War Room Adversarial</h1>
          <p className="text-gray-500 mt-2 ml-4">Módulo de OSINT e Motor de Confronto Multi-Agent</p>
        </div>
      </div>

      {/* TABS NATIVAS */}
      <div className="flex border-b border-gray-200 mb-6 font-serif">
        <button
          onClick={() => setActiveTab('sabatina')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'sabatina'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <MessageSquare className="w-4 h-4" /> Simulador de Sabatina
        </button>
        <button
          onClick={() => setActiveTab('dossier')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'dossier'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <Search className="w-4 h-4" /> Dossiês Adversariais
        </button>
        <button
          onClick={() => setActiveTab('debate')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'debate'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <Swords className="w-4 h-4" /> Simulador de Debates
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col flex-1 pb-12">
        {activeTab === 'sabatina' && <SabatinaTab />}
        {activeTab === 'dossier' && <DossierTab />}
        {activeTab === 'debate' && <DebateTab />}
      </div>
    </div>
  );
}

// ==========================================
// ABA 1: Sabatina (Defesa do Plano Estadual)
// ==========================================
function SabatinaTab() {
  const [sabatinas, setSabatinas] = useState<any[]>([]);
  const [selectedPersona, setSelectedPersona] = useState('');

  // Local/Session State para Chat de Sabatina
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ia', text: string }[]>(() => {
    const saved = localStorage.getItem('sabatina_chat_log');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/personas/sabatinas/').then(res => setSabatinas(res.data));
  }, []);

  useEffect(() => {
    localStorage.setItem('sabatina_chat_log', JSON.stringify(chatLog));
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleStartInitialSabatina = async () => {
    if (!selectedPersona) return;

    setLoading(true);
    try {
      const res = await api.post(`/personas/sabatinas/${selectedPersona}/simulate/`, {
        user_message: '',
        is_initial: true
      });
      setChatLog([{ role: 'ia', text: res.data.response }]);
    } catch (err: any) {
      setChatLog([{ role: 'ia', text: `Erro: Falha na conexão com o âncora. ${err?.response?.data?.error || ''}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !selectedPersona) return;
    const msg = inputText;
    setInputText('');
    setChatLog(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await api.post(`/personas/sabatinas/${selectedPersona}/simulate/`, { user_message: msg });
      setChatLog(prev => [...prev, { role: 'ia', text: res.data.response }]);
    } catch (err: any) {
      setChatLog(prev => [...prev, { role: 'ia', text: `Erro: Falha de transmissão. ${err?.response?.data?.error || ''}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setChatLog([]);
    localStorage.removeItem('sabatina_chat_log');
  }

  return (
    <div className="flex flex-col h-full flex-1">
      <div className="flex gap-4 items-start mb-6">
        <div className="flex flex-col gap-2">
          <select
            className="p-2 border rounded-md min-w-[300px] bg-gray-50 focus:ring-primary focus:border-primary"
            value={selectedPersona}
            onChange={e => {
              setSelectedPersona(e.target.value);
              setChatLog([]); // Limpa a tela se trocar
            }}
          >
            <option value="">Selecione o Jornalista Âncora...</option>
            {sabatinas.map(s => (
              <option key={s.id} value={s.id}>{s.nome} ({s.foco})</option>
            ))}
          </select>
          {selectedPersona && chatLog.length === 0 && (
            <button
              onClick={handleStartInitialSabatina}
              disabled={loading}
              className="bg-primary text-white py-2 px-4 rounded-md shadow hover:bg-primary/90 transition text-sm font-semibold flex items-center justify-center gap-2 mt-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "▶️"}
              {loading ? "Conectando com o estúdio..." : "Começar Sabatina"}
            </button>
          )}
        </div>
        <button onClick={handleClear} className="text-sm text-gray-400 hover:text-red-500 underline ml-auto mt-2">
          Limpar Histórico
        </button>
      </div>

      <div className="flex-1 bg-gray-50 rounded-lg p-4 custom-scrollbar overflow-y-auto mb-4 border border-gray-100 flex flex-col gap-4 min-h-[400px] max-h-[500px]">
        {chatLog.length === 0 && (
          <div className="m-auto text-center text-gray-400 max-w-sm">
            <Crosshair className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Selecione um jornalista e inicie a defesa do seu Plano de Estado. A IA testará a viabilidade operacional e financeira do projeto.</p>
          </div>
        )}
        {chatLog.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-3 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white border rounded-tl-none text-gray-800'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border p-3 rounded-lg rounded-tl-none text-gray-500 text-sm flex gap-2 items-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Processando contradição...
            </div>
          </div>
        )}
        <div ref={endOfChatRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border p-3 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-primary"
          placeholder={selectedPersona ? "Responda à pergunta do repórter..." : "Selecione o âncora acima primeiro."}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={!selectedPersona || chatLog.length === 0 || loading}
        />
        <button
          onClick={handleSend}
          disabled={!selectedPersona || chatLog.length === 0 || loading}
          className="bg-primary text-white p-3 rounded-md hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center w-14"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// ABA 2: Dossiês (OSINT e Vetores)
// ==========================================
function DossierTab() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [oppName, setOppName] = useState('');
  const [links, setLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  // OSINT Fallback State
  const [showOsintModal, setShowOsintModal] = useState(false);

  // Entity Resolution State
  const [entityResults, setEntityResults] = useState<any[]>([]);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  // Leitura Modal State
  const [viewDossier, setViewDossier] = useState<any>(null);
  const [activeModalTab, setActiveModalTab] = useState<'tatico' | 'persona'>('tatico');

  // OSINT Refresh Status
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [streamMessage, setStreamMessage] = useState<string>('');

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir este dossiê? Oponente não será mais encontrado nas tréplicas.')) return;
    try {
      await api.delete(`/personas/dossiers/${id}/`);
      fetchDossiers();
    } catch (err) { alert('Erro ao excluir dossiê'); }
  };

  const handleRefresh = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setRefreshingId(id);
    setStreamMessage('Conectando ao terminal O.S.I.N.T...');
    try {
      const response = await fetch(`http://localhost:8000/api/personas/dossiers/${id}/refresh/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.body) throw new Error("No body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr.startsWith('{') && dataStr.includes('"completed"')) {
              fetchDossiers();
            } else if (dataStr.length > 0) {
              setStreamMessage(dataStr);
            }
          }
        }
      }
    } catch (err) {
      alert('Erro ao rastrear dados ativos.');
    } finally {
      setRefreshingId(null);
      setStreamMessage('');
    }
  };

  const fetchDossiers = () => {
    api.get('/personas/dossiers/').then(res => {
      setDossiers(res.data);
      setLoadingList(false);
    });
  }

  useEffect(() => { fetchDossiers(); }, []);

  const handleSearchEntity = async () => {
    if (!oppName.trim()) return;
    setLoading(true);

    try {
      const res = await api.post('/personas/dossiers/search_entity/', { nome: oppName });
      if (res.data && res.data.length > 0) {
        setEntityResults(res.data);
        setSelectedEntityId(res.data[0].id_temporario);
      } else {
        setEntityResults([]);
      }
      setShowEntityModal(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar entidade na inteligência.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (forceOsint = false, bypassEntity = false) => {
    if (!oppName.trim()) return;

    let contextCargo = '';
    let finalName = oppName;

    if (!bypassEntity && entityResults.length > 0) {
      const entity = entityResults.find(e => e.id_temporario === selectedEntityId);
      if (entity) {
        contextCargo = entity.resumo;
        finalName = entity.nome;
      }
    }

    setLoading(true);
    setShowEntityModal(false);

    // Tratamento basico dos links que o usuario colou
    const linksArray = links.split(',').map(l => l.trim()).filter(l => l.length > 5);

    try {
      const res = await api.post('/personas/dossiers/generate/', {
        opponent_name: finalName,
        context_cargo: contextCargo,
        manual_links: linksArray,
        force_osint: forceOsint
      });

      if (res.status === 206 && res.data.status === 'insufficient_data') {
        setShowOsintModal(true);
      } else {
        setShowOsintModal(false);
        setOppName('');
        setLinks('');
        fetchDossiers();
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao acionar motor de inteligência.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full flex-1 relative">

      {/* Gerador Header */}
      <div className="bg-gray-50 border p-5 rounded-lg mb-6 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" /> Motor RAG Adversarial
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            className="flex-1 font-semibold text-lg p-3 border rounded shadow-sm focus:ring-primary outline-none"
            placeholder="Nome do Oponente..."
            value={oppName}
            onChange={e => setOppName(e.target.value)}
            disabled={loading}
          />
          <button
            className="bg-gray-800 text-white font-bold px-8 rounded hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            onClick={handleSearchEntity}
            disabled={loading || !oppName}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Buscar Oponente
          </button>
        </div>
      </div>

      {/* Lista de Dossies */}
      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Galeria de Oponentes Mapeados</h3>
      {loadingList ? (
        <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>
      ) : dossiers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">Nenhum dossiê gerado ainda.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start overflow-y-auto pr-2 pb-10">
          {dossiers.map(d => (
            <div key={d.id} className={`border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow relative grid grid-rows-[1fr_auto] ${refreshingId === d.id ? 'opacity-80 pointer-events-none' : 'cursor-pointer'}`} onClick={() => { if (refreshingId !== d.id) setViewDossier(d); }}>

              {refreshingId === d.id ? (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4 rounded-lg border-2 border-blue-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-xs font-bold text-gray-800 animate-pulse">{streamMessage}</p>
                </div>
              ) : (
                <div className="absolute top-4 right-4 bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded">OSINT VÁLIDO</div>
              )}

              <div>
                <h4 className="font-bold text-lg text-gray-900 mb-1 pr-24">{d.opponent_name}</h4>
                <p className="text-xs text-gray-400 mb-4">Clique para abrir o relatório analítico.</p>
              </div>

              <div className="flex gap-2 border-t pt-3 mt-auto justify-end">
                <button
                  onClick={(e) => handleRefresh(e, d.id)}
                  className="text-xs flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar Rastros
                </button>
                <button
                  onClick={(e) => handleDelete(e, d.id)}
                  className="text-xs flex items-center gap-1 px-3 py-1.5 border border-red-100 text-red-500 rounded bg-red-50 hover:bg-red-500 hover:text-white transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Lixeira
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DESAMBIGUAÇÃO DE ENTIDADE */}
      {showEntityModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white border-2 border-gray-200 shadow-2xl rounded-xl p-8 max-w-2xl w-full flex flex-col max-h-[90vh]">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 border-b-2 border-blue-500 pb-2 inline-block">
              Confirme o Alvo da Pesquisa
            </h2>

            {entityResults.length > 0 ? (
              <p className="text-gray-600 mb-4 text-sm mt-2">
                O buscador listou alguns candidatos com o nome <strong>"{oppName}"</strong>. Selecione o correto abaixo para dar contexto ao motor OSINT:
              </p>
            ) : (
              <p className="text-gray-600 mb-4 text-sm mt-2">
                Não conseguimos resolver o nome <strong>"{oppName}"</strong> automaticamente. Pode ser muito genérico ou o buscador não encontrou a Wikipedia. Deseja iniciar a geração com busca genérica (forçar OSINT)?
              </p>
            )}

            {/* List of candidates */}
            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[40vh] space-y-3 mb-6">
              {entityResults.map(entity => (
                <div
                  key={entity.id_temporario}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition flex items-start gap-4 ${selectedEntityId === entity.id_temporario ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  onClick={() => setSelectedEntityId(entity.id_temporario)}
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{entity.nome}</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{entity.resumo}</p>
                    {entity.fonte && (
                      <a href={entity.fonte} target="_blank" rel="noreferrer" className="text-xs text-blue-500 mt-2 inline-flex items-center gap-1 hover:underline" onClick={e => e.stopPropagation()}>
                        <LinkIcon className="w-3 h-3" /> Fonte Verificada
                      </a>
                    )}
                  </div>
                  <div className="pt-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedEntityId === entity.id_temporario ? 'border-blue-600' : 'border-gray-300'}`}>
                      {selectedEntityId === entity.id_temporario && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Constante de Links moved to Modal */}
            <div className="border-t pt-4 mt-auto border-gray-200 bg-gray-50 -mx-8 px-8 pb-4">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                Tem fontes específicas para este candidato? (Opcional)
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded shadow-inner text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Ex: https://g1.globo... (separe por vírgula)"
                value={links}
                onChange={e => setLinks(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowEntityModal(false)}
                className="px-6 py-3 border border-gray-300 rounded font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>

              {entityResults.length > 0 ? (
                <button
                  onClick={() => handleGenerate(false, false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2"
                >
                  ⚡ Confirmar e Iniciar OSINT
                </button>
              ) : (
                <button
                  onClick={() => handleGenerate(false, true)}
                  className="px-6 py-3 bg-orange-600 text-white rounded font-bold hover:bg-orange-700 transition shadow-md flex items-center gap-2"
                >
                  Ignorar Desambiguação / Forçar Busca Genérica
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE OSINT FALLBACK */}
      {showOsintModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white border-2 border-red-100 shadow-2xl rounded-xl p-8 max-w-xl w-full text-center">
            <ShieldAlert className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Dados Insuficientes no Data Lake RAG</h2>
            <p className="text-gray-600 mb-6 text-sm">
              O motor vetorial local <strong>não encontrou</strong> documentos atrelados a <em>"{oppName}"</em>. Para prevenir que a IA <strong>alucine fatos</strong> baseando-se em eventos antigos, você tem duas opções de OSINT ativo:
            </p>

            <div className="space-y-4">
              <button
                onClick={() => { setShowOsintModal(false); handleGenerate(true); }}
                className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 transition flex justify-between items-center group"
              >
                <span>Opção A: Busca Automática (Web Scrape LLM)</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-xs text-gray-400">--- OU ---</div>

              <button
                onClick={() => setShowOsintModal(false)}
                className="w-full border-2 border-gray-200 text-gray-600 p-4 rounded-lg font-bold hover:bg-gray-50 transition"
              >
                Opção B: Fornecer referências no Input Manual e tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE DOSSIE */}
      {viewDossier && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8" onClick={() => setViewDossier(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b bg-gray-50 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Dossiê: {viewDossier.opponent_name}</h2>
                  <p className="text-sm text-gray-500 font-mono mt-1">Gerado pelo Motor Gemini 3.1 Pro (via RAG)</p>
                </div>
                <button onClick={() => setViewDossier(null)} className="text-gray-400 hover:text-black font-bold text-2xl px-2">×</button>
              </div>

              {/* ABAS DO MODAL */}
              <div className="flex gap-4 border-b font-semibold text-sm">
                <button
                  className={`pb-2 border-b-2 transition-colors ${activeModalTab === 'tatico' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setActiveModalTab('tatico')}
                >
                  Relatório Tático
                </button>
                <button
                  className={`pb-2 border-b-2 transition-colors ${activeModalTab === 'persona' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setActiveModalTab('persona')}
                >
                  Código da Persona (IA)
                </button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto w-full custom-scrollbar">
              {activeModalTab === 'tatico' ? (
                <div className="prose prose-blue max-w-none text-gray-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {viewDossier.content_markdown || "Relatório Tático em Geração ou Indisponível."}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* JSON Render Blocks */}
                  {viewDossier.persona_matrix && Object.keys(viewDossier.persona_matrix).length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-lg">
                          <h4 className="font-bold text-blue-900 mb-2 uppercase text-xs tracking-wider">🎭 Tom de Voz Base</h4>
                          <p className="text-gray-700 font-semibold">{viewDossier.persona_matrix.tom_de_voz}</p>
                        </div>
                        <div className="border border-red-100 bg-red-50/50 p-4 rounded-lg">
                          <h4 className="font-bold text-red-900 mb-2 uppercase text-xs tracking-wider">🛡️ Tese de Defesa ("Escudo")</h4>
                          <p className="text-gray-700 font-semibold">{viewDossier.persona_matrix.tese_principal_defesa}</p>
                        </div>
                      </div>

                      <div className="border border-gray-200 p-5 rounded-lg shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">💥 Comportamento Sob Ataque</h4>
                        <p className="text-gray-800 leading-relaxed">{viewDossier.persona_matrix.postura_sob_ataque}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 p-4 rounded-lg">
                          <h4 className="font-bold text-gray-900 mb-3">🗣️ Cacoetes Verbais</h4>
                          <div className="flex flex-wrap gap-2">
                            {viewDossier.persona_matrix.cacoetes_verbais?.map((c: string, i: number) => (
                              <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono border">{c}</span>
                            ))}
                          </div>
                        </div>
                        <div className="border border-gray-200 p-4 rounded-lg">
                          <h4 className="font-bold text-gray-900 mb-3">🙈 Pontos Cegos</h4>
                          <div className="flex flex-wrap gap-2">
                            {viewDossier.persona_matrix.pontos_cegos_inseguranca?.map((c: string, i: number) => (
                              <span key={i} className="bg-gray-100 text-red-600 border border-red-200 px-2 py-1 rounded text-xs font-mono">{c}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-black text-green-400 font-mono p-5 rounded-lg shadow-inner mt-2">
                        <h4 className="text-white mb-2 uppercase text-xs font-sans tracking-widest opacity-80">// DIRETRIZ DE INCORPORAÇÃO (SYSTEM PROMPT)</h4>
                        <p className="leading-relaxed">"{viewDossier.persona_matrix.instrucao_atuacao_ia}"</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-gray-400">Matriz de Persona não disponível para este dossiê antigo. Atualize os rastros para regerar.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ABA 3: Simulação de Debates
// ==========================================
function DebateTab() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [selectedDossier, setSelectedDossier] = useState('');
  const [formato, setFormato] = useState('Confronto Direto Convencional');

  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ia', text: string }[]>(() => {
    const saved = localStorage.getItem('debate_chat_log');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const endOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/personas/dossiers/').then(res => setDossiers(res.data));
  }, []);

  useEffect(() => {
    localStorage.setItem('debate_chat_log', JSON.stringify(chatLog));
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  const handleSend = async () => {
    if (!inputText.trim() || !selectedDossier) return;
    const msg = inputText;
    setInputText('');
    setChatLog(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const res = await api.post(`/personas/dossiers/${selectedDossier}/simulate_debate/`, {
        user_message: msg,
        formato: formato
      });
      setChatLog(prev => [...prev, { role: 'ia', text: res.data.response }]);
    } catch (err: any) {
      setChatLog(prev => [...prev, { role: 'ia', text: `Erro no debatedor: ${err?.response?.data?.error || ''}` }]);
    } finally {
      setLoading(false);
    }
  };

  const selectedOppName = dossiers.find(d => String(d.id) === selectedDossier)?.opponent_name || "Oponente IA";

  return (
    <div className="flex flex-col h-full flex-1">
      <div className="flex flex-wrap gap-4 items-center mb-6 border-b pb-4 border-gray-100">
        <select
          className="p-2 border rounded-md min-w-[200px] bg-white text-sm font-medium shadow-sm outline-none focus:ring-1 focus:ring-red-500"
          value={formato}
          onChange={e => setFormato(e.target.value)}
        >
          <option value="Confronto Direto Convencional">Debate Tradicional (Tema Livre)</option>
          <option value="Arena Aberta / Tréplica Constante">Arena Aberta (Cortes Rápidos)</option>
          <option value="Sabatina Cruzada">Pinga-Fogo (Acusatório)</option>
        </select>

        <select
          className="p-2 border rounded-md min-w-[250px] bg-red-50 border-red-100 text-red-900 font-bold focus:ring-1 focus:ring-red-500 outline-none ml-auto"
          value={selectedDossier}
          onChange={e => setSelectedDossier(e.target.value)}
        >
          <option value="">Selecione quem será seu adversário IA...</option>
          {dossiers.map(d => (
            <option key={d.id} value={d.id}>{d.opponent_name} (Via Dossiê)</option>
          ))}
        </select>

        <button onClick={() => setChatLog([])} className="text-xs text-gray-400 hover:text-red-500 underline">Limpar Palco</button>
      </div>

      <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50 rounded-lg p-6 custom-scrollbar overflow-y-auto mb-4 border border-gray-200 flex flex-col gap-6 min-h-[400px] max-h-[500px] shadow-inner">
        {chatLog.length === 0 && (
          <div className="m-auto text-center text-gray-500 max-w-sm bg-white/80 backdrop-blur pb-6 pt-4 px-6 rounded-2xl shadow-sm border border-gray-100">
            <Swords className="w-12 h-12 mx-auto mb-3 text-red-400/50" />
            <h3 className="font-bold text-gray-800 mb-2">Simulador de Ringue</h3>
            <p className="text-sm leading-relaxed">
              Dispare seu discurso ou ataque contra o oponente selecionado. A IA invocará os dados de Inteligência (Dossiê) dele para tentar destruí-lo com agressividade cirúrgica em até 3 parágrafos.
            </p>
          </div>
        )}
        {chatLog.map((msg, i) => (
          <div key={i} className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
            <span className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400 px-1">
              {msg.role === 'user' ? 'Você (Candidato)' : selectedOppName}
            </span>
            <div className={`p-4 rounded-xl shadow-md ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-white border-2 border-red-100 border-l-4 border-l-red-500 text-gray-800 rounded-bl-sm'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed font-serif">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="self-start items-start">
            <div className="bg-white border-2 border-red-100 p-4 rounded-xl rounded-bl-sm shadow-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-red-500" /> <span className="text-sm font-semibold text-gray-600">Adversário formulando resposta...</span>
            </div>
          </div>
        )}
        <div ref={endOfChatRef} />
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-2 flex gap-2">
        <textarea
          className="flex-1 p-3 rounded-lg outline-none custom-scrollbar resize-none font-serif"
          placeholder={selectedDossier ? "Lance seu argumento ou ataque (máximo sugerido: 3 min)..." : "Escolha um oponente na barra superior."}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.shiftKey === false && (e.preventDefault(), handleSend())}
          rows={3}
          disabled={!selectedDossier || loading}
        />
        <button
          onClick={handleSend}
          disabled={!selectedDossier || loading}
          className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-bold uppercase text-sm tracking-wider w-32 flex flex-col items-center justify-center gap-1"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Swords className="w-5 h-5" /> Atacar</>}
        </button>
      </div>
    </div>
  );
}
