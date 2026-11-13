import type {
  CartItem,
  CropCatalogItem,
  CropCategory,
  CropDiseaseEntry,
  CropPlannerInput,
  CropRecommendation,
  CropScanDiagnosis,
  LocationWeather,
  MandiPriceEntry,
  MandiPriceWithDelta,
  MarketplaceListing,
  SymptomCategory,
} from '../types/agri';

export function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  const hasDecimals = Math.abs(amount % 1) > 0.001;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
}

export function recommendCrops(
  catalog: CropCatalogItem[],
  input: CropPlannerInput
): CropRecommendation[] {
  const scored: CropRecommendation[] = [];

  for (const crop of catalog) {
    const soilMatch = crop.compatibleSoils.includes(input.soilType);
    const seasonMatch = crop.idealSeasons.includes(input.season);

    // Require at least soil or season compatibility to stay relevant for farmers
    if (!soilMatch && !seasonMatch) {
      continue;
    }

    let score = 0;
    if (seasonMatch) score += 35;
    if (soilMatch) score += 30;
    if (crop.compatibleRegions.includes(input.regionId)) score += 15;
    if (crop.idealRainfall.includes(input.expectedRainfall)) score += 10;
    if (crop.idealTempBands.includes(input.temperatureBand)) score += 10;

    // Exclude weak mismatches below 55 points
    if (score < 55) continue;

    const fitSummary =
      score >= 85
        ? {
            en: 'Ideal match for your soil, season, and 4-month weather outlook.',
            hi: 'आपकी मिट्टी, सीजन और 4-माह के मौसम के लिए सर्वोत्तम विकल्प।',
          }
        : score >= 70
          ? {
              en: 'Strong regional fit; monitor irrigation at critical growth stages.',
              hi: 'आपके क्षेत्र के लिए उपयुक्त; मुख्य बढ़वार चरण में सिंचाई का ध्यान रखें।',
            }
          : {
              en: 'Viable secondary option with careful moisture management.',
              hi: 'नमी और सिंचाई प्रबंधन के साथ अच्छा वैकल्पिक विकल्प।',
            };

    scored.push({
      ...crop,
      matchScore: score,
      fitSummary,
    });
  }

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

export interface MandiFilterCriteria {
  state?: string;
  district?: string;
  mandi?: string;
  category?: CropCategory | 'all';
  query?: string;
}

export function enrichMandiPrice(entry: MandiPriceEntry): MandiPriceWithDelta {
  const deltaQuintal = entry.pricePerQuintal - entry.previousPricePerQuintal;
  const deltaPercent =
    entry.previousPricePerQuintal > 0
      ? Number(((deltaQuintal / entry.previousPricePerQuintal) * 100).toFixed(1))
      : 0;
  const trend: 'up' | 'down' | 'flat' =
    deltaQuintal > 0 ? 'up' : deltaQuintal < 0 ? 'down' : 'flat';

  return {
    ...entry,
    pricePerKg: Number((entry.pricePerQuintal / 100).toFixed(2)),
    deltaQuintal,
    deltaPercent,
    trend,
  };
}

export function filterMandiPrices(
  entries: MandiPriceEntry[],
  filters: MandiFilterCriteria
): MandiPriceWithDelta[] {
  const normalizedQuery = (filters.query ?? '').trim().toLowerCase();

  return entries
    .filter((item) => {
      if (filters.state && filters.state !== 'all' && item.state.en !== filters.state) {
        return false;
      }
      if (
        filters.district &&
        filters.district !== 'all' &&
        item.district.en !== filters.district
      ) {
        return false;
      }
      if (filters.mandi && filters.mandi !== 'all' && item.mandiName.en !== filters.mandi) {
        return false;
      }
      if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = [
          item.cropName.en,
          item.cropName.hi,
          item.variety.en,
          item.variety.hi,
          item.mandiName.en,
          item.mandiName.hi,
          item.district.en,
          item.district.hi,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    })
    .map(enrichMandiPrice);
}

export function searchCropDiseases(
  diseases: CropDiseaseEntry[],
  cropFilter: string,
  symptomFilter: SymptomCategory | 'all',
  query: string
): CropDiseaseEntry[] {
  const normalizedQuery = query.trim().toLowerCase();

  return diseases.filter((entry) => {
    if (cropFilter && cropFilter !== 'all' && entry.cropName.en !== cropFilter) {
      return false;
    }
    if (symptomFilter && symptomFilter !== 'all' && entry.symptomCategory !== symptomFilter) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = [
        entry.cropName.en,
        entry.cropName.hi,
        entry.diseaseName.en,
        entry.diseaseName.hi,
        entry.symptomsDescription.en,
        entry.symptomsDescription.hi,
        entry.recommendedTreatment.en,
        entry.recommendedTreatment.hi,
        entry.organicAlternative.en,
        entry.organicAlternative.hi,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });
}

export function searchWeatherLocations(
  locations: LocationWeather[],
  query: string
): LocationWeather[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return locations;

  return locations.filter((loc) => {
    const haystack = [
      loc.villageOrTown.en,
      loc.villageOrTown.hi,
      loc.district.en,
      loc.district.hi,
      loc.state.en,
      loc.state.hi,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function filterMarketplaceListings(
  listings: MarketplaceListing[],
  category: CropCategory | 'all',
  query: string
): MarketplaceListing[] {
  const q = query.trim().toLowerCase();
  return listings.filter((item) => {
    if (item.status !== 'active') return false;
    if (category !== 'all' && item.category !== category) return false;
    if (q) {
      const hay = `${item.cropName} ${item.farmerName} ${item.village}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function calculateCartTotal(cart: CartItem[]): {
  totalItemsKg: number;
  totalInr: number;
} {
  let totalItemsKg = 0;
  let totalInr = 0;
  for (const item of cart) {
    const qty = Math.max(0, item.quantityKg);
    totalItemsKg += qty;
    totalInr += qty * item.listing.pricePerKg;
  }
  return {
    totalItemsKg,
    totalInr: Math.round(totalInr * 100) / 100,
  };
}

export function simulateCropVisionDiagnosis(
  presets: Omit<CropScanDiagnosis, 'id' | 'imagePreviewUrl'>[],
  hintText: string,
  imagePreviewUrl?: string
): CropScanDiagnosis {
  const lower = hintText.toLowerCase();
  let chosen = presets[0];
  if (lower.includes('aphid') || lower.includes('pest') || lower.includes('insect') || lower.includes('mustard') || lower.includes('कीट')) {
    chosen = presets[1] ?? presets[0];
  } else if (lower.includes('yellow') || lower.includes('rust') || lower.includes('wheat') || lower.includes('paddy') || lower.includes('पील')) {
    chosen = presets[2] ?? presets[0];
  } else if (lower.includes('blight') || lower.includes('spot') || lower.includes('tomato') || lower.includes('potato')) {
    chosen = presets[0];
  } else if (hintText.length > 0) {
    const idx = hintText.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % presets.length;
    chosen = presets[idx] ?? presets[0];
  }

  return {
    ...chosen,
    id: `scan_${Date.now()}`,
    imagePreviewUrl,
  };
}

export const DEFAULT_CONTACT_DETAILS = {
  contactName: 'AgriVeda Farmer Helpdesk',
  email: 'agrivedha.ac@gmail.com',
  phone: '1800-180-1551',
  address: 'Krishi Seva Kendra, Rural Advisory Hub, India',
  supportHours: 'Mon–Sat · 6:00 AM – 8:00 PM IST',
};

export function normalizeContactDetails(
  partial?: Partial<{
    contactName: string;
    email: string;
    phone: string;
    address: string;
    supportHours: string;
  }> | null
) {
  const clean = (val: unknown, fallback: string, maxLen: number) => {
    if (typeof val !== 'string') return fallback;
    const trimmed = val.trim().slice(0, maxLen);
    return trimmed.length > 0 ? trimmed : fallback;
  };

  return {
    contactName: clean(partial?.contactName, DEFAULT_CONTACT_DETAILS.contactName, 80),
    email: clean(partial?.email, DEFAULT_CONTACT_DETAILS.email, 120),
    phone: clean(partial?.phone, DEFAULT_CONTACT_DETAILS.phone, 40),
    address: clean(partial?.address, DEFAULT_CONTACT_DETAILS.address, 160),
    supportHours: clean(partial?.supportHours, DEFAULT_CONTACT_DETAILS.supportHours, 80),
  };
}

export function extractGroundingSources(
  chunks: unknown
): { title: string; uri: string }[] {
  if (!Array.isArray(chunks)) return [];
  const seen = new Set<string>();
  const sources: { title: string; uri: string }[] = [];

  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== 'object') continue;
    const web = (chunk as { web?: { uri?: unknown; title?: unknown } }).web;
    if (!web || typeof web.uri !== 'string') continue;
    const uri = web.uri.trim();
    if (!/^https?:\/\//i.test(uri)) continue;
    if (seen.has(uri)) continue;
    seen.add(uri);

    let fallbackTitle = uri;
    try {
      fallbackTitle = new URL(uri).hostname.replace(/^www\./, '');
    } catch {
      // Keep original uri if URL parsing fails
    }

    const title =
      typeof web.title === 'string' && web.title.trim().length > 0
        ? web.title.trim().slice(0, 120)
        : fallbackTitle;

    sources.push({ title, uri });
    if (sources.length >= 6) break;
  }

  return sources;
}

export const HUB_COORDINATES: Record<string, { lat: number; lng: number }> = {
  khanna_ludhiana: { lat: 30.7046, lng: 76.2222 },
  lasalgaon_nashik: { lat: 20.1462, lng: 74.2286 },
  ichhawar_sehore: { lat: 23.0216, lng: 77.0149 },
  pindra_varanasi: { lat: 25.448, lng: 82.7712 },
  tenali_guntur: { lat: 16.2428, lng: 80.64 },
  borsad_anand: { lat: 22.4086, lng: 72.898 },
};

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function findNearestWeatherHub(
  lat: number,
  lng: number,
  locations: LocationWeather[]
): { hubId: string; distanceKm: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || locations.length === 0) {
    return null;
  }
  let bestId = locations[0].id;
  let bestDist = Infinity;
  for (const loc of locations) {
    const coords = HUB_COORDINATES[loc.id];
    if (!coords) continue;
    const dist = haversineDistanceKm(lat, lng, coords.lat, coords.lng);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = loc.id;
    }
  }
  return {
    hubId: bestId,
    distanceKm: Number.isFinite(bestDist) ? bestDist : 0,
  };
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}



