import type { Language } from '../types/agri';
import {
  LANGUAGE_OPTIONS,
  REGIONAL_PACKS,
  tText,
  type RegionalLanguage,
  type RegionalPack,
} from './regionalTranslations';

export { LANGUAGE_OPTIONS, tText };

export interface UiCopyShape {
  brandName: string;
  languageToggleLabel: string;
  languageToggleAria: string;
  nav: {
    home: string;
    weather: string;
    planner: string;
    marketplace: string;
    mandi: string;
    doctor: string;
    workspace: string;
  };
  home: {
    heroKicker: string;
    heroTitle: string;
    heroSubtitle: string;
    primaryCta: string;
    secondaryCta: string;
    scanCta: string;
    quickStripTitle: string;
    kpiWeatherLabel: string;
    kpiSeasonLabel: string;
    kpiMarketplaceLabel: string;
    kpiMandiLabel: string;
    kpiDoctorLabel: string;
    sectionsHeading: string;
    sectionsSubheading: string;
    openSection: string;
    modules: {
      weatherTitle: string;
      weatherDesc: string;
      plannerTitle: string;
      plannerDesc: string;
      marketplaceTitle: string;
      marketplaceDesc: string;
      mandiTitle: string;
      mandiDesc: string;
      doctorTitle: string;
      doctorDesc: string;
      workspaceTitle: string;
      workspaceDesc: string;
    };
    advisoryTitle: string;
    advisorySubtitle: string;
  };
  weather: {
    heading: string;
    subheading: string;
    searchLabel: string;
    searchPlaceholder: string;
    quickLocations: string;
    noLocationMatch: string;
    resetLocation: string;
    currentConditions: string;
    feelsLike: string;
    humidity: string;
    rainChance: string;
    windSpeed: string;
    sevenDayHeading: string;
    fourMonthHeading: string;
    fourMonthSubheading: string;
    avgTemp: string;
    expectedRain: string;
    seasonPhase: string;
    seasonalShiftHeading: string;
    planWithForecastBtn: string;
    gps: {
      panelTitle: string;
      panelDesc: string;
      detectBtn: string;
      detectingLabel: string;
      startTrackingBtn: string;
      stopTrackingBtn: string;
      trackingActiveLabel: string;
      coordsLabel: string;
      accuracyLabel: string;
      nearestHubLabel: string;
      distanceMovedLabel: string;
      pointsLoggedLabel: string;
      syncNearestBtn: string;
      permissionHint: string;
      unsupportedError: string;
    };
  };
  planner: {
    heading: string;
    subheading: string;
    formHeading: string;
    regionLabel: string;
    soilLabel: string;
    seasonLabel: string;
    rainfallLabel: string;
    tempLabel: string;
    findCropsBtn: string;
    resetBtn: string;
    savePlanBtn: string;
    planSavedNote: string;
    addReminderBtn: string;
    resultsHeading: string;
    resultsCountSuffix: string;
    noMatchTitle: string;
    noMatchDesc: string;
    matchScoreLabel: string;
    harvestWindow: string;
    daysUnit: string;
    waterNeed: string;
    expectedYield: string;
    sowingTips: string;
    fertilizerNote: string;
    soils: {
      alluvial: string;
      black: string;
      red: string;
      sandy: string;
    };
    seasons: {
      Kharif: string;
      Rabi: string;
      Zaid: string;
    };
    rainfall: {
      low: string;
      moderate: string;
      high: string;
    };
    temp: {
      cool: string;
      mild: string;
      warm: string;
    };
    waterLevels: {
      Low: string;
      Moderate: string;
      High: string;
    };
  };
  mandi: {
    heading: string;
    subheading: string;
    searchLabel: string;
    searchPlaceholder: string;
    stateLabel: string;
    districtLabel: string;
    mandiLabel: string;
    categoryLabel: string;
    allStates: string;
    allDistricts: string;
    allMandis: string;
    allCategories: string;
    categories: {
      grains: string;
      vegetables: string;
      fruits: string;
      pulses: string;
    };
    colCrop: string;
    colMandi: string;
    colCategory: string;
    colQuintal: string;
    colKg: string;
    colChange: string;
    colArrivals: string;
    perQuintal: string;
    perKg: string;
    tonnesUnit: string;
    upLabel: string;
    downLabel: string;
    flatLabel: string;
    summaryGainers: string;
    summaryLosers: string;
    summaryUpdated: string;
    noResultsTitle: string;
    noResultsDesc: string;
    clearFilters: string;
    unitToggleQuintal: string;
    unitToggleKg: string;
    exportSheetsBtn: string;
    liveSearchHeading: string;
    liveSearchPlaceholder: string;
    liveSearchBtn: string;
    liveSearchingLabel: string;
    liveSearchSources: string;
  };
  marketplace: {
    heading: string;
    subheading: string;
    customerTab: string;
    farmerTab: string;
    cartBtn: string;
    searchLabel: string;
    searchPlaceholder: string;
    allCategories: string;
    farmerLabel: string;
    availableLabel: string;
    harvestedLabel: string;
    addToCartBtn: string;
    contactFarmerBtn: string;
    markSoldOutBtn: string;
    deleteListingBtn: string;
    noListingsTitle: string;
    noListingsDesc: string;
    sellFormHeading: string;
    sellFormSubheading: string;
    signInToPublishHint: string;
    cropNameLabel: string;
    cropNamePlaceholder: string;
    categoryLabel: string;
    quantityLabel: string;
    unitLabel: string;
    pricePerKgLabel: string;
    harvestDateLabel: string;
    farmerNameLabel: string;
    farmerNamePlaceholder: string;
    villageLabel: string;
    villagePlaceholder: string;
    freshnessLabel: string;
    freshnessPlaceholder: string;
    photoLabel: string;
    photoHint: string;
    publishBtn: string;
    publishingBtn: string;
    publishSuccess: string;
    cartTitle: string;
    cartEmpty: string;
    buyerNameLabel: string;
    deliveryAddressLabel: string;
    totalLabel: string;
    placeOrderBtn: string;
    orderConfirmedTitle: string;
    orderConfirmedDesc: string;
    contactModalTitle: string;
    contactRecipientLabel: string;
    contactMessageLabel: string;
    sendGmailInquiryBtn: string;
    sendLocalInquiryBtn: string;
  };
  doctor: {
    heading: string;
    subheading: string;
    scanBtnLabel: string;
    floatingScanLabel: string;
    scannerTitle: string;
    scannerSubtitle: string;
    startCameraBtn: string;
    captureFrameBtn: string;
    stopCameraBtn: string;
    uploadImageLabel: string;
    sampleTriggerHeading: string;
    symptomHintLabel: string;
    symptomHintPlaceholder: string;
    runDiagnosisBtn: string;
    analyzingLabel: string;
    diagnosisHeading: string;
    confidenceLabel: string;
    instantStepsLabel: string;
    saveScanBtn: string;
    exportDriveBtn: string;
    scheduleSprayBtn: string;
    searchLabel: string;
    searchPlaceholder: string;
    cropLabel: string;
    symptomLabel: string;
    allCrops: string;
    allSymptoms: string;
    symptoms: {
      yellow_leaves: string;
      pests: string;
      fungal_spots: string;
      root_rot: string;
    };
    severityHigh: string;
    severityModerate: string;
    symptomsObserved: string;
    chemicalControl: string;
    organicOption: string;
    dosage: string;
    timing: string;
    safetyPrecautions: string;
    noResultsTitle: string;
    noResultsDesc: string;
    clearFilters: string;
    askAiBtn: string;
    askAiAboutThisBtn: string;
  };
  chatbot: {
    launcherLabel: string;
    title: string;
    subtitle: string;
    contextPrefix: string;
    clearContext: string;
    welcomeTitle: string;
    welcomeDesc: string;
    inputPlaceholder: string;
    sendBtn: string;
    sendingLabel: string;
    newChatBtn: string;
    closeAria: string;
    retryBtn: string;
    quickPromptsHeading: string;
    quickPrompts: string[];
    searchGroundingLabel: string;
    sourcesHeading: string;
  };
  languageSwitch: {
    quickToggleAria: string;
    allLanguagesAria: string;
  };
  workspace: {
    heading: string;
    subheading: string;
    connectedAs: string;
    reconnectPrompt: string;
    reconnectBtn: string;
    signOutBtn: string;
    signInPrompt: string;
    driveTitle: string;
    driveDesc: string;
    driveSearchPlaceholder: string;
    driveSaveReportBtn: string;
    sheetsTitle: string;
    sheetsDesc: string;
    sheetsExportMandiBtn: string;
    sheetsIdPlaceholder: string;
    sheetsPreviewBtn: string;
    gmailTitle: string;
    gmailDesc: string;
    gmailRefreshBtn: string;
    gmailSendBtn: string;
    calendarTitle: string;
    calendarDesc: string;
    calendarCreateBtn: string;
    cloudHistoryTitle: string;
    savedPlansTab: string;
    ordersTab: string;
    scanLogsTab: string;
  };
  confirmModal: {
    cancel: string;
    confirm: string;
    processing: string;
  };
  footer: {
    tagline: string;
    helplineLabel: string;
    helplineNumber: string;
    dataNote: string;
    contactHeading: string;
    emailLabel: string;
    phoneLabel: string;
    addressLabel: string;
    hoursLabel: string;
    editContactBtn: string;
    contactModalTitle: string;
    contactModalDesc: string;
    contactNameLabel: string;
    saveContactBtn: string;
    resetContactBtn: string;
  };
}

const EN_COPY: UiCopyShape = {
  brandName: 'AgriVeda',
  languageToggleLabel: 'English',
  languageToggleAria: 'Select application language',
  nav: {
    home: 'Home',
    weather: 'Weather',
    planner: 'Crop Planner',
    marketplace: 'Marketplace',
    mandi: 'Mandi Prices',
    doctor: 'AI Crop Doctor',
    workspace: 'Workspace Sync',
  },
  home: {
    heroKicker: 'Indian Rural Advisory, Direct Marketplace & Mandi Intelligence',
    heroTitle:
      'Plan every season, sell harvests directly, and protect crops with AI leaf scanning.',
    heroSubtitle:
      'Built for Indian farmers, rural workers, and direct buyers. Track village weather and 4-month trends, match soil-fit crops, sell produce without middlemen, follow daily Mandi rates in ₹, and diagnose crop diseases.',
    primaryCta: 'Open Crop Planner',
    secondaryCta: 'Direct Marketplace',
    scanCta: 'Scan Crop with AI Camera',
    quickStripTitle: 'Today across Indian farming hubs',
    kpiWeatherLabel: 'Featured Village Weather',
    kpiSeasonLabel: 'Active 4-Month Window',
    kpiMarketplaceLabel: 'Direct Farm Listings',
    kpiMandiLabel: 'Top Mandi Mover',
    kpiDoctorLabel: 'AI & Guide Remedies',
    sectionsHeading: 'Tools for field planning, direct sales, and plant health',
    sectionsSubheading:
      'Choose a section below to check field weather, select crops, sell harvests directly, track Mandi prices, scan leaves, or sync with Google Workspace.',
    openSection: 'Open Tool',
    modules: {
      weatherTitle: 'Weather & 4-Month Outlook',
      weatherDesc:
        'Search your village or district for live rain chance, wind speed, 7-day outlook, and 4-month Kharif/Rabi/Zaid trends.',
      plannerTitle: 'Smart Crop Planner',
      plannerDesc:
        'Enter your region, soil type (alluvial, black, red, sandy), and 4-month forecast for sowing tips, harvest windows, and Calendar reminders.',
      marketplaceTitle: 'Farmer-to-Customer Direct Marketplace',
      marketplaceDesc:
        'Browse farm-fresh grains, vegetables, and fruits directly from village farmers or publish your harvest with photo, quantity, and ₹/kg rate.',
      mandiTitle: 'Live Mandi Market Prices',
      mandiDesc:
        'Track daily wholesale rates in ₹ per quintal and ₹ per kg across Indian APMCs with daily price trends and Google Sheets export.',
      doctorTitle: 'AI Camera Crop Doctor & Guide',
      doctorDesc:
        'Scan damaged leaves using your camera or photo upload for instant AI diagnosis, safe pesticide dosages, and organic alternatives.',
      workspaceTitle: 'Google Workspace & Cloud Sync',
      workspaceDesc:
        'Save farm reports to Google Drive, export Mandi sheets, email buyers via Gmail, and schedule sowing or spray tasks in Google Calendar.',
    },
    advisoryTitle: 'Seasonal Field Advisory',
    advisorySubtitle:
      'Practical weekly reminders aligned with current Indian monsoon transition and Rabi sowing windows.',
  },
  weather: {
    heading: 'Daily Weather & 4-Month Seasonal Forecast',
    subheading:
      'Search any featured Indian agricultural district or village to review today’s conditions, 7-day forecast, and 4-month planning outlook.',
    searchLabel: 'Search village or district',
    searchPlaceholder: 'Type village, district, or state (e.g. Nashik, Ludhiana, Sehore)...',
    quickLocations: 'Select Farming Hub',
    noLocationMatch: 'No matching district found in our directory.',
    resetLocation: 'Show All Hubs',
    currentConditions: 'Current Field Conditions',
    feelsLike: 'Feels like',
    humidity: 'Humidity',
    rainChance: 'Rain Probability',
    windSpeed: 'Wind Speed',
    sevenDayHeading: '7-Day Daily Weather Forecast',
    fourMonthHeading: '4-Month Seasonal Outlook',
    fourMonthSubheading:
      'Expected rainfall totals, temperature bands, and Kharif / Rabi / Zaid crop window shifts.',
    avgTemp: 'Avg Temp Range',
    expectedRain: 'Expected Rainfall',
    seasonPhase: 'Season Phase',
    seasonalShiftHeading: '4-Month Seasonal Shift Summary',
    planWithForecastBtn: 'Plan Crops Using This 4-Month Forecast',
    gps: {
      panelTitle: 'GPS Location & Live Field Tracking',
      panelDesc:
        'Detect your current field coordinates via device GPS or turn on live tracking to monitor field movement and auto-match the nearest farming hub.',
      detectBtn: 'Detect GPS Location',
      detectingLabel: 'Locating GPS...',
      startTrackingBtn: 'Start Live Tracking',
      stopTrackingBtn: 'Stop Live Tracking',
      trackingActiveLabel: 'Live GPS Tracking Active',
      coordsLabel: 'Current Coordinates',
      accuracyLabel: 'GPS Accuracy',
      nearestHubLabel: 'Nearest Weather Hub',
      distanceMovedLabel: 'Distance Tracked',
      pointsLoggedLabel: 'Track Updates',
      syncNearestBtn: 'Switch Forecast to Nearest Hub',
      permissionHint: 'Allow browser location permission when prompted to read real-time GPS.',
      unsupportedError: 'Device geolocation is unavailable or permission was denied.',
    },
  },
  planner: {
    heading: 'Smart Crop Recommendation Engine',
    subheading:
      'Match your agro-climatic region, soil type, and upcoming 4-month weather outlook to discover high-suitability crops.',
    formHeading: 'Your Farm & 4-Month Conditions',
    regionLabel: 'Agro-Climatic Region',
    soilLabel: 'Soil Type',
    seasonLabel: 'Upcoming 4-Month Season',
    rainfallLabel: 'Expected 4-Month Rainfall',
    tempLabel: 'Expected Temperature Band',
    findCropsBtn: 'Recommend Suitable Crops',
    resetBtn: 'Reset Defaults',
    savePlanBtn: 'Save Plan to Cloud',
    planSavedNote: 'Crop plan saved to your AgriVeda cloud history.',
    addReminderBtn: 'Add Sowing Reminder',
    resultsHeading: 'Recommended Crops for Your Field',
    resultsCountSuffix: 'crops matched',
    noMatchTitle: 'No exact match for this rare combination',
    noMatchDesc:
      'Try adjusting expected rainfall or temperature band to view hardy regional alternatives.',
    matchScoreLabel: 'Suitability',
    harvestWindow: 'Harvest Window',
    daysUnit: 'days',
    waterNeed: 'Water Requirement',
    expectedYield: 'Typical Yield',
    sowingTips: 'Sowing & Spacing Tips',
    fertilizerNote: 'Nutrient & Soil Tip',
    soils: {
      alluvial: 'Alluvial Soil (Do-mat / River Plains)',
      black: 'Black Cotton Soil (Regur)',
      red: 'Red Loamy Soil',
      sandy: 'Sandy / Arid Soil',
    },
    seasons: {
      Kharif: 'Kharif (Monsoon: Jun – Oct)',
      Rabi: 'Rabi (Winter: Nov – Mar)',
      Zaid: 'Zaid (Summer: Mar – Jun)',
    },
    rainfall: {
      low: 'Low Rainfall (< 250 mm)',
      moderate: 'Moderate Rainfall (250 – 650 mm)',
      high: 'High Rainfall (> 650 mm)',
    },
    temp: {
      cool: 'Cool (10°C – 24°C)',
      mild: 'Mild (20°C – 32°C)',
      warm: 'Warm (28°C – 40°C)',
    },
    waterLevels: {
      Low: 'Low',
      Moderate: 'Moderate',
      High: 'High',
    },
  },
  mandi: {
    heading: 'Daily Live Crop Prices (Mandi Rates)',
    subheading:
      'Wholesale modal prices across Indian APMCs in ₹ per quintal and ₹ per kg, compared against yesterday’s close.',
    searchLabel: 'Search crop or variety',
    searchPlaceholder: 'Search Wheat, Onion, Tomato, Chana, Cotton...',
    stateLabel: 'State',
    districtLabel: 'District',
    mandiLabel: 'Local Mandi',
    categoryLabel: 'Crop Category',
    allStates: 'All States',
    allDistricts: 'All Districts',
    allMandis: 'All Mandis',
    allCategories: 'All Categories',
    categories: {
      grains: 'Grains & Cereals',
      vegetables: 'Vegetables',
      fruits: 'Fruits',
      pulses: 'Pulses & Oilseeds',
    },
    colCrop: 'Crop & Variety',
    colMandi: 'Mandi / District',
    colCategory: 'Category',
    colQuintal: 'Rate (₹ / Quintal)',
    colKg: 'Rate (₹ / kg)',
    colChange: 'vs Yesterday',
    colArrivals: 'Arrivals',
    perQuintal: '/ quintal',
    perKg: '/ kg',
    tonnesUnit: 'MT',
    upLabel: 'Up',
    downLabel: 'Down',
    flatLabel: 'Steady',
    summaryGainers: 'Markets Rising Today',
    summaryLosers: 'Markets Softening',
    summaryUpdated: 'Latest Mandi Sync',
    noResultsTitle: 'No Mandi rates match your filters',
    noResultsDesc: 'Clear one or more location filters or search another crop name.',
    clearFilters: 'Clear All Filters',
    unitToggleQuintal: 'Show ₹ / Quintal',
    unitToggleKg: 'Show ₹ / kg',
    exportSheetsBtn: 'Export to Google Sheets',
    liveSearchHeading: 'Live Web MSP, Mandi & Scheme Check (Google Search)',
    liveSearchPlaceholder: 'e.g. Wheat MSP 2026-27 India, Lasalgaon onion price trend, PM-KISAN update...',
    liveSearchBtn: 'Search Live Web',
    liveSearchingLabel: 'Searching...',
    liveSearchSources: 'Verified Google Search Sources',
  },
  marketplace: {
    heading: 'Farmer-to-Customer Direct Marketplace',
    subheading:
      'Buy fresh vegetables, fruits, and grains directly from local farmers at fair prices, or list your own harvest without middlemen.',
    customerTab: 'Customer Marketplace',
    farmerTab: 'Sell Your Harvest (Farmer View)',
    cartBtn: 'Cart',
    searchLabel: 'Search produce, farmer, or village',
    searchPlaceholder: 'Search Sharbati wheat, tomatoes, Nashik onion, Ramesh...',
    allCategories: 'All Produce',
    farmerLabel: 'Farmer',
    availableLabel: 'Available',
    harvestedLabel: 'Harvested',
    addToCartBtn: 'Add to Cart',
    contactFarmerBtn: 'Contact Farmer',
    markSoldOutBtn: 'Mark Sold Out',
    deleteListingBtn: 'Remove',
    noListingsTitle: 'No fresh harvest listings match your filter',
    noListingsDesc: 'Try switching category or clearing your search query.',
    sellFormHeading: 'Sell Your Harvest Directly',
    sellFormSubheading:
      'Enter crop details, upload a photo, and publish directly to buyers in your region.',
    signInToPublishHint:
      'Sign in with Google to publish live listings to the shared marketplace and manage your stock.',
    cropNameLabel: 'Crop / Produce Name',
    cropNamePlaceholder: 'e.g. Organic Desi Tomatoes',
    categoryLabel: 'Category',
    quantityLabel: 'Quantity Available',
    unitLabel: 'Unit',
    pricePerKgLabel: 'Price per kg (₹)',
    harvestDateLabel: 'Harvest Date',
    farmerNameLabel: 'Farmer Name',
    farmerNamePlaceholder: 'e.g. Ramesh Kulkarni',
    villageLabel: 'Village / Farm Location',
    villagePlaceholder: 'e.g. Niphad, Nashik (Maharashtra)',
    freshnessLabel: 'Freshness / Quality Note',
    freshnessPlaceholder: 'e.g. Harvested This Morning · Zero Chemical Wash',
    photoLabel: 'Upload Harvest Photo',
    photoHint: 'Optional — automatically compressed for fast rural network upload.',
    publishBtn: 'Publish Harvest Listing',
    publishingBtn: 'Publishing...',
    publishSuccess: 'Your harvest listing is now live on the Direct Marketplace.',
    cartTitle: 'Direct Farm Basket',
    cartEmpty: 'Your basket is empty. Add fresh produce from any farmer card.',
    buyerNameLabel: 'Your Name',
    deliveryAddressLabel: 'Delivery Village / City Address',
    totalLabel: 'Order Total',
    placeOrderBtn: 'Confirm Direct Order',
    orderConfirmedTitle: 'Order Confirmed',
    orderConfirmedDesc: 'Your direct farm order has been logged for dispatch coordination.',
    contactModalTitle: 'Contact Farmer Directly',
    contactRecipientLabel: 'Recipient Email (Farmer / Co-op Contact)',
    contactMessageLabel: 'Order Inquiry Message',
    sendGmailInquiryBtn: 'Send via Gmail',
    sendLocalInquiryBtn: 'Log Direct Inquiry',
  },
  doctor: {
    heading: 'AI Camera Crop Doctor & Pesticide Guide',
    subheading:
      'Scan damaged leaves with your camera or upload a photo for instant AI diagnosis, or browse our searchable guide for safe dosages and organic remedies.',
    scanBtnLabel: 'Scan Crop with AI Camera',
    floatingScanLabel: 'AI Crop Scan',
    scannerTitle: 'AI Leaf & Pest Scanner',
    scannerSubtitle:
      'Capture a photo with your camera, upload from gallery, or test a sample leaf to inspect AI disease detection and safe treatment steps.',
    startCameraBtn: 'Open Live Camera',
    captureFrameBtn: 'Capture Photo',
    stopCameraBtn: 'Close Camera',
    uploadImageLabel: 'Upload Leaf Photo',
    sampleTriggerHeading: 'Or test with a field sample:',
    symptomHintLabel: 'Optional symptom hint (crop or spots noticed)',
    symptomHintPlaceholder: 'e.g. tomato blight spots, mustard aphids, yellow wheat stripes...',
    runDiagnosisBtn: 'Analyze Crop Photo',
    analyzingLabel: 'Scanning leaf patterns...',
    diagnosisHeading: 'AI Vision Diagnosis Result',
    confidenceLabel: 'AI Confidence',
    instantStepsLabel: 'Immediate Field Action Steps',
    saveScanBtn: 'Save Scan to Cloud',
    exportDriveBtn: 'Save Report to Drive',
    scheduleSprayBtn: 'Schedule Spray Reminder',
    searchLabel: 'Search disease, crop, or treatment',
    searchPlaceholder: 'Search rust, blight, aphids, neem oil, wilt...',
    cropLabel: 'Select Crop',
    symptomLabel: 'Observed Symptom',
    allCrops: 'All Crops',
    allSymptoms: 'All Symptoms',
    symptoms: {
      yellow_leaves: 'Yellow Leaves',
      pests: 'Pests & Insects',
      fungal_spots: 'Fungal Spots / Blight',
      root_rot: 'Root Rot & Wilt',
    },
    severityHigh: 'High Priority',
    severityModerate: 'Moderate Risk',
    symptomsObserved: 'Symptoms on Field',
    chemicalControl: 'Recommended Treatment',
    organicOption: 'Organic / Natural Alternative',
    dosage: 'Safe Dosage',
    timing: 'Application Timing',
    safetyPrecautions: 'Safety Precautions',
    noResultsTitle: 'No matching disease record found',
    noResultsDesc: 'Try switching to "All Crops" or clearing the search box.',
    clearFilters: 'Show All Guides',
    askAiBtn: 'Ask AI Chatbot',
    askAiAboutThisBtn: 'Ask AI about this problem',
  },
  chatbot: {
    launcherLabel: 'Ask AI',
    title: 'AgriVeda AI Sahayak',
    subtitle: 'Ask any crop disease, pest, fertilizer, or weather problem',
    contextPrefix: 'Focused on',
    clearContext: 'Clear',
    welcomeTitle: 'Hello! I am AgriVeda AI Sahayak',
    welcomeDesc:
      'Ask about yellow leaves, pests, fungal spots, pesticide dosage, organic sprays, soil prep, or Mandi timing in your preferred language.',
    inputPlaceholder: 'Ask your farming or crop problem here...',
    sendBtn: 'Send',
    sendingLabel: 'Thinking...',
    newChatBtn: 'New Chat',
    closeAria: 'Close AI chatbot',
    retryBtn: 'Retry',
    quickPromptsHeading: 'Common farmer questions:',
    quickPrompts: [
      'My tomato leaves have dark spots and are yellowing. What should I spray?',
      'How to control aphids on mustard crop organically?',
      'What is the safe dosage for yellow rust on wheat?',
      'What is the latest MSP for wheat and chana in India?',
    ],
    searchGroundingLabel: 'Live Google Search',
    sourcesHeading: 'Web Sources',
  },
  languageSwitch: {
    quickToggleAria: 'Toggle between English and Indian language',
    allLanguagesAria: 'Choose from 16 Indian languages',
  },
  workspace: {
    heading: 'Google Workspace & Farm Cloud Sync',
    subheading:
      'Connect your Google account to save farm advisory files in Drive, export Mandi sheets, coordinate buyers in Gmail, and schedule reminders in Calendar.',
    connectedAs: 'Connected account',
    reconnectPrompt:
      'Your session is signed in, but Google Workspace APIs require a fresh authorization grant after page reload.',
    reconnectBtn: 'Reconnect Google Workspace',
    signOutBtn: 'Sign Out',
    signInPrompt:
      'Sign in with Google to unlock live Google Drive, Sheets, Gmail, Calendar, and personal Firestore cloud history.',
    driveTitle: 'Google Drive Reports',
    driveDesc: 'Search your Drive files, upload a crop advisory report, or manage saved notes.',
    driveSearchPlaceholder: 'Search Drive file name...',
    driveSaveReportBtn: 'Save Farm Advisory Report to Drive',
    sheetsTitle: 'Google Sheets Mandi & Stock Sync',
    sheetsDesc: 'Export today’s Mandi rates to a new Google Sheet or preview an existing spreadsheet ID.',
    sheetsExportMandiBtn: 'Create Mandi Rates Spreadsheet',
    sheetsIdPlaceholder: 'Paste Google Spreadsheet ID to preview...',
    sheetsPreviewBtn: 'Load Sheet Preview',
    gmailTitle: 'Gmail Buyer & Co-op Inbox',
    gmailDesc: 'View recent messages and send produce dispatch or advisory emails with confirmation.',
    gmailRefreshBtn: 'Refresh Inbox',
    gmailSendBtn: 'Compose & Send Email',
    calendarTitle: 'Google Calendar Farm Schedule',
    calendarDesc: 'Review upcoming field tasks and schedule sowing, irrigation, or spray reminders.',
    calendarCreateBtn: 'Schedule Farm Task',
    cloudHistoryTitle: 'Your AgriVeda Cloud Records (Firestore)',
    savedPlansTab: 'Saved Crop Plans',
    ordersTab: 'Marketplace Orders',
    scanLogsTab: 'AI Scan Logs',
  },
  confirmModal: {
    cancel: 'Cancel',
    confirm: 'Confirm & Proceed',
    processing: 'Working...',
  },
  footer: {
    tagline:
      'AgriVeda — Practical weather, crop planning, direct farm sales, Mandi pricing, and AI plant health support for rural India.',
    helplineLabel: 'Kisan Call Centre (Toll-Free)',
    helplineNumber: '1800-180-1551',
    dataNote:
      'Integrated with Firebase Cloud Firestore, Gemini Search Grounding & Google Workspace (Drive, Sheets, Gmail, Calendar).',
    contactHeading: 'Contact & Farmer Helpdesk',
    emailLabel: 'Support Email',
    phoneLabel: 'Phone / Helpline',
    addressLabel: 'Office / Kendra Address',
    hoursLabel: 'Support Hours',
    editContactBtn: 'Edit Contact Details',
    contactModalTitle: 'AgriVeda Contact Details',
    contactModalDesc:
      'Update the contact details shown on your AgriVeda footer and pre-filled in direct farmer inquiries.',
    contactNameLabel: 'Desk / Contact Name',
    saveContactBtn: 'Save Contact Details',
    resetContactBtn: 'Reset Defaults',
  },
};

const HI_COPY: UiCopyShape = {
  brandName: 'AgriVeda · एग्रीवेदा',
  languageToggleLabel: 'हिन्दी',
  languageToggleAria: 'भाषा चुनें',
  nav: {
    home: 'होम',
    weather: 'मौसम',
    planner: 'फसल योजना',
    marketplace: 'सीधा बाज़ार',
    mandi: 'मंडी भाव',
    doctor: 'AI फसल डॉक्टर',
    workspace: 'वर्कस्पेस सिंक',
  },
  home: {
    heroKicker: 'भारतीय कृषि सलाह, सीधा किसान बाज़ार व मंडी जानकारी केंद्र',
    heroTitle:
      'सटीक मौसम से खेती की योजना बनाएं, बिना बिचौलिए फसल बेचें और AI कैमरे से रोग पहचानें।',
    heroSubtitle:
      'भारतीय किसानों, ग्रामीण कामगारों और सीधे खरीदारों के लिए सरल मंच। 7-दिन व 4-माह मौसम देखें, मिट्टी के अनुसार फसल चुनें, सीधे उपज बेचें, ₹ में मंडी भाव जानें और पत्ती स्कैन से रोग उपचार पाएं।',
    primaryCta: 'फसल योजना शुरू करें',
    secondaryCta: 'सीधा किसान बाज़ार',
    scanCta: 'AI कैमरे से फसल स्कैन करें',
    quickStripTitle: 'प्रमुख भारतीय कृषि केंद्रों की आज की स्थिति',
    kpiWeatherLabel: 'प्रमुख गाँव का मौसम',
    kpiSeasonLabel: 'आगामी 4-माह सीजन',
    kpiMarketplaceLabel: 'सीधे खेत से उपलब्ध उपज',
    kpiMandiLabel: 'मंडी भाव में सबसे तेज़ बढ़त',
    kpiDoctorLabel: 'AI व फसल डॉक्टर उपचार',
    sectionsHeading: 'खेती, सीधी बिक्री और फसल सुरक्षा के संपूर्ण उपकरण',
    sectionsSubheading:
      'खेत का मौसम जानने, फसल चुनने, उपज बेचने, मंडी भाव देखने, पत्ती स्कैन करने या Google Workspace से जुड़ने के लिए विकल्प चुनें।',
    openSection: 'खोलें',
    modules: {
      weatherTitle: 'मौसम व 4-माह का पूर्वानुमान',
      weatherDesc:
        'अपने गाँव या जिले का तापमान, नमी, बारिश की संभावना, 7-दिन और 4-माह का खरीफ/रबी/जायद पूर्वानुमान देखें।',
      plannerTitle: 'स्मार्ट फसल सलाहकार',
      plannerDesc:
        'अपना क्षेत्र, मिट्टी (जलोढ़, काली, लाल, रेतीली) और 4-माह का मौसम चुनकर बुवाई सुझाव, कटाई समय और कैलेंडर रिमाइंडर पाएं।',
      marketplaceTitle: 'किसान-से-ग्राहक सीधा बाज़ार',
      marketplaceDesc:
        'ताज़ी सब्ज़ियाँ, फल और अनाज सीधे किसानों से खरीदें या फोटो, मात्रा और ₹/किलो कीमत के साथ अपनी उपज बेचें।',
      mandiTitle: 'लाइव मंडी भाव (थोक बाजार)',
      mandiDesc:
        'अनाज, सब्ज़ियों, फलों और दालों के ₹ प्रति क्विंटल व ₹ प्रति किलो भाव कल की तुलना और Google Sheets निर्यात के साथ देखें।',
      doctorTitle: 'AI कैमरा फसल डॉक्टर व गाइड',
      doctorDesc:
        'कैमरे या फोटो अपलोड से क्षतिग्रस्त पत्ती की तुरंत AI जांच करें और सुरक्षित दवा मात्रा व जैविक उपाय जानें।',
      workspaceTitle: 'Google Workspace और क्लाउड सिंक',
      workspaceDesc:
        'रिपोर्ट Google Drive में सहेजें, मंडी भाव Sheets में भेजें, Gmail से खरीदारों को संदेश भेजें और Calendar में छिड़काव रिमाइंडर लगाएं।',
    },
    advisoryTitle: 'मौसमी खेती सलाह',
    advisorySubtitle:
      'मौजूदा रबी बुवाई और मानसून बदलाव के अनुसार उपयोगी साप्ताहिक कृषि सुझाव।',
  },
  weather: {
    heading: 'दैनिक मौसम व 4-माह का मौसमी पूर्वानुमान',
    subheading:
      'आज का मौसम, 7-दिन का पूर्वानुमान और 4-माह की खेती योजना देखने के लिए अपना गाँव या जिला चुनें।',
    searchLabel: 'गाँव या जिला खोजें',
    searchPlaceholder: 'गाँव, जिला या राज्य लिखें (जैसे नासिक, लुधियाना, सीहोर)...',
    quickLocations: 'प्रमुख कृषि केंद्र चुनें',
    noLocationMatch: 'खोज से मिलता कोई जिला नहीं मिला।',
    resetLocation: 'सभी केंद्र दिखाएं',
    currentConditions: 'खेत की वर्तमान स्थिति',
    feelsLike: 'महसूस तापमान',
    humidity: 'नमी (आर्द्रता)',
    rainChance: 'बारिश की संभावना',
    windSpeed: 'हवा की गति',
    sevenDayHeading: '7-दिन का दैनिक मौसम पूर्वानुमान',
    fourMonthHeading: '4-माह का मौसमी पूर्वानुमान',
    fourMonthSubheading:
      'अगले 4 महीनों में संभावित बारिश, औसत तापमान और खरीफ / रबी / जायद मौसम की दिशा।',
    avgTemp: 'औसत तापमान',
    expectedRain: 'अनुमानित बारिश',
    seasonPhase: 'फसल सीजन',
    seasonalShiftHeading: '4-माह के मौसमी बदलाव का सारांश',
    planWithForecastBtn: 'इस 4-माह मौसम के आधार पर फसल चुनें',
    gps: {
      panelTitle: 'GPS लोकेशन व लाइव लोकेशन ट्रैकिंग',
      panelDesc:
        'अपने खेत के सटीक GPS निर्देशांक प्राप्त करें या लाइव ट्रैकिंग चालू करके खेत की दूरी और नज़दीकी कृषि मौसम केंद्र स्वतः चुनें।',
      detectBtn: 'GPS लोकेशन पता करें',
      detectingLabel: 'GPS खोज रहे हैं...',
      startTrackingBtn: 'लाइव ट्रैकिंग शुरू करें',
      stopTrackingBtn: 'लाइव ट्रैकिंग रोकें',
      trackingActiveLabel: 'लाइव GPS ट्रैकिंग चालू है',
      coordsLabel: 'वर्तमान निर्देशांक',
      accuracyLabel: 'GPS सटीकता',
      nearestHubLabel: 'नज़दीकी मौसम केंद्र',
      distanceMovedLabel: 'तय दूरी',
      pointsLoggedLabel: 'ट्रैक अपडेट',
      syncNearestBtn: 'नज़दीकी केंद्र का मौसम देखें',
      permissionHint: 'रीयल-टाइम GPS पढ़ने के लिए कृपया ब्राउज़र में लोकेशन अनुमति दें।',
      unsupportedError: 'डिवाइस लोकेशन उपलब्ध नहीं है या अनुमति अस्वीकार की गई।',
    },
  },
  planner: {
    heading: 'स्मार्ट फसल अनुशंसा उपकरण',
    subheading:
      'अपने क्षेत्र, मिट्टी के प्रकार और अगले 4 महीनों के मौसम के अनुसार सबसे उपयुक्त और लाभकारी फसलें जानें।',
    formHeading: 'आपके खेत व 4-माह के मौसम की जानकारी',
    regionLabel: 'कृषि-जलवायु क्षेत्र',
    soilLabel: 'मिट्टी का प्रकार',
    seasonLabel: 'आगामी 4-माह का सीजन',
    rainfallLabel: 'अनुमानित 4-माह बारिश',
    tempLabel: 'अनुमानित तापमान स्तर',
    findCropsBtn: 'उपयुक्त फसलें देखें',
    resetBtn: 'रीसेट करें',
    savePlanBtn: 'योजना क्लाउड में सहेजें',
    planSavedNote: 'आपकी फसल योजना AgriVeda क्लाउड में सहेजी गई है।',
    addReminderBtn: 'बुवाई रिमाइंडर जोड़ें',
    resultsHeading: 'आपके खेत के लिए अनुशंसित फसलें',
    resultsCountSuffix: 'उपयुक्त फसलें मिलीं',
    noMatchTitle: 'इस विशेष संयोजन के लिए सटीक फसल नहीं मिली',
    noMatchDesc: 'वैकल्पिक फसलें देखने के लिए बारिश या तापमान स्तर में थोड़ा बदलाव करें।',
    matchScoreLabel: 'उपयुक्तता',
    harvestWindow: 'कटाई समय',
    daysUnit: 'दिन',
    waterNeed: 'सिंचाई आवश्यकता',
    expectedYield: 'औसत उपज',
    sowingTips: 'बुवाई व दूरी के सुझाव',
    fertilizerNote: 'पोषण व मिट्टी सलाह',
    soils: {
      alluvial: 'जलोढ़ मिट्टी (दोमट / मैदानी)',
      black: 'काली मिट्टी (रेगुर / कपास वाली)',
      red: 'लाल दोमट मिट्टी',
      sandy: 'रेतीली / बलुई मिट्टी',
    },
    seasons: {
      Kharif: 'खरीफ (मानसून: जून – अक्टूबर)',
      Rabi: 'रबी (सर्दी: नवंबर – मार्च)',
      Zaid: 'जायद (गर्मी: मार्च – जून)',
    },
    rainfall: {
      low: 'कम बारिश (< 250 मिमी)',
      moderate: 'मध्यम बारिश (250 – 650 मिमी)',
      high: 'अधिक बारिश (> 650 मिमी)',
    },
    temp: {
      cool: 'ठंडा (10°C – 24°C)',
      mild: 'सामान्य (20°C – 32°C)',
      warm: 'गर्म (28°C – 40°C)',
    },
    waterLevels: {
      Low: 'कम',
      Moderate: 'मध्यम',
      High: 'अधिक',
    },
  },
  mandi: {
    heading: 'दैनिक लाइव मंडी भाव (थोक बाजार)',
    subheading:
      'देश की प्रमुख मंडियों के ताज़ा थोक भाव ₹ प्रति क्विंटल और ₹ प्रति किलो में, कल के भाव से तुलना सहित।',
    searchLabel: 'फसल या किस्म खोजें',
    searchPlaceholder: 'गेहूँ, प्याज, टमाटर, चना, कपास खोजें...',
    stateLabel: 'राज्य',
    districtLabel: 'जिला',
    mandiLabel: 'स्थानीय मंडी',
    categoryLabel: 'फसल वर्ग',
    allStates: 'सभी राज्य',
    allDistricts: 'सभी जिले',
    allMandis: 'सभी मंडियाँ',
    allCategories: 'सभी वर्ग',
    categories: {
      grains: 'अनाज',
      vegetables: 'सब्ज़ियाँ',
      fruits: 'फल',
      pulses: 'दालें व तिलहन',
    },
    colCrop: 'फसल व किस्म',
    colMandi: 'मंडी / जिला',
    colCategory: 'वर्ग',
    colQuintal: 'भाव (₹ / क्विंटल)',
    colKg: 'भाव (₹ / किलो)',
    colChange: 'कल से बदलाव',
    colArrivals: 'आवक',
    perQuintal: '/ क्विंटल',
    perKg: '/ किलो',
    tonnesUnit: 'टन',
    upLabel: 'तेज़ी',
    downLabel: 'गिरावट',
    flatLabel: 'स्थिर',
    summaryGainers: 'आज बढ़त वाली फसलें',
    summaryLosers: 'आज नरमी वाली फसलें',
    summaryUpdated: 'अंतिम मंडी अपडेट',
    noResultsTitle: 'चयनित फ़िल्टर के लिए कोई मंडी भाव नहीं मिला',
    noResultsDesc: 'कृपया कोई फ़िल्टर हटाएं या दूसरी फसल का नाम खोजें।',
    clearFilters: 'सभी फ़िल्टर हटाएं',
    unitToggleQuintal: '₹ / क्विंटल दिखाएं',
    unitToggleKg: '₹ / किलो दिखाएं',
    exportSheetsBtn: 'Google Sheets में निर्यात करें',
    liveSearchHeading: 'लाइव वेब MSP, मंडी व योजना खोज (Google Search)',
    liveSearchPlaceholder: 'जैसे: गेहूँ MSP 2026-27 भारत, नासिक प्याज भाव, PM-KISAN अपडेट...',
    liveSearchBtn: 'लाइव खोजें',
    liveSearchingLabel: 'खोज जारी...',
    liveSearchSources: 'सत्यापित Google Search स्रोत',
  },
  marketplace: {
    heading: 'किसान-से-ग्राहक सीधा बाज़ार',
    subheading:
      'स्थानीय किसानों से बिना बिचौलिए ताज़ी सब्ज़ियाँ, फल व अनाज खरीदें, या अपनी कटी फसल सीधे बिक्री के लिए दर्ज करें।',
    customerTab: 'ग्राहक बाज़ार (खरीदें)',
    farmerTab: 'अपनी फसल बेचें (किसान)',
    cartBtn: 'टोकरी',
    searchLabel: 'फसल, किसान या गाँव खोजें',
    searchPlaceholder: 'शरबती गेहूँ, टमाटर, नासिक प्याज, रमेश खोजें...',
    allCategories: 'सभी उपज',
    farmerLabel: 'किसान',
    availableLabel: 'उपलब्ध',
    harvestedLabel: 'कटाई तिथि',
    addToCartBtn: 'टोकरी में जोड़ें',
    contactFarmerBtn: 'किसान से संपर्क करें',
    markSoldOutBtn: 'बिक चुका चिह्नित करें',
    deleteListingBtn: 'हटाएं',
    noListingsTitle: 'आपकी खोज के अनुसार कोई उपज नहीं मिली',
    noListingsDesc: 'कृपया श्रेणी बदलें या खोज बॉक्स साफ करें।',
    sellFormHeading: 'अपनी उपज सीधे बेचें',
    sellFormSubheading:
      'फसल का विवरण, मात्रा, ₹/किलो दाम और फोटो जोड़कर सीधे ग्राहकों तक पहुँचें।',
    signInToPublishHint:
      'अपनी उपज लाइव बाज़ार में प्रकाशित करने और स्टॉक प्रबंधन के लिए Google से साइन इन करें।',
    cropNameLabel: 'फसल / उपज का नाम',
    cropNamePlaceholder: 'जैसे: देसी जैविक टमाटर',
    categoryLabel: 'श्रेणी',
    quantityLabel: 'उपलब्ध मात्रा',
    unitLabel: 'इकाई',
    pricePerKgLabel: 'कीमत प्रति किलो (₹)',
    harvestDateLabel: 'कटाई की तारीख',
    farmerNameLabel: 'किसान का नाम',
    farmerNamePlaceholder: 'जैसे: रमेश कुलकर्णी',
    villageLabel: 'गाँव / खेत का स्थान',
    villagePlaceholder: 'जैसे: निफाड़, नासिक (महाराष्ट्र)',
    freshnessLabel: 'ताज़गी / गुणवत्ता विवरण',
    freshnessPlaceholder: 'जैसे: आज सुबह तोड़ा गया · रसायन मुक्त',
    photoLabel: 'फसल की फोटो अपलोड करें',
    photoHint: 'वैकल्पिक — ग्रामीण नेटवर्क पर तेज़ अपलोड के लिए स्वतः संपीड़ित होगी।',
    publishBtn: 'उपज सूची प्रकाशित करें',
    publishingBtn: 'प्रकाशित हो रहा है...',
    publishSuccess: 'आपकी फसल सूची अब सीधे बाज़ार में लाइव है।',
    cartTitle: 'सीधी खेत टोकरी',
    cartEmpty: 'आपकी टोकरी खाली है। किसी किसान कार्ड से ताज़ी उपज जोड़ें।',
    buyerNameLabel: 'आपका नाम',
    deliveryAddressLabel: 'डिलीवरी गाँव / शहर का पता',
    totalLabel: 'कुल राशि',
    placeOrderBtn: 'सीधा ऑर्डर पक्का करें',
    orderConfirmedTitle: 'ऑर्डर पक्का हुआ',
    orderConfirmedDesc: 'आपका सीधा खेत ऑर्डर प्रेषण के लिए दर्ज हो गया है।',
    contactModalTitle: 'किसान से सीधा संपर्क करें',
    contactRecipientLabel: 'प्राप्तकर्ता ईमेल (किसान / सहकारी संपर्क)',
    contactMessageLabel: 'खरीद पूछताछ संदेश',
    sendGmailInquiryBtn: 'Gmail से संदेश भेजें',
    sendLocalInquiryBtn: 'संदेश दर्ज करें',
  },
  doctor: {
    heading: 'AI कैमरा फसल डॉक्टर व कीटनाशक गाइड',
    subheading:
      'कैमरे से पत्ती स्कैन करें या फोटो अपलोड कर तुरंत AI रोग पहचान पाएं, या सुरक्षित दवा मात्रा और जैविक उपाय खोजें।',
    scanBtnLabel: 'AI कैमरे से फसल स्कैन करें',
    floatingScanLabel: 'AI फसल स्कैन',
    scannerTitle: 'AI पत्ती व कीट स्कैनर',
    scannerSubtitle:
      'लाइव कैमरे से फोटो लें, गैलरी से चुनें, या नमूना पत्ती परखकर AI रोग पहचान व त्वरित उपचार देखें।',
    startCameraBtn: 'लाइव कैमरा खोलें',
    captureFrameBtn: 'फोटो खींचें',
    stopCameraBtn: 'कैमरा बंद करें',
    uploadImageLabel: 'पत्ती की फोटो अपलोड करें',
    sampleTriggerHeading: 'या खेत के नमूने से परीक्षण करें:',
    symptomHintLabel: 'लक्षण संकेत (वैकल्पिक — फसल या धब्बे लिखें)',
    symptomHintPlaceholder: 'जैसे: टमाटर झुलसा धब्बे, सरसों माहू, गेहूँ पीला रतुआ...',
    runDiagnosisBtn: 'फोटो की AI जांच करें',
    analyzingLabel: 'पत्ती के लक्षणों की जांच जारी...',
    diagnosisHeading: 'AI विज़न जांच परिणाम',
    confidenceLabel: 'AI सटीकता',
    instantStepsLabel: 'तत्काल खेत में करने योग्य कदम',
    saveScanBtn: 'जांच लॉग सहेजें',
    exportDriveBtn: 'रिपोर्ट Drive में सहेजें',
    scheduleSprayBtn: 'छिड़काव रिमाइंडर लगाएं',
    searchLabel: 'रोग, फसल या दवा खोजें',
    searchPlaceholder: 'रतुआ, झुलसा, माहू, नीम तेल, उकठा खोजें...',
    cropLabel: 'फसल चुनें',
    symptomLabel: 'दिखने वाला लक्षण',
    allCrops: 'सभी फसलें',
    allSymptoms: 'सभी लक्षण',
    symptoms: {
      yellow_leaves: 'पीली पत्तियाँ',
      pests: 'कीट व सुंडी प्रकोप',
      fungal_spots: 'फफूंद धब्बे / झुलसा',
      root_rot: 'जड़ सड़न व उकठा रोग',
    },
    severityHigh: 'तुरंत ध्यान दें',
    severityModerate: 'मध्यम जोखिम',
    symptomsObserved: 'खेत में लक्षण',
    chemicalControl: 'अनुशंसित उपचार',
    organicOption: 'जैविक / देसी विकल्प',
    dosage: 'सुरक्षित मात्रा',
    timing: 'छिड़काव का सही समय',
    safetyPrecautions: 'किसान सुरक्षा सावधानियाँ',
    noResultsTitle: 'खोज के अनुसार कोई रोग जानकारी नहीं मिली',
    noResultsDesc: 'सभी फसलें चुनें या खोज शब्द बदलकर देखें।',
    clearFilters: 'सभी गाइड दिखाएं',
    askAiBtn: 'AI चैटबॉट से पूछें',
    askAiAboutThisBtn: 'इस समस्या पर AI से पूछें',
  },
  chatbot: {
    launcherLabel: 'AI से पूछें',
    title: 'AgriVeda AI सहायक',
    subtitle: 'फसल रोग, कीट, खाद मात्रा या मौसम की कोई भी समस्या पूछें',
    contextPrefix: 'विषय',
    clearContext: 'हटाएं',
    welcomeTitle: 'नमस्ते! मैं AgriVeda AI सहायक हूँ',
    welcomeDesc:
      'पीली पत्तियाँ, कीट प्रकोप, फफूंद धब्बे, सुरक्षित दवा मात्रा, जैविक छिड़काव या मंडी समय के बारे में अपनी भाषा में पूछें।',
    inputPlaceholder: 'अपनी फसल या खेती की समस्या यहाँ लिखें...',
    sendBtn: 'भेजें',
    sendingLabel: 'सलाह तैयार हो रही है...',
    newChatBtn: 'नई बातचीत',
    closeAria: 'AI चैटबॉट बंद करें',
    retryBtn: 'पुनः प्रयास करें',
    quickPromptsHeading: 'किसानों के प्रमुख प्रश्न:',
    quickPrompts: [
      'टमाटर की पत्तियों पर काले धब्बे और पीलापन है, कौन सी दवा छिड़कें?',
      'सरसों की फसल में माहू कीट का जैविक नियंत्रण कैसे करें?',
      'गेहूँ में पीला रतुआ रोग की सुरक्षित दवा और मात्रा क्या है?',
      'भारत में गेहूँ और चने का ताज़ा MSP क्या है?',
    ],
    searchGroundingLabel: 'लाइव Google Search',
    sourcesHeading: 'वेब स्रोत',
  },
  languageSwitch: {
    quickToggleAria: 'अंग्रेज़ी और भारतीय भाषा के बीच तुरंत बदलें',
    allLanguagesAria: '16 भारतीय भाषाओं में से चुनें',
  },
  workspace: {
    heading: 'Google Workspace और क्लाउड सिंक',
    subheading:
      'अपनी खेती रिपोर्ट Drive में सहेजने, मंडी भाव Sheets में निर्यात करने, Gmail से संपर्क करने और Calendar में कार्य तय करने के लिए Google से जुड़ें।',
    connectedAs: 'जुड़ा हुआ खाता',
    reconnectPrompt:
      'आपका खाता साइन इन है, लेकिन पेज रीलोड के बाद Google Workspace APIs के लिए पुनः अनुमति आवश्यक है।',
    reconnectBtn: 'Google Workspace पुनः जोड़ें',
    signOutBtn: 'साइन आउट',
    signInPrompt:
      'लाइव Google Drive, Sheets, Gmail, Calendar और क्लाउड रिकॉर्ड उपयोग करने के लिए Google से साइन इन करें।',
    driveTitle: 'Google Drive रिपोर्ट',
    driveDesc: 'Drive फाइलें खोजें, कृषि सलाह रिपोर्ट अपलोड करें या फाइलें प्रबंधित करें।',
    driveSearchPlaceholder: 'Drive फाइल नाम खोजें...',
    driveSaveReportBtn: 'कृषि सलाह रिपोर्ट Drive में सहेजें',
    sheetsTitle: 'Google Sheets मंडी सिंक',
    sheetsDesc: 'आज के मंडी भाव नई Google Sheet में भेजें या मौजूदा Sheet ID देखें।',
    sheetsExportMandiBtn: 'मंडी भाव स्प्रेडशीट बनाएं',
    sheetsIdPlaceholder: 'देखने के लिए Google Spreadsheet ID डालें...',
    sheetsPreviewBtn: 'शीट प्रीव्यू लोड करें',
    gmailTitle: 'Gmail ग्राहक व सहकारी इनबॉक्स',
    gmailDesc: 'हाल के ईमेल देखें और पुष्टि के बाद उपज या सलाह ईमेल भेजें।',
    gmailRefreshBtn: 'इनबॉक्स ताज़ा करें',
    gmailSendBtn: 'नया ईमेल लिखें व भेजें',
    calendarTitle: 'Google Calendar खेती कार्यक्रम',
    calendarDesc: 'आगामी कार्य देखें और बुवाई, सिंचाई या छिड़काव रिमाइंडर तय करें।',
    calendarCreateBtn: 'खेती कार्य शेड्यूल करें',
    cloudHistoryTitle: 'आपके AgriVeda क्लाउड रिकॉर्ड (Firestore)',
    savedPlansTab: 'सहेजी फसल योजनाएं',
    ordersTab: 'बाज़ार ऑर्डर',
    scanLogsTab: 'AI स्कैन लॉग',
  },
  confirmModal: {
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें व आगे बढ़ें',
    processing: 'प्रक्रिया जारी...',
  },
  footer: {
    tagline:
      'AgriVeda — ग्रामीण भारत के लिए मौसम, फसल योजना, सीधा किसान बाज़ार, मंडी भाव और AI फसल सुरक्षा जानकारी।',
    helplineLabel: 'किसान कॉल सेंटर (निःशुल्क)',
    helplineNumber: '1800-180-1551',
    dataNote:
      'Firebase Cloud Firestore, Gemini Search Grounding व Google Workspace (Drive, Sheets, Gmail, Calendar) से एकीकृत।',
    contactHeading: 'संपर्क और किसान सहायता केंद्र',
    emailLabel: 'सहायता ईमेल',
    phoneLabel: 'फोन / हेल्पलाइन',
    addressLabel: 'कार्यालय / केंद्र पता',
    hoursLabel: 'सहायता समय',
    editContactBtn: 'संपर्क विवरण बदलें',
    contactModalTitle: 'AgriVeda संपर्क विवरण',
    contactModalDesc:
      'AgriVeda फ़ुटर और किसान पूछताछ फ़ॉर्म में दिखने वाला संपर्क विवरण यहाँ अपडेट करें।',
    contactNameLabel: 'केंद्र / संपर्क नाम',
    saveContactBtn: 'संपर्क विवरण सहेजें',
    resetContactBtn: 'डिफ़ॉल्ट पर रीसेट करें',
  },
};

const DEVANAGARI_SET = new Set<RegionalLanguage>(['mr', 'bho', 'ne', 'sa']);

function mergeRegionalCopy(lang: RegionalLanguage, pack: RegionalPack): UiCopyShape {
  const base = DEVANAGARI_SET.has(lang) ? HI_COPY : EN_COPY;
  return {
    ...base,
    brandName: pack.brandName,
    languageToggleLabel: pack.languageToggleLabel,
    nav: pack.nav,
    home: {
      ...base.home,
      heroKicker: pack.heroKicker,
      heroTitle: pack.heroTitle,
      heroSubtitle: pack.heroSubtitle,
      primaryCta: pack.primaryCta,
      secondaryCta: pack.secondaryCta,
      scanCta: pack.scanCta,
      openSection: pack.openSection,
      sectionsHeading: pack.sectionsHeading,
      modules: {
        ...base.home.modules,
        weatherTitle: pack.weatherHeading,
        plannerTitle: pack.plannerHeading,
        marketplaceTitle: pack.marketplaceHeading,
        mandiTitle: pack.mandiHeading,
        doctorTitle: pack.doctorHeading,
        workspaceTitle: pack.workspaceHeading,
      },
    },
    weather: {
      ...base.weather,
      heading: pack.weatherHeading,
      subheading: pack.weatherSubheading,
    },
    planner: {
      ...base.planner,
      heading: pack.plannerHeading,
      subheading: pack.plannerSubheading,
      soils: pack.soils,
    },
    mandi: {
      ...base.mandi,
      heading: pack.mandiHeading,
      subheading: pack.mandiSubheading,
      categories: pack.categories,
    },
    marketplace: {
      ...base.marketplace,
      heading: pack.marketplaceHeading,
      subheading: pack.marketplaceSubheading,
      customerTab: pack.customerTab,
      farmerTab: pack.farmerTab,
      cartBtn: pack.cartBtn,
      addToCartBtn: pack.addToCartBtn,
      contactFarmerBtn: pack.contactFarmerBtn,
    },
    doctor: {
      ...base.doctor,
      heading: pack.doctorHeading,
      subheading: pack.doctorSubheading,
      scanBtnLabel: pack.scanBtnLabel,
      symptoms: pack.symptoms,
    },
    workspace: {
      ...base.workspace,
      heading: pack.workspaceHeading,
      subheading: pack.workspaceSubheading,
    },
    footer: {
      ...base.footer,
      tagline: pack.footerTagline,
      helplineLabel: pack.helplineLabel,
    },
  };
}

export const UI_COPY: Record<Language, UiCopyShape> = {
  en: EN_COPY,
  hi: HI_COPY,
  mr: mergeRegionalCopy('mr', REGIONAL_PACKS.mr),
  pa: mergeRegionalCopy('pa', REGIONAL_PACKS.pa),
  gu: mergeRegionalCopy('gu', REGIONAL_PACKS.gu),
  ta: mergeRegionalCopy('ta', REGIONAL_PACKS.ta),
  te: mergeRegionalCopy('te', REGIONAL_PACKS.te),
  kn: mergeRegionalCopy('kn', REGIONAL_PACKS.kn),
  ml: mergeRegionalCopy('ml', REGIONAL_PACKS.ml),
  bn: mergeRegionalCopy('bn', REGIONAL_PACKS.bn),
  or: mergeRegionalCopy('or', REGIONAL_PACKS.or),
  as: mergeRegionalCopy('as', REGIONAL_PACKS.as),
  ur: mergeRegionalCopy('ur', REGIONAL_PACKS.ur),
  bho: mergeRegionalCopy('bho', REGIONAL_PACKS.bho),
  ne: mergeRegionalCopy('ne', REGIONAL_PACKS.ne),
  sa: mergeRegionalCopy('sa', REGIONAL_PACKS.sa),
};
