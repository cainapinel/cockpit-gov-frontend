import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Filter, Loader2, DatabaseZap } from "lucide-react"
import { api } from "@/lib/api"

// ─── Helpers ────────────────────────────────────────────────────────
/** Verifica se um valor de cidade é nulo/zero/ausente */
function isCidadeAusente(val: any): boolean {
  return val === null || val === undefined || val === 0 || val === 0.0
}

/** Verifica se o insight_text está vazio ou é a frase padrão de dados indisponíveis */
function isInsightVazio(text: any): boolean {
  if (!text || typeof text !== 'string') return true
  const lower = text.trim().toLowerCase()
  return lower === '' || lower.includes('dados indisponíveis')
}

// ─── Skeleton de Carregamento ───────────────────────────────────────
function BenchmarkSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="space-y-2">
          <div className="h-8 w-72 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded-md bg-muted/60 animate-pulse" />
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <div className="h-10 w-40 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-44 rounded-md bg-muted animate-pulse" />
        </div>
      </div>

      {/* Dropdown skeleton */}
      <div className="flex gap-4 items-center">
        <div className="h-10 w-[280px] rounded-md bg-muted animate-pulse" />
      </div>

      {/* Chart Card skeleton */}
      <Card className="col-span-1 border-primary/20 bg-card">
        <CardHeader>
          <div className="h-5 w-56 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-80 rounded-md bg-muted/60 animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="h-[500px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <span className="text-sm text-muted-foreground animate-pulse">
            Cruzando indicadores demográficos e macroeconômicos via IA...
          </span>
          {/* Fake bar lines */}
          <div className="w-full flex items-end justify-center gap-3 mt-6 px-12 opacity-20">
            {[65, 40, 85, 55, 70, 45, 90, 60].map((h, i) => (
              <div
                key={i}
                className="rounded-t bg-muted animate-pulse"
                style={{ height: `${h}px`, width: '32px', animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metric cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Card key={idx} className="bg-card border-border">
            <CardHeader className="py-3 pb-1 flex flex-row items-center justify-between">
              <div className="h-4 w-28 rounded bg-muted animate-pulse" style={{ animationDelay: `${idx * 150}ms` }} />
              <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <div className="h-6 w-32 rounded bg-muted animate-pulse" style={{ animationDelay: `${idx * 150}ms` }} />
              <div className="h-3 w-full rounded bg-muted/50 animate-pulse" style={{ animationDelay: `${idx * 150 + 50}ms` }} />
              <div className="h-3 w-3/4 rounded bg-muted/50 animate-pulse" style={{ animationDelay: `${idx * 150 + 100}ms` }} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Componente Principal ───────────────────────────────────────────
export function Benchmark() {
  const [data, setData] = useState<any>(null)
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("all")

  // isLoading = true até o PRIMEIRO fetch completar (loading inicial da tela)
  const [isLoading, setIsLoading] = useState(true)
  // fetchingChart = true durante qualquer fetch subsequente (troca de filtro)
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
      } catch (e: any) {
        if (e.name === 'CanceledError' || e.message === 'canceled') return;
        console.error(e)
      }
    }
    loadCities()
    return () => controller.abort()
  }, [])

  // Fetch do Chart quando o SelectedCity muda
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
        // Só desliga o loading se a requisição for um sucesso absoluto
        setIsLoading(false)
        setFetchingChart(false)
      } catch (e: any) {
        // Se foi cancelado pelo React, aborta a execução silenciosamente e NÃO mexe no loading
        if (e.name === 'CanceledError' || e.message === 'canceled') return;

        console.error(e)
        setData(null)
        // Só desliga o loading se for um erro real do servidor
        setIsLoading(false)
        setFetchingChart(false)
      }
    }
    loadData()
    return () => controller.abort()
  }, [selectedCity])

  // Handler para troca de filtro — ativa loading visual
  function handleCityChange(value: string) {
    setFetchingChart(true)
    setSelectedCity(value)
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDERIZAÇÃO ESTRITAMENTE BLOQUEANTE
  // ═══════════════════════════════════════════════════════════════════

  // 1. PRIMEIRO: Se isLoading, NÃO renderiza NADA além do Skeleton.
  //    Isso impede qualquer flash do Empty State.
  if (isLoading) {
    return <BenchmarkSkeleton />
  }

  // 2. A partir daqui, isLoading === false. Podemos avaliar dados.
  const hasData = data && data.benchmark_data && data.benchmark_data.length > 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ─── Header ─────────────────────────────────────────────── */}
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

      {/* ─── Filtro de Cidade ──────────────────────────────────── */}
      <div className="flex gap-4 items-center">
        <Select value={selectedCity} onValueChange={handleCityChange} disabled={fetchingChart}>
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

      {/* ─── Área de Conteúdo ──────────────────────────────────── */}
      {(() => {
        // 3. Se fetchingChart === true → SEMPRE mostra loading, nunca empty state
        if (fetchingChart) {
          return (
            <Card className="col-span-1 border-primary/20 bg-card h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                <span className="text-sm text-muted-foreground">Processando indicadores cruzados...</span>
              </div>
            </Card>
          )
        }

        // 4. fetchingChart === false E sem dados → Empty State real
        if (!hasData) {
          return (
            <Card className="col-span-1 border-dashed border-2 bg-transparent h-[400px] flex items-center justify-center">
              <div className="text-center">
                <DatabaseZap className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Dados Indisponíveis</h3>
                <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto mt-2">
                  Não existem indicadores processados ou cruzados para o município selecionado neste eixo de análise.
                </p>
              </div>
            </Card>
          )
        }

        // 5. fetchingChart === false E hasData → Renderiza gráficos e cards
        return (
          <>
            <Card className="col-span-1 border-primary/20 bg-card">
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

            {/* ─── Cards de Métricas com tratamento de N/D ──────── */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {data.benchmark_data.map((item: any, idx: number) => {
                // Regra condicional: se for seguranca (CVLI) ou cadunico (Vulnerabilidade), números maiores são piores. 
                // Se for esgoto, números maiores são melhores. Gasto Pessoal menor é melhor, mas até o limite.
                const cidadeAusente = isCidadeAusente(item.Cidade)
                const isNegativeMetric = item.id === 'seguranca' || item.id === 'cadunico' || item.id === 'gasto_pessoal';

                // Se cidade ausente, não marca como crítico — estado neutro
                const isCritical = cidadeAusente
                  ? false
                  : isNegativeMetric ? (item.Cidade > item.Estado) : (item.Cidade < item.Estado);

                // Status visual do indicador
                const dotColor = cidadeAusente
                  ? 'bg-muted-foreground/40'
                  : isCritical ? 'bg-destructive animate-pulse' : 'bg-emerald-500'

                const cardBg = cidadeAusente
                  ? 'bg-card border-border'
                  : isCritical ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border'

                return (
                  <Card key={idx} className={cardBg}>
                    <CardHeader className="py-3 pb-1 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">{item.name}</CardTitle>
                      <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="text-lg font-bold flex gap-2">
                        {cidadeAusente ? (
                          <span className="text-muted-foreground/60">N/D</span>
                        ) : (
                          item.Cidade
                        )}
                        {' '}
                        <span className="text-xs text-muted-foreground self-end mb-1">
                          vs {item.Estado ?? 'N/D'} (Est.)
                        </span>
                      </div>
                      <p className="text-xs mt-3 leading-relaxed text-foreground/80 italic font-medium">
                        {isInsightVazio(item.insightText) ? (
                          <span className="text-muted-foreground/60">Sem dados suficientes para gerar análise.</span>
                        ) : (
                          <>"{item.insightText}"</>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )
      })()}
    </div>
  )
}
