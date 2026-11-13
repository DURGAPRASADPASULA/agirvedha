export type Language =
  | 'en'
  | 'hi'
  | 'mr'
  | 'pa'
  | 'gu'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'or'
  | 'as'
  | 'ur'
  | 'bho'
  | 'ne'
  | 'sa';

export type NavSection =
  | 'home'
  | 'weather'
  | 'planner'
  | 'marketplace'
  | 'mandi'
  | 'doctor'
  | 'workspace';

export type AgroSeason = 'Kharif' | 'Rabi' | 'Zaid';

export type SoilType = 'alluvial' | 'black' | 'red' | 'sandy';

export type RainfallLevel = 'low' | 'moderate' | 'high';

export type TemperatureBand = 'cool' | 'mild' | 'warm';

export type CropCategory = 'grains' | 'vegetables' | 'fruits' | 'pulses';

export type SymptomCategory = 'yellow_leaves' | 'pests' | 'fungal_spots' | 'root_rot';

export interface LocalizedText {
  en: string;
  hi: string;
  [lang: string]: string | undefined;
}

export interface DailyForecast {
  day: LocalizedText;
  dateLabel: string;
  condition: LocalizedText;
  icon: 'sun' | 'partly_cloudy' | 'rain' | 'cloud' | 'storm';
  tempMaxC: number;
  tempMinC: number;
  humidityPct: number;
  rainProbPct: number;
  windKmh: number;
}

export interface MonthlyOutlook {
  month: LocalizedText;
  seasonPhase: AgroSeason;
  avgTempMinC: number;
  avgTempMaxC: number;
  expectedRainfallMm: number;
  rainfallTier: RainfallLevel;
  fieldNote: LocalizedText;
}

export interface LocationWeather {
  id: string;
  villageOrTown: LocalizedText;
  district: LocalizedText;
  state: LocalizedText;
  regionId: string;
  updatedAt: string;
  current: {
    tempC: number;
    feelsLikeC: number;
    humidityPct: number;
    rainProbPct: number;
    windKmh: number;
    windDirection: string;
    condition: LocalizedText;
    icon: 'sun' | 'partly_cloudy' | 'rain' | 'cloud' | 'storm';
  };
  sevenDay: DailyForecast[];
  fourMonthOutlook: MonthlyOutlook[];
  seasonalShiftSummary: LocalizedText;
}

export interface AgroRegion {
  id: string;
  name: LocalizedText;
  statesCovered: LocalizedText;
}

export interface CropCatalogItem {
  id: string;
  name: LocalizedText;
  localHindiAlias: string;
  category: CropCategory;
  compatibleRegions: string[];
  compatibleSoils: SoilType[];
  idealSeasons: AgroSeason[];
  idealRainfall: RainfallLevel[];
  idealTempBands: TemperatureBand[];
  harvestDaysMin: number;
  harvestDaysMax: number;
  waterNeed: 'Low' | 'Moderate' | 'High';
  expectedYieldPerAcre: LocalizedText;
  sowingTips: LocalizedText;
  fertilizerNote: LocalizedText;
}

export interface CropPlannerInput {
  regionId: string;
  soilType: SoilType;
  season: AgroSeason;
  expectedRainfall: RainfallLevel;
  temperatureBand: TemperatureBand;
}

export interface CropRecommendation extends CropCatalogItem {
  matchScore: number;
  fitSummary: LocalizedText;
}

export interface MandiPriceEntry {
  id: string;
  cropName: LocalizedText;
  variety: LocalizedText;
  category: CropCategory;
  state: LocalizedText;
  district: LocalizedText;
  mandiName: LocalizedText;
  pricePerQuintal: number;
  previousPricePerQuintal: number;
  minPricePerQuintal: number;
  maxPricePerQuintal: number;
  arrivalsTonnes: number;
  updatedTime: string;
}

export interface MandiPriceWithDelta extends MandiPriceEntry {
  pricePerKg: number;
  deltaQuintal: number;
  deltaPercent: number;
  trend: 'up' | 'down' | 'flat';
}

export interface CropDiseaseEntry {
  id: string;
  cropName: LocalizedText;
  diseaseName: LocalizedText;
  symptomCategory: SymptomCategory;
  severity: 'High' | 'Moderate';
  symptomsDescription: LocalizedText;
  recommendedTreatment: LocalizedText;
  treatmentType: 'Fungicide' | 'Insecticide' | 'Bactericide' | 'Soil Drench';
  organicAlternative: LocalizedText;
  dosagePerLitre: LocalizedText;
  applicationTiming: LocalizedText;
  safetyPrecautions: LocalizedText;
}

export interface MarketplaceListing {
  id: string;
  ownerId: string;
  farmerName: string;
  village: string;
  cropName: string;
  category: CropCategory;
  quantityValue: number;
  quantityUnit: 'kg' | 'quintal';
  pricePerKg: number;
  harvestDate: string;
  freshnessLabel: string;
  imageDataUrl: string;
  status: 'active' | 'sold_out';
  isDemo?: boolean;
}

export interface CartItem {
  listing: MarketplaceListing;
  quantityKg: number;
}

export interface MarketplaceOrderRecord {
  id: string;
  buyerId: string;
  buyerName: string;
  deliveryAddress: string;
  totalInr: number;
  itemSummary: string;
  status: 'confirmed' | 'dispatched';
  createdAtLabel: string;
}

export interface CropPlanRecord {
  id: string;
  ownerId: string;
  regionId: string;
  soilType: SoilType;
  season: AgroSeason;
  expectedRainfall: RainfallLevel;
  temperatureBand: TemperatureBand;
  topCropName: string;
  notes: string;
  createdAtLabel: string;
}

export interface CropScanDiagnosis {
  id: string;
  detectedCrop: LocalizedText;
  conditionName: LocalizedText;
  confidencePct: number;
  severity: 'High' | 'Moderate';
  instantSteps: LocalizedText[];
  recommendedRemedy: LocalizedText;
  organicOption: LocalizedText;
  dosage: LocalizedText;
  imagePreviewUrl?: string;
}

export interface CropScanLogRecord {
  id: string;
  ownerId: string;
  cropName: string;
  diagnosisName: string;
  confidencePct: number;
  treatmentSummary: string;
  createdAtLabel: string;
}

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetPreviewData {
  spreadsheetId: string;
  title: string;
  sheetTabs: string[];
  activeTab: string;
  rows: string[][];
}

export interface GmailMessageSummary {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

export interface CalendarEventSummary {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  htmlLink?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ContactDetails {
  contactName: string;
  email: string;
  phone: string;
  address: string;
  supportHours: string;
}

export type FaqCategory =
  | 'weather'
  | 'planner'
  | 'marketplace'
  | 'mandi'
  | 'doctor'
  | 'support';

export interface FaqEntry {
  id: string;
  category: FaqCategory;
  question: LocalizedText;
  answer: LocalizedText;
}

export interface SevenDayChartPoint {
  dayLabel: string;
  dateLabel: string;
  tempMaxC: number;
  tempMinC: number;
  rainProbPct: number;
}

