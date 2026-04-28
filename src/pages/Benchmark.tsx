import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"
import { api } from "@/lib/api"

export function Benchmark() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const res = await api.get('/analytics/benchmark/', { signal: controller.signal })
        setData(res.data)
      } catch(e: any) { 
          if (e.name === 'CanceledError' || e.message === 'canceled') return;
          console.error(e) 
      }
      finally { setLoading(false) }
    }
    load()
    return () => controller.abort()
  }, [])

  if (loading) return <div className="p-10 text-muted-foreground animate-pulse">Cruzando dados demográficos via IA...</div>
  if (!data) return <div className="p-10 text-destructive">Falha ao conectar no Benchmark API</div>
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benchmarking Estratégico</h1>
          <p className="text-muted-foreground">Cruzamento de Dados Demográficos a Nível Triplo (Múnicipio vs Estado vs Brasil)</p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros Avançados</Button>
          <Button><Download className="mr-2 h-4 w-4" /> Exportar Relatório</Button>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Select defaultValue="all">
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="Eixo Estratégico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visão Geral (Todos)</SelectItem>
            <SelectItem value="saude">Saúde Pública</SelectItem>
            <SelectItem value="educacao">Educação e IDEB</SelectItem>
            <SelectItem value="seguranca">Segurança (ISP)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="col-span-1 border-primary/20 bg-card">
        <CardHeader>
          <CardTitle>Análise em Barras Agrupadas</CardTitle>
          <CardDescription>Escala padronizada cruzando a performance do mandato baseada em Índices Abertos (Base Dos Dados)</CardDescription>
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
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Cidade" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Estado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Brasil" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {/* KPI Minis for quick reads with AI Insights */}
         {data.benchmark_data.map((item: any, idx: number) => {
           // Decide if insight is critical based on some rule or just styling dynamically
           const isCritical = (item.Cidade < item.Estado && item.id !== 'seguranca') || (item.Cidade > item.Estado && item.id === 'seguranca');
           
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

    </div>
  )
}
