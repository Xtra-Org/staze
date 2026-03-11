const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
]
const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map()

function toRadians(value) {
  return (value * Math.PI) / 180
}

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildQuery(lat, lng, radiusMeters) {
  return `[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  relation["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
  way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
  relation["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
  node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
  way["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
  relation["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
  node["healthcare"="clinic"](around:${radiusMeters},${lat},${lng});
  way["healthcare"="clinic"](around:${radiusMeters},${lat},${lng});
  relation["healthcare"="clinic"](around:${radiusMeters},${lat},${lng});
);
out center;`
}

function getCacheKey(lat, lng) {
  return `${lat.toFixed(3)}:${lng.toFixed(3)}`
}

function getFreshCache(lat, lng) {
  const cached = cache.get(getCacheKey(lat, lng))
  if (!cached) return null
  if (Date.now() - cached.createdAt > CACHE_TTL_MS) return null
  return cached.results
}

function getStaleCache(lat, lng) {
  return cache.get(getCacheKey(lat, lng))?.results || null
}

function setCache(lat, lng, results) {
  cache.set(getCacheKey(lat, lng), {
    createdAt: Date.now(),
    results,
  })
}

async function fetchFromEndpoint(endpoint, query) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'STAZE/1.0 (Emergency Stabilization AI)',
    },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!response.ok) throw new Error(`OSM request failed with ${response.status}`)
  return response.json()
}

function normalizeResults(payload, lat, lng) {
  const elements = payload.elements || []

  const unique = new Map()

  for (const item of elements) {
    const itemLat = item.lat ?? item.center?.lat
    const itemLng = item.lon ?? item.center?.lon
    if (typeof itemLat !== 'number' || typeof itemLng !== 'number') continue

    const name = item.tags?.name || 'Nearby hospital'
    const address = item.tags?.['addr:full'] || item.tags?.['addr:street'] || 'Address unavailable'
    const key = `${name.toLowerCase()}|${itemLat.toFixed(5)}|${itemLng.toFixed(5)}`

    unique.set(key, {
      name,
      address,
      distance: Number(getDistanceKm(lat, lng, itemLat, itemLng).toFixed(2)),
      type: item.tags?.amenity || item.tags?.healthcare || 'hospital',
      phone: item.tags?.phone || item.tags?.['contact:phone'] || item.tags?.mobile || item.tags?.['contact:mobile'] || '',
      location: { lat: itemLat, lng: itemLng },
      maps_url: `https://www.google.com/maps/dir/?api=1&destination=${itemLat},${itemLng}&travelmode=driving`,
      source: 'osm',
    })
  }

  return [...unique.values()].sort((a, b) => a.distance - b.distance)
}

export async function searchHospitalsViaOsm({ lat, lng }) {
  const cached = getFreshCache(lat, lng)
  if (cached?.length) {
    return cached
  }

  let lastError = null
  const radii = [5000, 10000]

  for (const radiusMeters of radii) {
    const query = buildQuery(lat, lng, radiusMeters)

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const payload = await fetchFromEndpoint(endpoint, query)
        const results = normalizeResults(payload, lat, lng)
        if (results.length > 0) {
          setCache(lat, lng, results)
          return results
        }
      } catch (error) {
        lastError = error
      }
    }
  }

  const stale = getStaleCache(lat, lng)
  if (stale?.length) {
    return stale
  }

  throw lastError || new Error('OSM request failed')
}
