const GOOGLE_PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'

function getMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY?.trim()
}

export function googleMapsAvailable() {
  return Boolean(getMapsApiKey())
}

export async function searchHospitalsViaGoogle({ lat, lng }) {
  const apiKey = getMapsApiKey()

  if (!apiKey) {
    throw new Error('Google Maps API key is missing')
  }

  const response = await fetch(GOOGLE_PLACES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours.openNow,places.location,places.id,places.internationalPhoneNumber',
    },
    body: JSON.stringify({
      textQuery: `hospital emergency near ${lat},${lng}`,
      maxResultCount: 8,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 5000,
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Places request failed: ${response.status} ${errorText}`)
  }

  const payload = await response.json()

  return (payload.places || []).map((place) => ({
    name: place.displayName?.text || 'Nearby hospital',
    address: place.formattedAddress || 'Address unavailable',
    rating: Number(place.rating || 0),
    open_now: typeof place.currentOpeningHours?.openNow === 'boolean' ? place.currentOpeningHours.openNow : 'Unknown',
    phone: place.internationalPhoneNumber || '',
    location: {
      lat: place.location?.latitude,
      lng: place.location?.longitude,
    },
    place_id: place.id,
    maps_url: place.location?.latitude && place.location?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${place.location.latitude},${place.location.longitude}`
      : 'https://www.google.com/maps/search/hospital',
    source: 'google',
  }))
}
