import React, { useEffect, useMemo } from 'react'
import { MapPin, Navigation, Search } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function buildDirectionsUrl(hospital, coords) {
  const params = new URLSearchParams({
    api: '1',
    travelmode: 'driving',
  })

  if (typeof coords?.lat === 'number' && typeof coords?.lng === 'number') {
    params.set('origin', `${coords.lat},${coords.lng}`)
  }

  const destinationText = [
    hospital.name,
    hospital.address && hospital.address !== 'Address unavailable' ? hospital.address : '',
  ].filter(Boolean).join(', ')

  if (destinationText) {
    params.set('destination', destinationText)
  } else if (typeof hospital.location?.lat === 'number' && typeof hospital.location?.lng === 'number') {
    params.set('destination', `${hospital.location.lat},${hospital.location.lng}`)
  } else {
    params.set('destination', hospital.name || 'hospital')
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function MapUpdater({ coords, hospitals }) {
  const map = useMap()
  
  useEffect(() => {
    if (!coords && !hospitals?.length) return
    
    const bounds = L.latLngBounds()
    if (coords) {
      bounds.extend([coords.lat, coords.lng])
    }
    hospitals.forEach(h => {
      if (h.location?.lat) {
        bounds.extend([h.location.lat, h.location.lng])
      }
    })
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [coords, hospitals, map])
  
  return null
}

export function HospitalMap({ copy, coords, hospitals, loading, online, locationStatus, manualCity, setManualCity }) {
  const defaultCenter = coords ? [coords.lat, coords.lng] : [20.5937, 78.9629] // Default India if no coords

  return (
    <section className="clay-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl text-white">{copy.nearestHospitals || 'Nearby Hospitals'}</h3>
          <p className="text-sm text-white/55">{(copy.locationLabel || 'Location')}: {locationStatus}</p>
        </div>
        {(locationStatus === 'denied' || locationStatus === 'unsupported' || locationStatus === 'granted_manual') ? (
          <input 
            value={manualCity} 
            onChange={(event) => setManualCity(event.target.value)} 
            placeholder={copy.manualCity || 'Enter your city or area'} 
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35" 
          />
        ) : null}
      </div>

      {!online ? (
        <div className="rounded-[20px] border border-white/10 bg-black/15 p-4 text-white/65">
          {copy.offlineBanner || 'Working offline.'}
        </div>
      ) : null}

      {online ? (
        <div className="relative z-10 h-[280px] w-full overflow-hidden rounded-[20px] border-[1.5px] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <MapContainer 
            center={defaultCenter} 
            zoom={coords ? 14 : 5} 
            style={{ height: '100%', width: '100%', background: '#080B14' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {coords && (
              <Marker position={[coords.lat, coords.lng]}>
                <Popup className="text-sm text-black">You are here</Popup>
              </Marker>
            )}
            {hospitals.map((h, i) => (
              h.location?.lat ? (
                <Marker 
                  key={`marker-${i}`} 
                  position={[h.location.lat, h.location.lng]} 
                  icon={hospitalIcon}
                >
                  <Popup className="text-sm text-black">
                    <strong>{h.name}</strong><br/>
                    Rank #{i + 1}<br/>
                    {h.specialty_match}
                    <br />
                    <a href={buildDirectionsUrl(h, coords)} target="_blank" rel="noreferrer">Get directions</a>
                  </Popup>
                </Marker>
              ) : null
            ))}
            <MapUpdater coords={coords} hospitals={hospitals} />
          </MapContainer>
        </div>
      ) : null}

      <ScrollArea className="mt-4 h-[320px]">
        <div className="grid gap-4 pr-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="h-5 w-40 rounded bg-white/10" />
                <div className="mt-3 h-4 w-64 rounded bg-white/10" />
                <div className="mt-4 h-10 w-32 rounded bg-white/10" />
              </div>
            ))
          ) : null}
          
          {!loading && hospitals.map((hospital, index) => (
            <article 
              key={`${hospital.name}-${index}`} 
              className={`rounded-[24px] border border-white/8 bg-black/15 p-5 ${
                index === 0 ? 'shadow-[0_0_24px_rgba(46,213,115,0.16)]' : ''
              }`}
            >
              {(() => {
                const directionsUrl = buildDirectionsUrl(hospital, coords)
                return (
                  <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="gray">#{index + 1}</Badge>
                    <h4 className="font-display text-xl text-white">{hospital.name}</h4>
                    {index === 0 ? <Badge tone="success" className="shadow-[0_0_12px_rgba(46,213,115,0.4)]">{copy.bestMatch || 'Best Match'}</Badge> : null}
                    <Badge tone="blue">via OpenStreetMap</Badge>
                  </div>
                  <p className="mt-2 text-sm text-white/65">{hospital.address}</p>
                </div>
                <Badge tone="amber">{hospital.distance} km</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-white/70">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-300" />{hospital.specialty_match}</div>
                <div><span className="font-semibold text-white">{copy.hospitalReason || 'Reason'}:</span> {hospital.rank_reason || 'Sorted by distance'}</div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  {hospital.type ? <span className="capitalize">{hospital.type}</span> : null}
                </div>
                <Button asChild variant="clay">
                  <a href={directionsUrl} target="_blank" rel="noreferrer">
                    <Navigation className="mr-2 h-4 w-4" />{copy.getDirections || 'Get Directions'}
                  </a>
                </Button>
              </div>
                  </>
                )
              })()}
            </article>
          ))}
          
          {!loading && !hospitals.length && coords ? (
            <div className="rounded-[24px] border border-white/10 bg-black/15 p-5 text-center text-white/65">
              <Search className="mx-auto mb-3 h-6 w-6 opacity-50" />
              <p className="mb-4">Could not find hospitals automatically</p>
              <Button asChild variant="clay">
                <a href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noreferrer">
                  <Search className="mr-2 h-4 w-4" /> Search Hospitals Near Me
                </a>
              </Button>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </section>
  )
}
