import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { FileText, Loader2, PlayCircle, MapPin } from "lucide-react"
import { api } from "@/lib/api"
import { useReactToPrint } from "react-to-print"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { PrintableBriefing } from "@/components/PrintableBriefing"
import { BriefingPreview } from "@/components/BriefingPreview"
import type { BriefingStructured } from "@/components/BriefingPreview"

type TaskStatus = 'pending' | 'processing' | 'completed' | 'error' | null

const regioesRJ = [
  { nome: "Metropolitana", municipios: ["Rio de Janeiro", "Niterói", "São Gonçalo"] },
  { nome: "Baixada Fluminense", municipios: ["Duque de Caxias", "Nova Iguaçu", "Belford Roxo", "São João de Meriti"] },
  { nome: "Costa Verde", municipios: ["Angra dos Reis", "Mangaratiba", "Paraty"] },
  { nome: "Serrana", municipios: ["Petrópolis", "Teresópolis", "Nova Friburgo"] },
  { nome: "Região dos Lagos", municipios: ["Cabo Frio", "Búzios", "Arraial do Cabo"] },
  { nome: "Norte Fluminense", municipios: ["Campos dos Goytacazes", "Macaé", "São João da Barra"] },
];

const eixosAtuacao = [
  'Segurança Pública',
  'Infraestrutura e Mobilidade',
  'Saúde e Bem-estar',
  'Educação',
  'Emprego e Economia'
];



export function Planning() {
  const [activeTab, setActiveTab] = useState<'municipal' | 'comunicacao'>('municipal')

  // State Local
  const [regionName, setRegionName] = useState("")
  const [cityName, setCityName] = useState("")
  const [eixoAtuacao, setEixoAtuacao] = useState("")
  const [localId, setLocalId] = useState<number | null>(null)
  const [localStatus, setLocalStatus] = useState<TaskStatus>(null)
  const [localResult, setLocalResult] = useState<string>("")
  const [localError, setLocalError] = useState<string>("")
  const [localCustomRequest, setLocalCustomRequest] = useState<string>("")

  // State Modals & Exports
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false)
  const [isRegenAlertOpen, setIsRegenAlertOpen] = useState(false)
  const [isCommModalOpen, setIsCommModalOpen] = useState(false)

  // State Communication (Briefing de Rua)
  const [commMunicipio, setCommMunicipio] = useState("")
  const [commCities, setCommCities] = useState<string[]>([])
  const [commLoading, setCommLoading] = useState(false)
  const [commResult, setCommResult] = useState("")
  const [pastPlaybooks, setPastPlaybooks] = useState<any[]>([])
  const [openPlaybookId, setOpenPlaybookId] = useState<number | null>(null)
  const [commStructured, setCommStructured] = useState<BriefingStructured | null>(null)

  // Refs para impressão (react-to-print)
  const localPrintRef = useRef<HTMLDivElement>(null)
  const commPrintRef = useRef<HTMLDivElement>(null)

  // State: Documentos da Biblioteca (Single Source of Truth)
  const [availableDocs, setAvailableDocs] = useState<{id: number, filename: string}[]>([])
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([])

  // Fetch Playbooks History
  const fetchPlaybooks = async () => {
    try {
      const res = await api.get('/ai/planos/communication/');
      setPastPlaybooks(res.data);
    } catch(e) {
      console.error("Erro ao carregar playbooks", e);
    }
  }

  // Fetch available documents from Biblioteca (Inbound) for both Municipal and Comunicação tabs
  useEffect(() => {
    if (activeTab === 'municipal' || activeTab === 'comunicacao') {
      // Fetch available documents from Biblioteca (Inbound)
      api.get('/inbound/documents/').then(res => {
        const docs = (res.data || []).filter((d: any) => d.status === 'ready');
        setAvailableDocs(docs.map((d: any) => ({ id: d.id, filename: d.filename })));
      }).catch(() => {});
    }
    if (activeTab === 'comunicacao') {
      fetchPlaybooks();
      // Fetch cities list for the briefing selector
      api.get('/analytics/cities/').then(res => {
        setCommCities(res.data.cities || []);
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleDeletePlaybook = async (id: number) => {
    if(!window.confirm("Deseja realmente apagar este playbook permanentemente?")) return;
    try {
      await api.delete(`/ai/planos/communication/${id}/`);
      setPastPlaybooks(prev => prev.filter(p => p.id !== id));
      if (openPlaybookId === id) setIsCommModalOpen(false);
    } catch(e) {
      alert("Falha ao apagar playbook");
    }
  }



  // PDF via react-to-print (janela nativa do navegador → Salvar como PDF)
  const handlePrintLocal = useReactToPrint({ contentRef: localPrintRef });
  const handlePrintComm = useReactToPrint({ contentRef: commPrintRef });

  const handleDownloadDOCX = async (content: string, title: string) => {
    try {
      const response = await api.post('/ai/planos/export/docx/', {
        content: content,
        title: title
      }, {
        responseType: 'blob', // Important for grabbing raw binary data in Axios
      });

      // Browser object manipulation
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = url;
      tempLink.setAttribute('download', `${title.replace(' ', '_').toLowerCase()}.docx`);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate DOCX", e);
      alert("Houve um problema de comunicação com o backend convertendo DOCX.");
    }
  }

  const handleDeleteLocal = async () => {
    if (!localId) return;
    if (!window.confirm("Deseja apagar o desdobramento de " + cityName + "?")) return;

    try {
      await api.delete(`/ai/planos/local/${localId}/`);
      setLocalId(null);
      setLocalStatus(null);
      setLocalResult("");
      setIsLocalModalOpen(false);
    } catch (e) {
      console.error("Erro ao apagar Local", e);
      alert("Falha ao excluir o desdobramento municipal.");
    }
  }

  const startLocalGeneration = async () => {
    if (selectedDocIds.length === 0) return alert("Selecione pelo menos 1 documento da Biblioteca como base.");
    try {
      setLocalId(null)
      setLocalStatus('processing')
      setLocalResult("")
      setLocalError("")

      const payloadTipo = cityName === "todos" ? "regional" : "municipal";
      const res = await api.post('/ai/planos/local/', {
        tipo_desdobramento: payloadTipo,
        municipio: cityName,
        regiao: regionName,
        eixo_atuacao: eixoAtuacao,
        document_ids: selectedDocIds,
        custom_request: localCustomRequest
      })
      setLocalId(res.data.id)
    } catch (e) {
      console.error(e)
      setLocalStatus('error')
      setLocalError("Falha ao criar Plano Local")
    }
  }


  // Polling Local
  useEffect(() => {
    let interval: any
    if (localId && (localStatus === 'pending' || localStatus === 'processing')) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/ai/planos/local/${localId}/`)
          const tStatus = res.data.status
          setLocalStatus(tStatus)
          if (tStatus === 'completed') {
            setLocalResult(res.data.content_markdown)
            clearInterval(interval)
          } else if (tStatus === 'error') {
            setLocalError(res.data.content_markdown || "Erro Interno do Engine")
            clearInterval(interval)
          }
        } catch (e) {
          console.error("Erro no polling local", e)
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [localId, localStatus])

  // Context-Aware Hook: Zera o palco e revalida se o plano já existe no Datalake
  useEffect(() => {
    const checkExistingCombos = async () => {
      // Segurança: Limpar sempre que o dropdown mudar para evitar vazamento
      setLocalStatus(null)
      setLocalResult("")
      setLocalId(null)

      if (regionName && cityName && eixoAtuacao) {
        try {
          const res = await api.get(`/ai/planos/local/?regiao=${encodeURIComponent(regionName)}&municipio=${encodeURIComponent(cityName)}&eixo_atuacao=${encodeURIComponent(eixoAtuacao)}`)
          if (res.data && res.data.length > 0) {
            const plan = res.data[0];
            setLocalId(plan.id);
            setLocalStatus(plan.status);
            setLocalResult(plan.content_markdown || "");
          }
        } catch (e) {
          console.error("Combinação não localizada, pronto para nova geração.", e)
        }
      }
    };

    checkExistingCombos();
  }, [regionName, cityName, eixoAtuacao]);

  // Helper para gerar o título inteligente do modal
  const generateModalTitle = () => {
    if (cityName === 'todos' && eixoAtuacao === 'todos') {
      return `Plano Tático Regional - Região ${regionName}`;
    }
    if (cityName === 'todos' && eixoAtuacao !== 'todos') {
      return `Plano Tático Regional: ${eixoAtuacao} - Região ${regionName}`;
    }
    if (cityName !== 'todos' && eixoAtuacao === 'todos') {
      return `Desdobramento Estratégico Municipal - ${cityName}`;
    }
    return `Plano de Ação: ${eixoAtuacao} - ${cityName}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estratégia Governativa (Motor de Inteligência)</h1>
        <p className="text-muted-foreground">Sintetizador e Desdobrador de Planos de Governo movido a IA</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('municipal')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'municipal' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <MapPin className="w-4 h-4" /> Desdobramento Municipal
        </button>
        <button
          onClick={() => setActiveTab('comunicacao')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'comunicacao' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          📢 Comunicação e Narrativa
        </button>
      </div>

      <div className={`grid gap-6 ${activeTab === 'comunicacao' ? 'lg:grid-cols-12' : 'md:grid-cols-2'}`}>

        {/* COLUNA DIREITA: PLANO LOCAL */}
        {activeTab === 'municipal' && (
        <div className="space-y-4">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Desdobramento Municipal (Ação Local)</CardTitle>
              <CardDescription>Selecione documentos da Biblioteca, região, município e eixo para gerar o plano tático.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">📚 Documentos Base (Biblioteca)</label>
                <div className="max-h-[180px] overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-2">
                  {availableDocs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhum documento processado na Biblioteca.</p>
                  ) : (
                    availableDocs.map(doc => (
                      <label key={doc.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedDocIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocIds(prev => [...prev, doc.id]);
                            } else {
                              setSelectedDocIds(prev => prev.filter(id => id !== doc.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 truncate">{doc.filename}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedDocIds.length > 0 && (
                  <span className="text-xs text-blue-600 font-medium mt-1 block">{selectedDocIds.length} documento(s) selecionado(s)</span>
                )}
                {selectedDocIds.length === 0 && availableDocs.length > 0 && (
                  <span className="text-xs text-red-500 font-medium mt-1 block">Selecione pelo menos 1 documento como base.</span>
                )}
              </div>
              <select
                className="w-full p-2 text-sm bg-muted rounded-md border focus:outline-none focus:ring-1"
                value={regionName}
                onChange={e => {
                  setRegionName(e.target.value);
                  setCityName(""); // Reset city when region changes
                }}
              >
                <option value="" disabled>Selecione a Região</option>
                {regioesRJ.map(r => (
                  <option key={r.nome} value={r.nome}>{r.nome}</option>
                ))}
              </select>

              <select
                className="w-full p-2 text-sm bg-muted rounded-md border focus:outline-none focus:ring-1"
                value={cityName}
                onChange={e => setCityName(e.target.value)}
                disabled={!regionName}
              >
                <option value="" disabled>Selecione o Município</option>
                <option value="todos" className="font-semibold text-primary">Todos os Municípios (Visão Regional)</option>
                {regioesRJ.find(r => r.nome === regionName)?.municipios.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                className="w-full p-2 text-sm bg-muted rounded-md border focus:outline-none focus:ring-1"
                value={eixoAtuacao}
                onChange={e => setEixoAtuacao(e.target.value)}
              >
                <option value="" disabled>Selecione o Eixo de Atuação</option>
                <option value="todos" className="font-semibold text-primary">Todos os Eixos Estratégicos</option>
                {eixosAtuacao.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">🎯 Diretrizes Específicas / Foco Pontual (Opcional)</label>
                <textarea
                  className="w-full h-20 p-3 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400 resize-none"
                  placeholder="Ex: Priorizar proposta de reurbanização da orla, focar em geração de emprego via turismo..."
                  value={localCustomRequest}
                  onChange={e => setLocalCustomRequest(e.target.value)}
                  disabled={localStatus === 'processing'}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              {localStatus !== 'completed' && (
                <button
                  onClick={startLocalGeneration}
                  disabled={localStatus === 'processing' || !regionName || !cityName || !eixoAtuacao || selectedDocIds.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 text-sm font-medium shadow disabled:opacity-50 transition-all active:scale-95"
                >
                  {localStatus === 'processing' ? <><Loader2 className="w-4 h-4 animate-spin" /> Extrapolando Meta Local...</> : <><PlayCircle className="w-4 h-4" /> ✨ Gerar Novo Plano Tático</>}
                </button>
              )}
            </CardFooter>
          </Card>

          <Card className="overflow-hidden flex flex-col min-h-[160px] border-dashed border-2">
            <CardHeader className="bg-muted/10 border-b py-3">
              <CardTitle className="text-md flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" /> Status do Desdobramento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col items-center justify-center relative">
              {localStatus === null && (
                <div className="flex flex-col items-center text-muted-foreground">
                  <p className="text-sm">Selecione uma combinação inédita para gerar o plano.</p>
                </div>
              )}
              {localStatus === 'processing' && (
                <div className="flex flex-col items-center text-foreground z-10">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="font-medium animate-pulse text-sm">Calculando Aderência a {cityName === 'todos' ? 'Região' : cityName}...</p>
                </div>
              )}
              {localStatus === 'error' && (
                <div className="text-destructive text-sm font-mono text-center">[{localError}] - Restrição de Carga.</div>
              )}
              {localStatus === 'completed' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200 font-medium">✓ Documento localizado na base</span>
                  <div className="flex flex-col xl:flex-row gap-3 w-full">
                    <button
                      onClick={() => setIsLocalModalOpen(true)}
                      className="flex-1 flex justify-center items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold px-4 py-2 rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 border border-secondary"
                    >
                      <FileText className="w-4 h-4" /> 📖 Abrir Plano Atual
                    </button>
                    <button
                      onClick={() => setIsRegenAlertOpen(true)}
                      className="flex-1 flex justify-center items-center gap-2 bg-transparent hover:bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95 border border-gray-300"
                    >
                      🔄 Gerar Novamente
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        {/* ABA: BRIEFING DE RUA (HYPER-LOCAL) */}
        {activeTab === 'comunicacao' && (
        <>
        <div className="lg:col-span-4 space-y-4">
          <Card className="h-fit shadow-md">
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="text-xl flex items-center gap-2 text-gray-800"><MapPin className="h-5 w-5 text-blue-500" /> Briefing de Rua (Hyper-Local)</CardTitle>
              <CardDescription>Dossiê tático com dados reais, obras e OSINT para agendas de rua.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">📚 Documentos Base (Biblioteca)</label>
                <div className="max-h-[180px] overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-2">
                  {availableDocs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhum documento processado na Biblioteca.</p>
                  ) : (
                    availableDocs.map(doc => (
                      <label key={doc.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedDocIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocIds(prev => [...prev, doc.id]);
                            } else {
                              setSelectedDocIds(prev => prev.filter(id => id !== doc.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 truncate">{doc.filename}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedDocIds.length > 0 && (
                  <span className="text-xs text-blue-600 font-medium mt-1 block">{selectedDocIds.length} documento(s) selecionado(s)</span>
                )}
                {selectedDocIds.length === 0 && availableDocs.length > 0 && (
                  <span className="text-xs text-red-500 font-medium mt-1 block">Selecione pelo menos 1 documento como base.</span>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">🏙️ Município Alvo da Agenda</label>
                <select 
                  className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  value={commMunicipio} onChange={e => setCommMunicipio(e.target.value)}
                >
                  <option value="" disabled>Selecione o município</option>
                  {commCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t p-6">
              <button
                onClick={async () => {
                  if(!commMunicipio.trim() || selectedDocIds.length === 0) return alert("Selecione documentos e um município alvo.");
                  setCommLoading(true);
                  try {
                    const res = await api.post('/ai/planos/communication/generate/', {
                      municipio_alvo: commMunicipio,
                      document_ids: selectedDocIds
                    });
                    setCommResult(res.data.content_markdown);
                    setCommStructured(res.data.structured_data || null);
                    setOpenPlaybookId(res.data.id);
                    setIsCommModalOpen(true);
                    fetchPlaybooks();
                  } catch(e: any) {
                    alert(e.response?.data?.error || "Erro ao gerar Briefing");
                  } finally {
                    setCommLoading(false);
                  }
                }}
                disabled={commLoading || !commMunicipio || selectedDocIds.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg uppercase tracking-wide"
              >
                {commLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando Briefing...</> : <>📋 Gerar Briefing de Rua</>}
              </button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <Card className="h-full shadow-sm bg-gray-50/30">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                <FileText className="h-5 w-5" /> Repositório de Narrativas e Playbooks
              </CardTitle>
              <CardDescription>Consulte, baixe ou exclua playbooks gerados anteriormente.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {pastPlaybooks.length === 0 ? (
                 <div className="text-center text-gray-400 py-10 text-sm">Nenhum playbook gerado ainda.</div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
                   {pastPlaybooks.map(pb => (
                      <div key={pb.id} className="border border-gray-200 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between h-full min-h-[140px]">
                        <div>
                          <div className="text-xs font-black uppercase tracking-wider text-blue-600 mb-1">{pb.objetivo_fase}</div>
                          <div className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">📍 {pb.publico_alvo}</div>
                          <div className="text-xs text-gray-500 mb-4 bg-gray-100 rounded-md px-2 py-1 inline-block">{pb.tom_de_voz}</div>
                        </div>
                        <div className="flex gap-2 mt-auto">
                           <button onClick={() => {
                              setCommResult(pb.content_markdown);
                              setCommStructured(pb.structured_data || null);
                              setOpenPlaybookId(pb.id);
                              setIsCommModalOpen(true);
                           }} className="text-sm px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex-1 font-bold flex items-center justify-center gap-1 transition-colors">
                             <FileText className="w-4 h-4"/> Abrir Briefing
                           </button>
                           <button onClick={() => handleDeletePlaybook(pb.id)} className="text-sm px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Deletar Briefing">
                             🗑️
                           </button>
                        </div>
                      </div>
                   ))}
                 </div>
              )}
            </CardContent>
          </Card>
        </div>
        </>
        )}

      </div>

      {/* OVERLAY MODALS */}




      {/* Modal 2: Leitura do Desdobramento Local */}
      {isLocalModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
          <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header / Action Bar */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 tracking-tight">
                <MapPin className="w-6 h-6 text-primary" /> {generateModalTitle()}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePrintLocal()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
                >
                  📄 Baixar em PDF
                </button>
                <button
                  onClick={() => handleDownloadDOCX(localResult, generateModalTitle())}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  📝 Baixar em DOCX
                </button>
                <button
                  onClick={handleDeleteLocal}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
                  title="Apagar desdobramento"
                >
                  🗑️ Excluir
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button
                  onClick={() => setIsLocalModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border max-h-[60vh] overflow-y-auto">
              <MarkdownRenderer content={localResult} />
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Alerta de Sobrescrita / Regeração */}
      {isRegenAlertOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border-t-4 border-yellow-500">
            <div className="p-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 mb-4">
                ⚠️ Atenção: Sobrescrita de Plano
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Você está prestes a gerar novamente este plano. Foram disponibilizados novos dados atualizados no módulo Inbound? Caso contrário, a Inteligência Artificial gerará um resultado muito semelhante ao que já está salvo.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsRegenAlertOpen(false)}
                  className="px-4 py-2 font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setIsRegenAlertOpen(false);
                    startLocalGeneration();
                  }}
                  className="px-4 py-2 font-medium bg-yellow-500 hover:bg-yellow-600 text-white shadow rounded-lg transition-colors"
                >
                  Confirmar Regeração
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Leitura do Playbook de Comunicação */}
      {isCommModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm shadow-xl animate-in fade-in duration-200">
          <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header / Action Bar */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black flex items-center gap-2 text-gray-900 tracking-tight">
                <MapPin className="w-6 h-6 text-blue-500" /> Briefing de Rua: {commMunicipio || 'Município'}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePrintComm()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors bg-white shadow-sm"
                >
                  📄 Baixar em PDF
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button
                  onClick={() => setIsCommModalOpen(false)}
                  className="px-5 py-2 text-sm font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border shadow-sm"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="bg-gray-100 overflow-y-auto custom-scrollbar max-h-[75vh]">
              {commStructured ? (
                <BriefingPreview ref={commPrintRef} data={commStructured} editable={true} onDataChange={(d) => setCommStructured(d)} />
              ) : (
                <div className="p-8">
                  <MarkdownRenderer content={commResult} className="prose prose-lg prose-blue max-w-none text-gray-800" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Componente invisível de impressão — Plano Local (react-to-print) */}
      <PrintableBriefing
        ref={localPrintRef}
        content={localResult}
        title={`Plano de Ação — ${cityName || 'Municipal'}`}
      />
      {/* Briefing de Rua: imprime direto do BriefingPreview editável (ref={commPrintRef}) */}

    </div>
  )
}

