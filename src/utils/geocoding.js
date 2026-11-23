// Geocoding and reverse geocoding utilities with multi-tier caching and in-flight deduplication

const memoryCache = new Map();
const inFlightRequests = new Map();

/**
 * Generate a cache key rounded to ~4 decimal places (approx. 11 meters)
 */
export function toGeocodeCacheKey(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

/**
 * Calculate distance in meters between two coordinates using Haversine formula
 */
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const l1 = Number(lat1);
  const lo1 = Number(lon1);
  const l2 = Number(lat2);
  const lo2 = Number(lon2);
  if (!Number.isFinite(l1) || !Number.isFinite(lo1) || !Number.isFinite(l2) || !Number.isFinite(lo2)) {
    return null;
  }
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(l2 - l1);
  const dLon = toRad(lo2 - lo1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(l1)) * Math.cos(toRad(l2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format meters into readable distance string (e.g. "45 m" or "1.2 km")
 */
export function formatDistanceString(meters, targetName = 'Branch') {
  if (meters == null || !Number.isFinite(Number(meters))) return null;
  const m = Math.round(Number(meters));
  const dist = m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m} m`;
  return targetName ? `${dist} from ${targetName}` : dist;
}

/**
 * Extract a human-readable clean place name from BigDataCloud reverse geocode response
 */
function formatBigDataCloudResponse(data) {
  if (!data || typeof data !== 'object') return null;

  const parts = [];
  if (data.locality && typeof data.locality === 'string') {
    parts.push(data.locality.trim());
  }

  if (Array.isArray(data.localityInfo?.informative)) {
    for (const item of data.localityInfo.informative) {
      if (item.name && item.description && /industrial|sector|phase|market|block|area|nagar/i.test(item.description + ' ' + item.name)) {
        const cleanName = item.name.trim();
        if (!parts.some(p => p.toLowerCase().includes(cleanName.toLowerCase()))) {
          parts.unshift(cleanName);
          break;
        }
      }
    }
  }

  const city = data.city || data.localityInfo?.administrative?.find(a => a.order === 6 || a.adminLevel === 6)?.name;
  if (city && typeof city === 'string' && !parts.some(p => p.toLowerCase().includes(city.trim().toLowerCase()))) {
    parts.push(city.trim());
  }

  if (data.principalSubdivision && typeof data.principalSubdivision === 'string') {
    const state = data.principalSubdivision.trim();
    if (!parts.some(p => p.toLowerCase().includes(state.toLowerCase()))) {
      parts.push(state);
    }
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Extract clean place name from Nominatim response
 */
function formatNominatimResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const address = data.address;
  if (!address) return data.name || data.display_name || null;

  const parts = [];
  const local = address.road || address.neighbourhood || address.suburb || address.industrial || address.commercial || data.name;
  if (local) parts.push(local);

  const city = address.city || address.town || address.county || address.city_district;
  if (city && !parts.includes(city)) parts.push(city);

  const state = address.state;
  if (state && !parts.includes(state)) parts.push(state);

  return parts.length > 0 ? parts.join(', ') : data.display_name || null;
}

/**
 * Reverse geocode latitude and longitude to a human readable place name.
 */
export async function getPlaceNameFromCoords(lat, lon) {
  const cacheKey = toGeocodeCacheKey(lat, lon);
  if (!cacheKey) return null;

  // 1. In-memory cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  // 2. localStorage cache
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(`ciis_place_${cacheKey}`);
      if (stored) {
        memoryCache.set(cacheKey, stored);
        return stored;
      }
    } catch (e) {}
  }

  // 3. In-flight promise
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    const latitude = Number(lat);
    const longitude = Number(lon);

    let placeName = null;

    // BigDataCloud client API
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        controller ? { signal: controller.signal } : {}
      );
      if (timeoutId) clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        placeName = formatBigDataCloudResponse(data);
      }
    } catch (err) {
      // Fallback
    }

    // Fallback: OpenStreetMap Nominatim
    if (!placeName) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          {
            headers: { 'Accept': 'application/json' },
            ...(controller ? { signal: controller.signal } : {})
          }
        );
        if (timeoutId) clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          placeName = formatNominatimResponse(data);
        }
      } catch (err) {
        // Ignored
      }
    }

    if (placeName) {
      memoryCache.set(cacheKey, placeName);
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(`ciis_place_${cacheKey}`, placeName);
        } catch (e) {}
      }
    }

    return placeName;
  })().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}
