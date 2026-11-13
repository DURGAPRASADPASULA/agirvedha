import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotal,
  DEFAULT_CONTACT_DETAILS,
  enrichMandiPrice,
  extractGroundingSources,
  filterMandiPrices,
  filterMarketplaceListings,
  findNearestWeatherHub,
  formatCoordinates,
  formatINR,
  haversineDistanceKm,
  normalizeContactDetails,
  recommendCrops,
  searchCropDiseases,
  searchWeatherLocations,
  simulateCropVisionDiagnosis,
} from './agriLogic';
import {
  AI_VISION_DIAGNOSES,
  CROP_CATALOG,
  CROP_DISEASES,
  INITIAL_MARKETPLACE_LISTINGS,
  LOCATION_WEATHER_DATA,
  MANDI_PRICES_DATA,
} from '../data/agriData';
import { tText } from '../i18n/regionalTranslations';

test('formatINR formats Indian Rupee figures cleanly', () => {
  assert.equal(formatINR(2450), '₹2,450');
  assert.equal(formatINR(24.5), '₹24.50');
  assert.equal(formatINR(125000), '₹1,25,000');
});

test('recommendCrops prioritizes Wheat and Mustard for Indo-Gangetic Alluvial Rabi cool conditions', () => {
  const results = recommendCrops(CROP_CATALOG, {
    regionId: 'indo_gangetic',
    soilType: 'alluvial',
    season: 'Rabi',
    expectedRainfall: 'low',
    temperatureBand: 'cool',
  });

  assert.ok(results.length >= 2, 'Expected at least 2 crops for Rabi Alluvial Plains');
  const topNames = results.slice(0, 3).map((c) => c.id);
  assert.ok(topNames.includes('wheat_hd2967'), 'Wheat should rank near the top');
  assert.ok(topNames.includes('mustard_rh749'), 'Mustard should rank near the top');
  assert.ok(results[0].matchScore >= results[1].matchScore, 'Results must be sorted descending');
});

test('recommendCrops matches Cotton and Soybean for Deccan Black Soil Kharif', () => {
  const results = recommendCrops(CROP_CATALOG, {
    regionId: 'deccan_plateau',
    soilType: 'black',
    season: 'Kharif',
    expectedRainfall: 'moderate',
    temperatureBand: 'warm',
  });

  const ids = results.map((r) => r.id);
  assert.ok(ids.includes('cotton_bt'), 'Cotton should be recommended for Deccan black soil');
  assert.ok(ids.includes('soybean_js9560'), 'Soybean should be recommended for Deccan black soil');
});

test('enrichMandiPrice computes per-kg rate and daily delta accurately', () => {
  const sample = enrichMandiPrice({
    id: 'test-1',
    cropName: { en: 'Onion', hi: 'प्याज' },
    variety: { en: 'Red', hi: 'लाल' },
    category: 'vegetables',
    state: { en: 'Maharashtra', hi: 'महाराष्ट्र' },
    district: { en: 'Nashik', hi: 'नासिक' },
    mandiName: { en: 'Lasalgaon APMC', hi: 'लासलगांव मंडी' },
    pricePerQuintal: 2650,
    previousPricePerQuintal: 2500,
    minPricePerQuintal: 2400,
    maxPricePerQuintal: 2800,
    arrivalsTonnes: 420,
    updatedTime: '09:30 AM',
  });

  assert.equal(sample.pricePerKg, 26.5);
  assert.equal(sample.deltaQuintal, 150);
  assert.equal(sample.deltaPercent, 6);
  assert.equal(sample.trend, 'up');
});

test('filterMandiPrices filters by state, category, and bilingual query', () => {
  const mhOnions = filterMandiPrices(MANDI_PRICES_DATA, {
    state: 'Maharashtra',
    category: 'vegetables',
    query: 'प्याज',
  });
  assert.ok(mhOnions.length >= 1, 'Hindi query for Onion should match Maharashtra vegetable entries');
  assert.ok(mhOnions.every((row) => row.state.en === 'Maharashtra'));
});

test('searchCropDiseases filters by crop and symptom category', () => {
  const yellowWheat = searchCropDiseases(CROP_DISEASES, 'Wheat', 'yellow_leaves', '');
  assert.ok(yellowWheat.length >= 1);
  assert.ok(yellowWheat.every((d) => d.cropName.en === 'Wheat' && d.symptomCategory === 'yellow_leaves'));

  const neemMatches = searchCropDiseases(CROP_DISEASES, 'all', 'all', 'Neem');
  assert.ok(neemMatches.length >= 2, 'Should find entries recommending Neem oil');
});

test('searchWeatherLocations matches district and village names in English and Hindi', () => {
  const nashik = searchWeatherLocations(LOCATION_WEATHER_DATA, 'Lasalgaon');
  assert.equal(nashik.length, 1);
  assert.equal(nashik[0].district.en, 'Nashik');

  const ludhianaHi = searchWeatherLocations(LOCATION_WEATHER_DATA, 'लुधियाना');
  assert.equal(ludhianaHi.length, 1);
  assert.equal(ludhianaHi[0].district.en, 'Ludhiana');
});

test('filterMarketplaceListings and calculateCartTotal compute accurate produce totals', () => {
  const vegs = filterMarketplaceListings(INITIAL_MARKETPLACE_LISTINGS, 'vegetables', 'Onion');
  assert.equal(vegs.length, 1);
  assert.equal(vegs[0].pricePerKg, 30);

  const totals = calculateCartTotal([
    { listing: INITIAL_MARKETPLACE_LISTINGS[0], quantityKg: 5 },
    { listing: INITIAL_MARKETPLACE_LISTINGS[1], quantityKg: 3 },
  ]);
  assert.equal(totals.totalItemsKg, 8);
  assert.equal(totals.totalInr, 5 * 30 + 3 * 26);
});

test('simulateCropVisionDiagnosis identifies blight, aphids, and rust reliably', () => {
  const blight = simulateCropVisionDiagnosis(AI_VISION_DIAGNOSES, 'tomato_leaf_blight.jpg');
  assert.equal(blight.conditionName.en, 'Early & Late Leaf Blight');

  const aphids = simulateCropVisionDiagnosis(AI_VISION_DIAGNOSES, 'mustard_aphid_pest.jpg');
  assert.equal(aphids.conditionName.en, 'Aphid & Sap-Sucking Pest Infestation');

  const rust = simulateCropVisionDiagnosis(AI_VISION_DIAGNOSES, 'wheat_yellow_rust.jpg');
  assert.equal(rust.conditionName.en, 'Yellow Rust / Early Chlorosis');
});

test('tText resolves direct, glossary, Devanagari, and English fallbacks across 16 languages', () => {
  assert.equal(tText({ en: 'Wheat', hi: 'गेहूँ' }, 'ta'), 'கோதுமை');
  assert.equal(tText({ en: 'Wheat', hi: 'गेहूँ' }, 'ur'), 'گندم');
  assert.equal(tText({ en: 'Custom Grain', hi: 'विशेष अनाज' }, 'mr'), 'विशेष अनाज');
  assert.equal(tText({ en: 'Custom Grain', hi: 'विशेष अनाज' }, 'bn'), 'Custom Grain');
});

test('normalizeContactDetails preserves defaults and trims user overrides safely', () => {
  const def = normalizeContactDetails();
  assert.equal(def.email, 'agrivedha.ac@gmail.com');
  assert.equal(def.email, DEFAULT_CONTACT_DETAILS.email);
  assert.equal(def.phone, '1800-180-1551');

  const updated = normalizeContactDetails({
    contactName: '  Durga Prasad  ',
    phone: ' +91-9876543210 ',
    email: '   ',
  });
  assert.equal(updated.contactName, 'Durga Prasad');
  assert.equal(updated.phone, '+91-9876543210');
  assert.equal(updated.email, DEFAULT_CONTACT_DETAILS.email);
});

test('extractGroundingSources filters invalid URIs and deduplicates web chunks', () => {
  const parsed = extractGroundingSources([
    { web: { uri: 'https://agmarknet.gov.in/PriceAndArrivals', title: 'Agmarknet Rates' } },
    { web: { uri: 'https://agmarknet.gov.in/PriceAndArrivals', title: 'Duplicate' } },
    { web: { uri: 'javascript:alert(1)', title: 'Bad Link' } },
    { web: { uri: 'https://farmer.gov.in/schemes' } },
  ]);

  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].title, 'Agmarknet Rates');
  assert.equal(parsed[1].title, 'farmer.gov.in');
});

test('findNearestWeatherHub and haversineDistanceKm identify closest farming district accurately', () => {
  const zeroDist = haversineDistanceKm(20.1462, 74.2286, 20.1462, 74.2286);
  assert.equal(zeroDist, 0);

  // Coordinates near Nashik / Pune should match lasalgaon_nashik
  const nearestMh = findNearestWeatherHub(19.9975, 73.7898, LOCATION_WEATHER_DATA);
  assert.ok(nearestMh);
  assert.equal(nearestMh.hubId, 'lasalgaon_nashik');
  assert.ok(nearestMh.distanceKm < 60);

  // Coordinates near Vijayawada / Guntur should match tenali_guntur
  const nearestAp = findNearestWeatherHub(16.3067, 80.4365, LOCATION_WEATHER_DATA);
  assert.ok(nearestAp);
  assert.equal(nearestAp.hubId, 'tenali_guntur');

  assert.equal(formatCoordinates(16.3067, 80.4365), '16.3067° N, 80.4365° E');
});


