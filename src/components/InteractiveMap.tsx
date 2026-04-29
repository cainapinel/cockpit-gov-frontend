import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { api } from '@/lib/api'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  geoJsonData: any;
  onSelectCity: (cityName: string) => void;
  selectedCity: string | null;
}

interface MapDataItem {
  municipio: string;
  valor: number | null;
}

const KPI_OPTIONS = [
  { value: 'social_cadunico', label: 'Vulnerabilidade (CadÚnico %)', invert: true },
  { value: 'saude_cobertura_aps', label: 'Saúde (Cobertura APS %)', invert: false },
  { value: 'infra_esgoto', label: 'Esgoto (%)', invert: false },
  { value: 'indice_letalidade_violenta', label: 'Letalidade Violenta', invert: true },
  { value: 'educacao_ideb', label: 'IDEB', invert: false },
  { value: 'fiscal_gasto_pessoal_rcl', label: 'Gasto Pessoal / RCL (%)', invert: true },
]

/**
 * Escala de cores dinâmica baseada no range real dos dados.
 * @param value  - Valor bruto do KPI
 * @param max    - Valor máximo do KPI no dataset
 * @param invert - Se true, valores ALTOS = vermelho (ex: vulnerabilidade, letalidade)
 */
function getHeatColor(value: number | null, max: number, invert: boolean): string {
  if (value === null || value === undefined || max === 0) return '#475569' // slate-600

  const ratio = Math.max(0, Math.min(1, value / max))
  // Se invertido, alto = ruim (vermelho). Se não invertido, alto = bom (verde).
  const t = invert ? (1 - ratio) : ratio

  // Gradiente: vermelho (#ef4444) → amarelo (#eab308) → verde (#22c55e)
  if (t < 0.5) {
    const p = t / 0.5
    const r = 239
    const g = Math.round(68 + (179 - 68) * p)
    const b = Math.round(68 + (8 - 68) * p)
    return `rgb(${r},${g},${b})`
  } else {
    const p = (t - 0.5) / 0.5
    const r = Math.round(234 + (34 - 234) * p)
    const g = Math.round(179 + (197 - 179) * p)
    const b = Math.round(8 + (94 - 8) * p)
    return `rgb(${r},${g},${b})`
  }
}

function normalize(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function InteractiveMap({ geoJsonData, onSelectCity, selectedCity }: MapProps) {
  const [mapData, setMapData] = useState<MapDataItem[]>([])
  const [kpi, setKpi] = useState('social_cadunico')

  const currentKpi = KPI_OPTIONS.find(k => k.value === kpi)
  const isInverted = currentKpi?.invert ?? false

  useEffect(() => {
    api.get(`/analytics/geopolitical-map/?kpi=${kpi}`)
      .then(res => setMapData(res.data.data || []))
      .catch(err => console.error('Falha ao carregar dados do mapa:', err))
  }, [kpi])

  // Calcular max dinâmico a partir dos dados reais
  const maxValue = useMemo(() => {
    const values = mapData
      .map(d => d.valor)
      .filter((v): v is number => v !== null && v !== undefined)
    return values.length > 0 ? Math.max(...values) : 100
  }, [mapData])

  if (!geoJsonData) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground animate-pulse">
        Carregando Mapa...
      </div>
    )
  }

  // Dict para lookup rápido por nome normalizado
  const dataDict: Record<string, number | null> = {}
  for (const item of mapData) {
    dataDict[normalize(item.municipio)] = item.valor
  }

  const styleFeature = (feature: any) => {
    const name = feature.properties?.name || ''
    const normName = normalize(name)
    const valor = dataDict[normName] ?? null
    const isSelected = selectedCity && normalize(selectedCity) === normName

    return {
      fillColor: isSelected ? '#eab308' : getHeatColor(valor, maxValue, isInverted),
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#eab308' : 'rgba(255,255,255,0.4)',
      fillOpacity: isSelected ? 0.9 : 0.75,
    }
  }

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature.properties?.name || 'Desconhecido'
    const normName = normalize(name)
    const valor = dataDict[normName]

    const valorStr = valor !== null && valor !== undefined
      ? `${valor.toFixed(1)}`
      : 'Sem dados'

    layer.bindTooltip(`
      <div style="font-family: system-ui; padding: 4px; min-width: 140px;">
        <strong style="font-size: 13px;">${name}</strong><br/>
        <span style="font-size: 11px; color: #94a3b8;">
          ${currentKpi?.label || kpi}: <b style="color: #f8fafc;">${valorStr}</b>
        </span>
      </div>
    `, { direction: 'top', sticky: true })

    layer.on({ click: () => onSelectCity(name) })
  }

  return (
    <div className="h-full w-full flex flex-col gap-2">
      {/* Seletor de KPI */}
      <select
        id="kpi-selector"
        value={kpi}
        onChange={(e) => setKpi(e.target.value)}
        className="text-xs border rounded px-2 py-1.5 bg-card text-foreground border-border w-fit cursor-pointer hover:border-primary transition-colors"
      >
        {KPI_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <div className="flex-1 rounded-md overflow-hidden border border-border min-h-[350px]">
        <MapContainer
          center={[-22.25, -43.1]}
          zoom={7}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <GeoJSON
            key={kpi + JSON.stringify(mapData.length) + selectedCity}
            data={geoJsonData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
          <MapBounds selectedCity={selectedCity} geoJsonData={geoJsonData} />
        </MapContainer>
      </div>
    </div>
  )
}

function MapBounds({ selectedCity }: { selectedCity: string | null; geoJsonData: any }) {
  const map = useMap()

  React.useEffect(() => {
    if (!selectedCity) {
      map.setView([-22.25, -43.1], 7)
    }
  }, [selectedCity, map])

  return null
}
