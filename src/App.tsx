/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { CheckCircle2, Clock, HelpCircle, Mail, MapPin, Phone, X } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { WeatherView } from './components/WeatherView';
import { CropPlannerView } from './components/CropPlannerView';
import { MarketplaceView } from './components/MarketplaceView';
import { MandiView } from './components/MandiView';
import { CropDoctorView } from './components/CropDoctorView';
import { WorkspaceHubView } from './components/WorkspaceHubView';
import { AgriChatbot } from './components/AgriChatbot';
import { HelpFaqSection } from './components/HelpFaqSection';
import {
  ConfirmActionModal,
  type PendingConfirmation,
} from './components/ConfirmActionModal';
import { tText } from './i18n/translations';
import {
  AGRO_REGIONS,
  CROP_CATALOG,
  CROP_DISEASES,
  INITIAL_MARKETPLACE_LISTINGS,
  LOCATION_WEATHER_DATA,
  MANDI_PRICES_DATA,
} from './data/agriData';
import {
  fetchAgroRegions,
  fetchAllWeatherHubs,
  fetchCropCatalog,
  fetchCropDiseases,
  fetchInitialMarketplaceListings,
  fetchLiveMandiRates,
} from './services/agriApi';
import {
  googleSignIn,
  initAuth,
  logout,
  subscribeActiveListings,
  subscribeUserCropPlans,
  subscribeUserOrders,
  subscribeUserScanLogs,
} from './services/firebase';
import { LANGUAGE_OPTIONS, UI_COPY } from './i18n/translations';
import {
  DEFAULT_CONTACT_DETAILS,
  enrichMandiPrice,
  formatCoordinates,
} from './utils/agriLogic';
import type {
  AgroRegion,
  CartItem,
  CropCatalogItem,
  CropDiseaseEntry,
  CropPlanRecord,
  CropPlannerInput,
  CropScanLogRecord,
  Language,
  LocationWeather,
  MandiPriceEntry,
  MarketplaceListing,
  MarketplaceOrderRecord,
  NavSection,
} from './types/agri';

const DEFAULT_PLANNER_INPUT: CropPlannerInput = {
  regionId: 'indo_gangetic',
  soilType: 'alluvial',
  season: 'Rabi',
  expectedRainfall: 'low',
  temperatureBand: 'cool',
};

const VALID_LANG_CODES = new Set<string>(LANGUAGE_OPTIONS.map((o) => o.code));

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('agriveda_lang');
      return saved && VALID_LANG_CODES.has(saved) ? (saved as Language) : 'en';
    } catch {
      return 'en';
    }
  });

  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [weatherHubs, setWeatherHubs] = useState<LocationWeather[]>(LOCATION_WEATHER_DATA);
  const [selectedWeatherId, setSelectedWeatherId] = useState<string>(
    LOCATION_WEATHER_DATA[0].id
  );
  const [regions, setRegions] = useState<AgroRegion[]>(AGRO_REGIONS);
  const [cropCatalog, setCropCatalog] = useState<CropCatalogItem[]>(CROP_CATALOG);
  const [mandiPrices, setMandiPrices] = useState<MandiPriceEntry[]>(MANDI_PRICES_DATA);
  const [cropDiseases, setCropDiseases] = useState<CropDiseaseEntry[]>(CROP_DISEASES);
  const [plannerInput, setPlannerInput] = useState<CropPlannerInput>(DEFAULT_PLANNER_INPUT);

  // Marketplace & Cart state
  const [demoListings, setDemoListings] = useState<MarketplaceListing[]>(
    INITIAL_MARKETPLACE_LISTINGS
  );
  const [firestoreListings, setFirestoreListings] = useState<MarketplaceListing[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Firebase Auth & Workspace state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // User-scoped Firestore history
  const [savedPlans, setSavedPlans] = useState<CropPlanRecord[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrderRecord[]>([]);
  const [scanLogs, setScanLogs] = useState<CropScanLogRecord[]>([]);

  // Confirmation modal & non-blocking toast
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmation | null>(null);
  const [isConfirmBusy, setIsConfirmBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [focusedProblem, setFocusedProblem] = useState<string | null>(null);
  const [queuedChatPrompt, setQueuedChatPrompt] = useState<{ id: number; text: string } | null>(
    null
  );

  // Official Contact Details & Live GPS state
  const contactDetails = DEFAULT_CONTACT_DETAILS;
  const [liveGpsCoords, setLiveGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleAskAiProblem = (topicLabel: string, promptText: string) => {
    setFocusedProblem(topicLabel);
    setChatOpen(true);
    setQueuedChatPrompt({ id: Date.now(), text: promptText });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const scrollToFooterBlock = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 5000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchAllWeatherHubs(),
      fetchAgroRegions(),
      fetchCropCatalog(),
      fetchLiveMandiRates(),
      fetchCropDiseases(),
      fetchInitialMarketplaceListings(),
    ]).then(([hubs, regList, crops, rates, diseases, initListings]) => {
      if (!active) return;
      setWeatherHubs(hubs);
      setRegions(regList);
      setCropCatalog(crops);
      setMandiPrices(rates);
      setCropDiseases(diseases);
      setDemoListings(initListings);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsubAuth = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setSavedPlans([]);
        setOrders([]);
        setScanLogs([]);
      }
    );

    const unsubListings = subscribeActiveListings(
      (items) => setFirestoreListings(items),
      () => {
        // Keep demo listings resilient even if Firestore offline
      }
    );

    return () => {
      unsubAuth();
      unsubListings();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubPlans = subscribeUserCropPlans(user.uid, setSavedPlans);
    const unsubOrders = subscribeUserOrders(user.uid, setOrders);
    const unsubScans = subscribeUserScanLogs(user.uid, setScanLogs);
    return () => {
      unsubPlans();
      unsubOrders();
      unsubScans();
    };
  }, [user]);

  useEffect(() => {
    document.documentElement.lang = language;
    const option = LANGUAGE_OPTIONS.find((o) => o.code === language);
    document.documentElement.dir = option?.rtl ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('agriveda_lang', language);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [language]);

  const handleNavigate = (section: NavSection) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlanWithForecast = (preset: Partial<CropPlannerInput>) => {
    setPlannerInput((prev) => ({ ...prev, ...preset }));
    handleNavigate('planner');
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      setUser(res.user);
      setAccessToken(res.accessToken);
      showToast(
        `Signed in as ${res.user.displayName || res.user.email}.`
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    showToast('Signed out.');
  };

  const handleAddToCart = (listing: MarketplaceListing) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.listing.id === listing.id);
      if (existing) {
        return prev.map((c) =>
          c.listing.id === listing.id ? { ...c, quantityKg: c.quantityKg + 5 } : c
        );
      }
      return [...prev, { listing, quantityKg: 5 }];
    });
  };

  const handleUpdateCartQty = (listingId: string, deltaKg: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.listing.id === listingId
            ? { ...c, quantityKg: c.quantityKg + deltaKg }
            : c
        )
        .filter((c) => c.quantityKg > 0)
    );
  };

  const handleExecuteConfirm = async () => {
    if (!pendingConfirm) return;
    setIsConfirmBusy(true);
    try {
      await pendingConfirm.onConfirm();
      setPendingConfirm(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed.');
      setPendingConfirm(null);
    } finally {
      setIsConfirmBusy(false);
    }
  };

  const combinedListings = useMemo(
    () => [...firestoreListings, ...demoListings],
    [firestoreListings, demoListings]
  );

  const topGainerMandi = useMemo(() => {
    const enriched = mandiPrices.map(enrichMandiPrice);
    enriched.sort((a, b) => b.deltaQuintal - a.deltaQuintal);
    return enriched[0];
  }, [mandiPrices]);

  const selectedWeatherHub = useMemo(
    () => weatherHubs.find((w) => w.id === selectedWeatherId) || weatherHubs[0],
    [weatherHubs, selectedWeatherId]
  );

  const copy = UI_COPY[language];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F3] text-[#1D241C]">
      <Navbar
        language={language}
        onSelectLanguage={setLanguage}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        user={user}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 pt-4"
        >
          <div className="p-3.5 bg-[#FFFFFF] border border-[#1B5E3A] rounded-xl flex items-center justify-between gap-3 text-sm text-[#1D241C] shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#1B5E3A] shrink-0" aria-hidden="true" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              aria-label="Dismiss notification"
              className="p-1 text-[#4D574B] hover:text-[#1D241C] cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {activeSection === 'home' && (
          <HomeView
            language={language}
            featuredWeather={weatherHubs[0]}
            topGainerMandi={topGainerMandi}
            marketplaceCount={combinedListings.length}
            diseaseCount={cropDiseases.length}
            onNavigate={handleNavigate}
          />
        )}

        {activeSection === 'weather' && (
          <WeatherView
            language={language}
            locations={weatherHubs}
            selectedLocationId={selectedWeatherId}
            onSelectLocation={setSelectedWeatherId}
            onPlanWithForecast={handlePlanWithForecast}
            onNotify={showToast}
            onGpsUpdate={setLiveGpsCoords}
          />
        )}

        {activeSection === 'planner' && (
          <CropPlannerView
            language={language}
            regions={regions}
            catalog={cropCatalog}
            plannerInput={plannerInput}
            onUpdateInput={setPlannerInput}
            onResetInput={() => setPlannerInput(DEFAULT_PLANNER_INPUT)}
            user={user}
            accessToken={accessToken}
            onRequestSignIn={() => handleNavigate('workspace')}
            onRequestConfirm={setPendingConfirm}
            onNotify={showToast}
            onAskAi={handleAskAiProblem}
          />
        )}

        {activeSection === 'marketplace' && (
          <MarketplaceView
            language={language}
            listings={combinedListings}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQty={handleUpdateCartQty}
            onClearCart={() => setCart([])}
            user={user}
            accessToken={accessToken}
            onSignIn={handleSignIn}
            onRequestConfirm={setPendingConfirm}
            onNotify={showToast}
            defaultSupportEmail={contactDetails.email}
          />
        )}

        {activeSection === 'mandi' && (
          <MandiView
            language={language}
            prices={mandiPrices}
            accessToken={accessToken}
            onRequestSignIn={() => handleNavigate('workspace')}
            onRequestConfirm={setPendingConfirm}
            onNotify={showToast}
          />
        )}

        {activeSection === 'doctor' && (
          <CropDoctorView
            language={language}
            diseases={cropDiseases}
            user={user}
            accessToken={accessToken}
            onRequestSignIn={() => handleNavigate('workspace')}
            onRequestConfirm={setPendingConfirm}
            onNotify={showToast}
            onAskAi={handleAskAiProblem}
          />
        )}

        {activeSection === 'workspace' && (
          <WorkspaceHubView
            language={language}
            user={user}
            accessToken={accessToken}
            isSigningIn={isSigningIn}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            mandiPrices={mandiPrices}
            savedPlans={savedPlans}
            orders={orders}
            scanLogs={scanLogs}
            onRequestConfirm={setPendingConfirm}
            onNotify={showToast}
          />
        )}
      </main>

      <ConfirmActionModal
        language={language}
        pending={pendingConfirm}
        isBusy={isConfirmBusy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleExecuteConfirm()}
      />

      <AgriChatbot
        language={language}
        isOpen={chatOpen}
        onOpenChange={setChatOpen}
        context={{
          activeSection,
          locationName: selectedWeatherHub
            ? `${tText(selectedWeatherHub.villageOrTown, language)}, ${tText(selectedWeatherHub.district, language)}${
                liveGpsCoords
                  ? ` (GPS: ${formatCoordinates(liveGpsCoords.lat, liveGpsCoords.lng)})`
                  : ''
              }`
            : liveGpsCoords
              ? `GPS: ${formatCoordinates(liveGpsCoords.lat, liveGpsCoords.lng)}`
              : undefined,
          weatherSummary: selectedWeatherHub
            ? `${selectedWeatherHub.current.tempC}°C, ${tText(selectedWeatherHub.current.condition, language)}, ${selectedWeatherHub.current.rainProbPct}% rain probability`
            : undefined,
          focusedProblem,
        }}
        onClearFocusedProblem={() => setFocusedProblem(null)}
        queuedPrompt={queuedChatPrompt}
        onConsumeQueuedPrompt={() => setQueuedChatPrompt(null)}
      />

      <footer className="border-t border-[#DFDDD4] bg-[#FFFFFF] mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-1.5">
              <p className="text-base font-bold text-[#1B5E3A]">{copy.brandName}</p>
              <p className="text-sm text-[#4D574B]">{copy.footer.tagline}</p>
              <p className="text-xs text-[#4D574B]">{copy.footer.dataNote}</p>
            </div>

            <section
              id="contact-details"
              data-testid="footer-contact-details"
              aria-label={copy.footer.contactHeading}
              className="lg:col-span-7 bg-[#F8F7F3] border border-[#DFDDD4] rounded-2xl p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#DFDDD4]">
                <div>
                  <h2 className="text-sm font-bold text-[#1D241C]">
                    {copy.footer.contactHeading}
                  </h2>
                  <p className="text-xs text-[#4D574B] mt-0.5">{contactDetails.contactName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="contact-help-faq-link"
                    onClick={() => scrollToFooterBlock('help-faq')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-semibold text-[#1D241C] bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-lg cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#1B5E3A] shrink-0" aria-hidden="true" />
                    <span>{copy.footer.helpFaqLinkBtn}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#1B5E3A] mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs text-[#4D574B]">{copy.footer.emailLabel}</p>
                    <a
                      href={`mailto:${contactDetails.email}`}
                      className="font-medium text-[#1D241C] hover:text-[#1B5E3A] hover:underline break-all"
                    >
                      {contactDetails.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#1B5E3A] mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4D574B]">{copy.footer.phoneLabel}</p>
                    <a
                      href={`tel:${contactDetails.phone.replace(/\s+/g, '')}`}
                      className="font-mono font-semibold text-[#1D241C] hover:text-[#1B5E3A] hover:underline tabular-nums"
                    >
                      {contactDetails.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#6B4423] mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4D574B]">{copy.footer.addressLabel}</p>
                    <p className="text-sm text-[#1D241C]">{contactDetails.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#6B4423] mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-[#4D574B]">{copy.footer.hoursLabel}</p>
                    <p className="text-sm text-[#1D241C]">{contactDetails.supportHours}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <HelpFaqSection
            language={language}
            contactDetails={contactDetails}
            onJumpToContact={() => scrollToFooterBlock('contact-details')}
            onAskAi={() => setChatOpen(true)}
          />
        </div>
      </footer>
    </div>
  );
}
