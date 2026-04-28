import React from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface MapProps {
  geoJsonData: any;
  csvData: any[];
  onSelectCity: (cityName: string) => void;
  selectedCity: string | null;
}

export function InteractiveMap({ geoJsonData, csvData, onSelectCity, selectedCity }: MapProps) {
  if (!geoJsonData) return <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground animate-pulse">Carregando Mapa...</div>

  // Create a dictionary for fast lookup
  const dataDict = csvData.reduce((acc, row) => {
    if (row.municipio) {
      // Normalize name to match geojson properties
      const normalizedName = row.municipio.split(" -")[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      acc[normalizedName] = row
    }
    return acc
  }, {} as Record<string, any>)

  // Helper function to color map based on population or another metric
  const getColor = (cityName: string) => {
    const defaultColor = '#3b82f6' // tailwind blue-500
    const selectedColor = '#eab308' // tailwind yellow-500
    if (selectedCity && cityName.toLowerCase() === selectedCity.toLowerCase()) {
      return selectedColor
    }
    return defaultColor
  }

  const styleFeature = (feature: any) => {
    const name = feature.properties?.name || ''
    const color = getColor(name)
    
    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    }
  }

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature.properties?.name || 'Desconhecido'
    const norm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const cityData = dataDict[norm]

    // Tooltip content
    layer.bindTooltip(`
        <div style="font-family: sans-serif; padding: 4px;">
            <strong>${name}</strong><br/>
            População: ${cityData ? cityData.populacao : 'N/D'}<br/>
            PIB: ${cityData ? cityData.pib_per_capita : 'N/D'}
        </div>
    `, { direction: 'top', sticky: true })

    layer.on({
      click: () => onSelectCity(name)
    })
  }

  return (
    <div className="h-[450px] w-full rounded-md overflow-hidden border">
      <MapContainer 
        center={[-22.9068, -43.1729]} 
        zoom={7} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <GeoJSON 
            data={geoJsonData} 
            style={styleFeature}
            onEachFeature={onEachFeature}
        />
        <MapBounds selectedCity={selectedCity} geoJsonData={geoJsonData as any} />
      </MapContainer>
    </div>
  )
}

function MapBounds({ selectedCity }: { selectedCity: string | null, geoJsonData: any }) {
  const map = useMap()
  
  React.useEffect(() => {
    // If we wanted to fly to the selected city, we would parse its bounds from geoJsonData here
    // For simplicity, we just keep the static view.
    if (!selectedCity) {
      map.setView([-22.9068, -43.1729], 7)
    }
  }, [selectedCity, map])
  
  return null
}
