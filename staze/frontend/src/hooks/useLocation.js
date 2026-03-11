import { useCallback, useEffect, useState, useRef } from 'react'

export function useLocation() {
  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState(() => (navigator.geolocation ? 'loading' : 'unsupported'))
  const [manualCity, setManualCity] = useState('')
  const [error, setError] = useState(() => (navigator.geolocation ? '' : 'Geolocation unsupported'))
  const timeoutRef = useRef(null)

  const locate = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setStatus('granted')
        setError('')
      },
      (locationError) => {
        setStatus('denied')
        setError(locationError.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      setError('Geolocation unsupported')
      return
    }

    setStatus('loading')
    locate()
  }, [locate])

  useEffect(() => {
    if (navigator.geolocation) {
      locate()
    }
  }, [locate])

  useEffect(() => {
    if (!manualCity.trim()) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualCity)}&format=json&limit=1`)
        const data = await res.json()
        if (data && data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) })
          setStatus('granted_manual')
        }
      } catch (err) {
        console.error('Nominatim search failed:', err)
      }
    }, 1000)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [manualCity])

  return {
    coords,
    status,
    error,
    manualCity,
    setManualCity,
    requestLocation,
  }
}
