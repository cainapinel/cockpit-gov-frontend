import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, AlertTriangle, Activity, ShieldAlert, BadgeDollarSign, FileLock2, Briefcase } from "lucide-react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { api } from "@/lib/api"
import { InteractiveMap } from "@/components/InteractiveMap"
export function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [radarData, setRadarData] = useState<any[]>([])
  const [geoData, setGeoData] = useState<any>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedCityData, setSelectedCityData] = useState<any>(null)
  const [loadingCity, setLoadingCity] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/analytics/dashboard/')
        setData(res.data)
        
        try {
           const radarRes = await api.get('/analytics/positioning-radar/')
           setRadarData(radarRes.data)
        } catch(err) { console.error("Falha ao puxar Radar", err) }
        
        // Fetch public assets
        const geoRes = await fetch('/malha_rj.json')
        const geoJson = await geoRes.json()
        setGeoData(geoJson)



      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    async function loadCityData() {
      if (!selectedCity) {
        setSelectedCityData(null)
        try {
           const radarRes = await api.get('/analytics/positioning-radar/')
           setRadarData(radarRes.data)
        } catch(err) { console.error("Falha ao puxar Radar", err) }
        return
      }
      try {
        setLoadingCity(true)
        const nameClean = selectedCity.split(" -")[0]
        const res = await api.get(`/analytics/city/${encodeURIComponent(nameClean)}/`)
        setSelectedCityData(res.data)
      } catch (e) {
        console.error("Falha ao puxar detalhe da cidade", e)
        setSelectedCityData({ error: true })
      } finally {
        setLoadingCity(false)
      }
      
      try {
        const nameClean = selectedCity.split(" -")[0]
        const radarRes = await api.get(`/analytics/positioning-radar/?city=${encodeURIComponent(nameClean)}`)
        setRadarData(radarRes.data)
      } catch (e) {
        console.error("Falha ao puxar Radar da cidade", e)
      }
    }
    loadCityData()
  }, [selectedCity])

  if (loading) return <div className="p-10 text-muted-foreground animate-pulse">Buscando métricas via IA...</div>
  if (!data) return <div className="p-10 text-destructive">Falha ao conectar na War Room API</div>
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
        <p className="text-muted-foreground">Visão Panorâmica de Mandato e Sentimento de Crise</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovação Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.approval_rating}%</div>
            <p className="text-xs text-muted-foreground">+2.1% no último trimestre</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Crise Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data.crisis_alerts} Ocorrências</div>
            <p className="text-xs text-muted-foreground">Segurança e Saúde Local</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">População Estimada</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.estimated_population}</div>
            <p className="text-xs text-muted-foreground">Região Metropolitana RJ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análise de Sentimento (IA)</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{data.sentiment_analysis}</div>
            <p className="text-xs text-muted-foreground">Extraído de painéis recentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 max-h-[450px]">
          <CardHeader>
            <CardTitle>Posicionamento do Candidato vs Expectativa Real</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
             {radarData.length > 0 && radarData.some(d => d.candidato > 0 || d.ideal > 0) ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                     <PolarGrid stroke="hsl(var(--border))" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                     <RechartsTooltip 
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            borderColor: 'hsl(var(--border))', 
                            color: 'hsl(var(--popover-foreground))',
                            borderRadius: '8px' 
                        }} 
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                     />
                     <Radar name="Expectativa" dataKey="ideal" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.5} />
                     <Radar name="Candidato" dataKey="candidato" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                   </RadarChart>
                 </ResponsiveContainer>
             ) : (
                 <div className="flex flex-col items-center justify-center w-full h-full text-center p-6 border-2 border-dashed border-border rounded-lg bg-muted/20">
                    <Activity className="h-10 w-10 text-muted-foreground mb-4 opacity-30" />
                    <p className="text-sm font-semibold text-foreground">Dados insuficientes</p>
                    <p className="text-xs text-muted-foreground mt-2 max-w-[280px]">Alimente o perfil do candidato e as pesquisas de opinião no sistema de Inbound para gerar o mapa de posicionamento espacial.</p>
                 </div>
             )}
          </CardContent>
        </Card>

        <Card className="col-span-3 overflow-hidden">
          <CardHeader>
            <CardTitle>Visão Geopolítica (RJ)</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
             {/* Dynamic Leaflet Map directly wired to states */}
             <InteractiveMap 
                geoJsonData={geoData} 
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity} 
             />
          </CardContent>
        </Card>
      </div>
      
      {/* Detail panel triggering when user clicks on a city */}
      {selectedCity && (
        <Card className="mt-8 border-primary bg-card text-card-foreground animate-in slide-in-from-bottom duration-300">
           <CardHeader>
             <CardTitle className="flex justify-between items-center text-primary">
                Alvo Selecionado: {selectedCity.toUpperCase()}
                <button onClick={() => setSelectedCity(null)} className="text-sm border border-border p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Limpar Seleção</button>
             </CardTitle>
           </CardHeader>
           <CardContent>
             {loadingCity ? (
               <div className="flex flex-col gap-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-20 bg-muted rounded w-full"></div>
               </div>
             ) : selectedCityData?.error ? (
               <div className="text-destructive">Falha na extração de Inteligência. Servidor indisponível.</div>
             ) : selectedCityData ? (
               <div className="space-y-6">
                 {/* AI Summary Block */}
                 <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Alerta de Gestão (IA Estratégica)
                    </h4>
                    <div className="text-sm text-foreground leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedCityData.alerta_gestao || selectedCityData.resumo_estrategico}
                    </div>
                 </div>

                 {/* Metrics Grid em Duas Colunas Verticais */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Coluna A: Segurança (ISPRJ) */}
                    <div className="space-y-4">
                       <h3 className="text-md font-bold text-muted-foreground flex items-center gap-2 border-b pb-2 mb-4">
                           <ShieldAlert className="w-4 h-4 text-destructive" /> Segurança Pública
                       </h3>
                       
                       <div className="flex flex-col p-3 border rounded border-border bg-card">
                         <span className="text-xs text-muted-foreground mb-1">Índice de Letalidade Violenta (ILV)</span>
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-2xl text-destructive">
                                {selectedCityData.ssp?.ilv != null ? selectedCityData.ssp.ilv : <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">Sem dados</span>}
                            </span>
                            <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded bg-muted">
                                {selectedCityData.ssp_ilv_formated || 'N/D'}
                            </span>
                         </div>
                       </div>
                       
                       <div className="flex flex-col p-3 border rounded border-border bg-card">
                         <span className="text-xs text-muted-foreground mb-1">Total de Roubos de Rua</span>
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-2xl text-destructive">
                                {selectedCityData.ssp?.taxa_roubo_rua != null ? selectedCityData.ssp.taxa_roubo_rua : <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">Sem dados</span>}
                            </span>
                            <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded bg-muted">
                                {selectedCityData.ssp_roubo_rua_formated || 'N/D'}
                            </span>
                         </div>
                       </div>
                    </div>
                    
                    {/* Coluna B: Gestão Eficiente Fiscal */}
                    <div className="space-y-4">
                       <h3 className="text-md font-bold text-muted-foreground flex items-center gap-2 border-b pb-2 mb-4">
                           <BadgeDollarSign className="w-4 h-4 text-emerald-500" /> Gestão Eficiente (Siconfi)
                       </h3>
                       
                       <div className="flex flex-col p-3 border rounded border-border bg-card">
                         <div className="flex justify-between items-end mb-2">
                           <span className="text-xs text-muted-foreground">Gasto de Pessoal (LRF Limite 54%)</span>
                           <span className={`font-bold ${selectedCityData.fiscal?.gasto_pessoal_rcl > 51.3 ? 'text-destructive' : 'text-emerald-500'}`}>
                             {selectedCityData.fiscal?.gasto_pessoal_rcl != null ? `${selectedCityData.fiscal.gasto_pessoal_rcl}%` : <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">Sem dados</span>}
                           </span>
                         </div>
                         <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                           <div 
                             className={`h-full ${selectedCityData.fiscal?.gasto_pessoal_rcl > 51.3 ? 'bg-destructive' : selectedCityData.fiscal?.gasto_pessoal_rcl > 48 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                             style={{ width: `${Math.min(100, selectedCityData.fiscal?.gasto_pessoal_rcl || 0)}%` }} 
                           />
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div className="flex flex-col p-3 border rounded border-border bg-card">
                              <span className="text-xs text-muted-foreground mb-1"><Briefcase className="inline w-3 h-3 mr-1"/> Capacid. de Investimento</span>
                              <span className="font-bold text-lg text-foreground">
                                  {selectedCityData.fiscal?.investimento_receita != null ? `${selectedCityData.fiscal.investimento_receita}%` : <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">Sem dados</span>}
                                  {selectedCityData.fiscal?.investimento_receita != null && <span className="text-xs font-normal text-muted-foreground"> (Da Rec. Total)</span>}
                              </span>
                           </div>
                           <div className="flex flex-col p-3 border rounded border-border bg-card">
                              <span className="text-xs text-muted-foreground mb-1 flex items-center whitespace-nowrap"><FileLock2 className="inline w-3 h-3 mr-1"/> Custo vs Educação</span>
                              <span className="font-bold text-lg text-foreground">
                                  {selectedCityData.fiscal?.gasto_aluno != null ? `R$ ${selectedCityData.fiscal.gasto_aluno}` : <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">Sem dados</span>}
                                  {selectedCityData.fiscal?.gasto_aluno != null && <span className="text-xs font-normal text-muted-foreground"> / Aluno EM</span>}
                              </span>
                           </div>
                       </div>
                       
                    </div>

                 </div>
                 
                 <div className="flex gap-4 mt-6">
                    <a href={`/guidelines?municipio=${encodeURIComponent(selectedCity.split(" -")[0])}`} className="w-full inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none">
                        Ver Dossiê Estratégico (Modo Personas) →
                    </a>
                 </div>
               </div>
             ) : (
                <div className="text-muted-foreground">Selecione uma área de risco no mapa.</div>
             )}
           </CardContent>
        </Card>
      )}
    </div>
  )
}
