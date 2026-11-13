import {
  AI_VISION_DIAGNOSES,
  AGRO_REGIONS,
  CROP_CATALOG,
  CROP_DISEASES,
  INITIAL_MARKETPLACE_LISTINGS,
  LOCATION_WEATHER_DATA,
  MANDI_PRICES_DATA,
} from '../data/agriData';
import { simulateCropVisionDiagnosis } from '../utils/agriLogic';
import type {
  AgroRegion,
  CropCatalogItem,
  CropDiseaseEntry,
  CropScanDiagnosis,
  LocationWeather,
  MandiPriceEntry,
  MarketplaceListing,
} from '../types/agri';

/**
 * Service layer structured for seamless integration with live government,
 * meteorological, market, and vision AI APIs (e.g., IMD Mausam API, Agmarknet / e-NAM,
 * or a Gemini Vision /api/diagnose endpoint).
 */

const WEATHER_API_ENDPOINT = import.meta.env?.VITE_WEATHER_API_URL as string | undefined;
const MANDI_API_ENDPOINT = import.meta.env?.VITE_MANDI_API_URL as string | undefined;
const VISION_API_ENDPOINT = import.meta.env?.VITE_VISION_API_URL as string | undefined;

export async function fetchAllWeatherHubs(): Promise<LocationWeather[]> {
  if (WEATHER_API_ENDPOINT) {
    try {
      const response = await fetch(`${WEATHER_API_ENDPOINT}/hubs`);
      if (response.ok) {
        return (await response.json()) as LocationWeather[];
      }
    } catch {
      // Fallback to deterministic dataset if external endpoint is unreachable
    }
  }
  return LOCATION_WEATHER_DATA;
}

export async function fetchLiveMandiRates(): Promise<MandiPriceEntry[]> {
  if (MANDI_API_ENDPOINT) {
    try {
      const response = await fetch(`${MANDI_API_ENDPOINT}/rates/today`);
      if (response.ok) {
        return (await response.json()) as MandiPriceEntry[];
      }
    } catch {
      // Fallback to deterministic dataset if external endpoint is unreachable
    }
  }
  return MANDI_PRICES_DATA;
}

export async function fetchAgroRegions(): Promise<AgroRegion[]> {
  return AGRO_REGIONS;
}

export async function fetchCropCatalog(): Promise<CropCatalogItem[]> {
  return CROP_CATALOG;
}

export async function fetchCropDiseases(): Promise<CropDiseaseEntry[]> {
  return CROP_DISEASES;
}

export async function fetchInitialMarketplaceListings(): Promise<MarketplaceListing[]> {
  return INITIAL_MARKETPLACE_LISTINGS;
}

export async function analyzeCropImage(
  imageDataUrl: string,
  hintText: string
): Promise<CropScanDiagnosis> {
  if (VISION_API_ENDPOINT) {
    try {
      const response = await fetch(`${VISION_API_ENDPOINT}/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl, hintText }),
      });
      if (response.ok) {
        return (await response.json()) as CropScanDiagnosis;
      }
    } catch {
      // Fall back to deterministic vision simulation
    }
  }

  return simulateCropVisionDiagnosis(AI_VISION_DIAGNOSES, hintText, imageDataUrl);
}
