import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Filter, Loader2, DatabaseZap } from "lucide-react"
import { api } from "@/lib/api"

export function Benchmark() {
  const [data, setData] = useState<any>(null)
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("all")
  
  const [loading, setLoading] = useState(true)
  const [fetchingChart, setFetchingChart] = useState(false)

  // Fetch das Cidades no Mount
  useEffect(() => {
    const controller = new AbortController()
    async function loadCities() {
      try {
        const res = await api.get('/analytics/cities/', { signal: controller.signal })
        if (res.data.cities) {
          setCities(res.data.cities)
        }
      } catch(e: any) { 
          if (e.name === 'CanceledError' || e.message === 'canceled') return;
          console.error(e) 
      }
    }
    loadCities()
    return () => controller.abort()
  }, [])

  // Fetch do Chart quando o SelectedCity muda
  useEffect(() => {
    const controller = new AbortController()
    async function loadData() {
      setFetchingChart(true)
      try {
        const url = selectedCity === "all" 
          ? '/analytics/benchmark/' 
          : `/analytics/benchmark/?city=${selectedCity}`
          
        const res = await api.get(url, { signal: controller.signal })
        setData(res.data)
      } catch(e: any) { 
          if (e.name === 'CanceledError' || e.message === 'canceled') return;
          console.error(e) 
          setData(null)
      }
      finally { 
        setLoading(false)
        setFetchingChart(false) 
      }
    }
    loadData()
    return () => controller.abort()
  }, [selectedCity])

  if (loading) return (
    <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 h-8 w-8 animate-spin" />
      <span>Cruzando dados demográficos e macroeconômicos via IA...</span>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benchmarking Estratégico</h1>
          <p className="text-muted-foreground">Cruzamento de Dados Demográficos a Nível Triplo (Município vs Estado vs Brasil)</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros Avançados</Button>
          <Button><Download className="mr-2 h-4 w-4" /> Exportar Relatório</Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Select value={selectedCity} onValueChange={setSelectedCity} disabled={fetchingChart}>
          <SelectTrigger className="w-[280px] bg-background">
            <SelectValue placeholder="Selecione o Município" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visão Geral do Estado do RJ</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {fetchingChart && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      </div>

      {!data || !data.benchmark_data || data.benchmark_data.length === 0 ? (
        <Card className="col-span-1 border-dashed border-2 bg-transparent h-[400px] flex items-center justify-center">
          <div className="text-center">
            <DatabaseZap className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Dados Indisponíveis</h3>
            <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto mt-2">
              Não existem indicadores processados ou cruzados para o município selecionado neste eixo de análise.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card className={`col-span-1 border-primary/20 bg-card transition-opacity duration-300 ${fetchingChart ? 'opacity-50' : 'opacity-100'}`}>
            <CardHeader>
              <CardTitle>Análise em Barras Agrupadas</CardTitle>
              <CardDescription>
                Escala padronizada cruzando a performance de <span className="font-semibold text-primary">{selectedCity === 'all' ? 'Média do RJ' : selectedCity.toUpperCase()}</span> baseada em Índices Abertos (Base Dos Dados)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.benchmark_data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                    formatter={(value: any) => value === null ? ['Pendente de Inbound', ''] : [value, '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Cidade" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Estado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Brasil" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 transition-opacity duration-300 ${fetchingChart ? 'opacity-50' : 'opacity-100'}`}>
             {data.benchmark_data.map((item: any, idx: number) => {
               // Regra condicional: se for seguranca (CVLI) ou cadunico (Vulnerabilidade), números maiores são piores. 
               // Se for esgoto, números maiores são melhores. Gasto Pessoal menor é melhor, mas até o limite.
               const isNegativeMetric = item.id === 'seguranca' || item.id === 'cadunico' || item.id === 'gasto_pessoal';
               const isCritical = isNegativeMetric ? (item.Cidade > item.Estado) : (item.Cidade < item.Estado);
               
               return (
                 <Card key={idx} className={isCritical ? "bg-destructive/10 border-destructive/30" : "bg-card border-border"}>
                    <CardHeader className="py-3 pb-1 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">{item.name}</CardTitle>
                      <div className={`h-2 w-2 rounded-full ${isCritical ? 'bg-destructive animate-pulse' : 'bg-emerald-500'}`} />
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-lg font-bold flex gap-2">
                        {item.Cidade} <span className="text-xs text-muted-foreground self-end mb-1">vs {item.Estado} (Est.)</span>
                      </div>
                      <p className="text-xs mt-3 leading-relaxed text-foreground/80 italic font-medium">
                        "{item.insightText}"
                      </p>
                    </CardContent>
                 </Card>
               )
             })}
          </div>
        </>
      )}
    </div>
  )
}
