import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CloudRain,
  Crosshair,
  Droplets,
  MapPin,
  Navigation,
  Radio,
  Search,
  Square,
  Wind,
} from 'lucide-react';
import { tText, UI_COPY } from '../i18n/translations';
import {
  findNearestWeatherHub,
  formatCoordinates,
  haversineDistanceKm,
  searchWeatherLocations,
} from '../utils/agriLogic';
import type { CropPlannerInput, Language, LocationWeather } from '../types/agri';
import { WeatherIcon } from './WeatherIcon';

interface GpsSample {
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestampMs: number;
}

interface WeatherViewProps {
  language: Language;
  locations: LocationWeather[];
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  onPlanWithForecast: (preset: Partial<CropPlannerInput>) => void;
  onNotify?: (msg: string) => void;
  onGpsUpdate?: (coords: { lat: number; lng: number } | null) => void;
}

export function WeatherView({
  language,
  locations,
  selectedLocationId,
  onSelectLocation,
  onPlanWithForecast,
  onNotify,
  onGpsUpdate,
}: WeatherViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'ready' | 'error'>('idle');
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentGps, setCurrentGps] = useState<GpsSample | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackCount, setTrackCount] = useState(0);
  const [distanceMovedKm, setDistanceMovedKm] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const lastTrackPointRef = useRef<{ lat: number; lng: number } | null>(null);

  const copy = UI_COPY[language];

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const nearestHubMatch = useMemo(() => {
    if (!currentGps) return null;
    return findNearestWeatherHub(currentGps.lat, currentGps.lng, locations);
  }, [currentGps, locations]);

  const nearestHubLocation = useMemo(() => {
    if (!nearestHubMatch) return null;
    return locations.find((loc) => loc.id === nearestHubMatch.hubId) ?? null;
  }, [nearestHubMatch, locations]);

  const recordGpsPosition = (pos: GeolocationPosition, isLiveUpdate: boolean) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracyMeters = Math.round(pos.coords.accuracy || 0);
    const sample: GpsSample = {
      lat,
      lng,
      accuracyMeters,
      timestampMs: pos.timestamp || Date.now(),
    };
    setCurrentGps(sample);
    setGpsStatus('ready');
    setGpsError(null);
    onGpsUpdate?.({ lat, lng });

    if (isLiveUpdate) {
      setTrackCount((prev) => prev + 1);
      if (lastTrackPointRef.current) {
        const delta = haversineDistanceKm(
          lastTrackPointRef.current.lat,
          lastTrackPointRef.current.lng,
          lat,
          lng
        );
        if (delta > 0.002) {
          setDistanceMovedKm((prev) => Math.round((prev + delta) * 100) / 100);
        }
      }
      lastTrackPointRef.current = { lat, lng };
    }
  };

  const handleDetectGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setGpsError(copy.weather.gps.unsupportedError);
      return;
    }

    setGpsStatus('locating');
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        recordGpsPosition(pos, false);
        const match = findNearestWeatherHub(
          pos.coords.latitude,
          pos.coords.longitude,
          locations
        );
        if (match) {
          onSelectLocation(match.hubId);
        }
        onNotify?.(
          language === 'en'
            ? `GPS locked at ${formatCoordinates(pos.coords.latitude, pos.coords.longitude)}`
            : `GPS लोकेशन प्राप्त: ${formatCoordinates(pos.coords.latitude, pos.coords.longitude)}`
        );
      },
      (err) => {
        setGpsStatus('error');
        setGpsError(err.message || copy.weather.gps.unsupportedError);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  };

  const handleToggleLiveTracking = () => {
    if (isTracking) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
      setIsTracking(false);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('error');
      setGpsError(copy.weather.gps.unsupportedError);
      return;
    }

    setGpsError(null);
    setGpsStatus('locating');
    setDistanceMovedKm(0);
    setTrackCount(0);
    lastTrackPointRef.current = currentGps
      ? { lat: currentGps.lat, lng: currentGps.lng }
      : null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        recordGpsPosition(pos, true);
      },
      (err) => {
        setGpsStatus('error');
        setGpsError(err.message || copy.weather.gps.unsupportedError);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    watchIdRef.current = watchId;
    setIsTracking(true);
  };

  const matchingLocations = useMemo(
    () => searchWeatherLocations(locations, searchQuery),
    [locations, searchQuery]
  );

  const activeLocation = useMemo(() => {
    return (
      locations.find((loc) => loc.id === selectedLocationId) ||
      matchingLocations[0] ||
      locations[0]
    );
  }, [locations, selectedLocationId, matchingLocations]);

  const maxMonthlyRain = useMemo(() => {
    const highest = Math.max(
      ...activeLocation.fourMonthOutlook.map((m) => m.expectedRainfallMm),
      60
    );
    return highest;
  }, [activeLocation]);

  const handlePlanFromWeather = () => {
    const firstMonth = activeLocation.fourMonthOutlook[0];
    const totalRain = activeLocation.fourMonthOutlook.reduce(
      (sum, m) => sum + m.expectedRainfallMm,
      0
    );
    const avgMax =
      activeLocation.fourMonthOutlook.reduce((sum, m) => sum + m.avgTempMaxC, 0) /
      activeLocation.fourMonthOutlook.length;

    const expectedRainfall =
      totalRain > 650 ? 'high' : totalRain >= 250 ? 'moderate' : 'low';
    const temperatureBand = avgMax >= 31 ? 'warm' : avgMax >= 24 ? 'mild' : 'cool';

    onPlanWithForecast({
      regionId: activeLocation.regionId,
      season: firstMonth.seasonPhase,
      expectedRainfall,
      temperatureBand,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1D241C] tracking-tight">
          {copy.weather.heading}
        </h1>
        <p className="text-base text-[#4D574B] mt-2 leading-relaxed">
          {copy.weather.subheading}
        </p>
      </div>

      {/* GPS Location & Live Field Tracking */}
      <section
        aria-labelledby="gps-tracker-heading"
        data-testid="gps-tracking-panel"
        className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#1B5E3A] shrink-0" aria-hidden="true" />
              <h2 id="gps-tracker-heading" className="text-lg font-bold text-[#1D241C]">
                {copy.weather.gps.panelTitle}
              </h2>
              {isTracking && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                  <Radio className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
                  {copy.weather.gps.trackingActiveLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-[#4D574B]">{copy.weather.gps.panelDesc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-testid="detect-gps-btn"
              onClick={handleDetectGps}
              disabled={gpsStatus === 'locating'}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Crosshair className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {gpsStatus === 'locating' && !isTracking
                  ? copy.weather.gps.detectingLabel
                  : copy.weather.gps.detectBtn}
              </span>
            </button>

            <button
              type="button"
              data-testid="live-tracking-btn"
              onClick={handleToggleLiveTracking}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-xl border cursor-pointer whitespace-nowrap ${
                isTracking
                  ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] hover:bg-[#FEE2E2]'
                  : 'bg-[#F8F7F3] text-[#1D241C] border-[#DFDDD4] hover:bg-[#F1EFE8]'
              }`}
            >
              {isTracking ? (
                <>
                  <Square className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{copy.weather.gps.stopTrackingBtn}</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4 text-[#1B5E3A] shrink-0" aria-hidden="true" />
                  <span>{copy.weather.gps.startTrackingBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {gpsError && (
          <div
            role="alert"
            className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm text-[#991B1B]"
          >
            {gpsError}
          </div>
        )}

        {currentGps ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#DFDDD4]">
            <div className="p-3.5 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl">
              <p className="text-xs font-medium text-[#4D574B]">
                {copy.weather.gps.coordsLabel}
              </p>
              <p
                data-testid="gps-coords-readout"
                className="text-sm font-mono font-bold text-[#1D241C] mt-1 tabular-nums"
              >
                {formatCoordinates(currentGps.lat, currentGps.lng)}
              </p>
            </div>

            <div className="p-3.5 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl">
              <p className="text-xs font-medium text-[#4D574B]">
                {copy.weather.gps.accuracyLabel}
              </p>
              <p className="text-sm font-mono font-bold text-[#1D241C] mt-1 tabular-nums">
                ± {currentGps.accuracyMeters} m ·{' '}
                {new Date(currentGps.timestampMs).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>

            <div className="p-3.5 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl">
              <p className="text-xs font-medium text-[#4D574B]">
                {copy.weather.gps.distanceMovedLabel}
              </p>
              <p className="text-sm font-mono font-bold text-[#1D241C] mt-1 tabular-nums">
                {distanceMovedKm.toFixed(2)} km ({trackCount} {copy.weather.gps.pointsLoggedLabel})
              </p>
            </div>

            <div className="p-3.5 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl flex flex-col justify-between gap-1.5">
              <div>
                <p className="text-xs font-medium text-[#4D574B]">
                  {copy.weather.gps.nearestHubLabel}
                </p>
                <p className="text-sm font-bold text-[#1B5E3A] mt-0.5 truncate">
                  {nearestHubLocation
                    ? `${tText(nearestHubLocation.villageOrTown, language)} (${nearestHubMatch?.distanceKm} km)`
                    : '—'}
                </p>
              </div>
              {nearestHubLocation && nearestHubLocation.id !== activeLocation.id && (
                <button
                  type="button"
                  onClick={() => onSelectLocation(nearestHubLocation.id)}
                  className="text-left text-xs font-semibold text-[#1B5E3A] hover:underline cursor-pointer"
                >
                  {copy.weather.gps.syncNearestBtn}
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#4D574B] pt-1">{copy.weather.gps.permissionHint}</p>
        )}
      </section>

      {/* Village / District Search & Hub Selector */}
      <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="max-w-xl">
          <label
            htmlFor="weather-location-search"
            className="block text-sm font-semibold text-[#1D241C] mb-1.5"
          >
            {copy.weather.searchLabel}
          </label>
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#4D574B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="weather-location-search"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                const next = e.target.value;
                setSearchQuery(next);
                const found = searchWeatherLocations(locations, next);
                if (found.length === 1) {
                  onSelectLocation(found[0].id);
                }
              }}
              placeholder={copy.weather.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-base text-[#1D241C] placeholder:text-[#4D574B]/70 focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#4D574B] mb-2">
            {copy.weather.quickLocations}
          </p>

        {matchingLocations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {matchingLocations.map((loc) => {
              const isSelected = loc.id === activeLocation.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => onSelectLocation(loc.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A] ${
                    isSelected
                      ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]'
                      : 'bg-[#F8F7F3] text-[#1D241C] border-[#DFDDD4] hover:bg-[#F1EFE8]'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {tText(loc.villageOrTown, language)}, {tText(loc.district, language)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl">
            <p className="text-sm text-[#4D574B]">{copy.weather.noLocationMatch}</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-sm font-semibold text-[#1B5E3A] bg-[#FFFFFF] border border-[#DFDDD4] rounded-lg hover:bg-[#F1EFE8] cursor-pointer"
            >
              {copy.weather.resetLocation}
            </button>
          </div>
        )}
        </div>
      </section>

      {/* Current Field Conditions */}
      <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#DFDDD4]">
          <div>
            <p className="text-sm font-medium text-[#6B4423] mb-1">
              {copy.weather.currentConditions}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1D241C]">
              {tText(activeLocation.villageOrTown, language)}, {tText(activeLocation.district, language)} ·{' '}
              {tText(activeLocation.state, language)}
            </h2>
            <p className="text-sm text-[#4D574B] mt-1">
              {tText(activeLocation.current.condition, language)} · {activeLocation.updatedAt}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <WeatherIcon icon={activeLocation.current.icon} className="w-12 h-12 shrink-0" />
            <div>
              <p className="text-4xl sm:text-5xl font-bold text-[#1D241C] tabular-nums">
                {activeLocation.current.tempC}°C
              </p>
              <p className="text-sm text-[#4D574B] tabular-nums">
                {copy.weather.feelsLike} {activeLocation.current.feelsLikeC}°C
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="flex items-start gap-3">
            <Droplets className="w-5 h-5 text-[#1B5E3A] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm text-[#4D574B]">{copy.weather.humidity}</p>
              <p className="text-2xl font-bold text-[#1D241C] tabular-nums">
                {activeLocation.current.humidityPct}%
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CloudRain className="w-5 h-5 text-[#1B5E3A] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm text-[#4D574B]">{copy.weather.rainChance}</p>
              <p className="text-2xl font-bold text-[#1D241C] tabular-nums">
                {activeLocation.current.rainProbPct}%
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Wind className="w-5 h-5 text-[#6B4423] mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm text-[#4D574B]">{copy.weather.windSpeed}</p>
              <p className="text-2xl font-bold text-[#1D241C] tabular-nums">
                {activeLocation.current.windKmh} km/h{' '}
                <span className="text-base font-medium text-[#4D574B]">
                  {activeLocation.current.windDirection}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Day Daily Forecast */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#1D241C]">
          {copy.weather.sevenDayHeading}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {activeLocation.sevenDay.map((day) => (
            <div
              key={day.dateLabel}
              className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <p className="text-base font-bold text-[#1D241C]">{tText(day.day, language)}</p>
                <p className="text-xs text-[#4D574B]">{day.dateLabel}</p>
              </div>

              <div className="flex items-center gap-2.5">
                <WeatherIcon icon={day.icon} className="w-7 h-7 shrink-0" />
                <span className="text-xs text-[#4D574B] leading-snug">
                  {tText(day.condition, language)}
                </span>
              </div>

              <div className="pt-2 border-t border-[#DFDDD4] space-y-1 text-sm tabular-nums">
                <p className="font-bold text-[#1D241C]">
                  {day.tempMaxC}° / <span className="font-normal text-[#4D574B]">{day.tempMinC}°C</span>
                </p>
                <p className="text-xs text-[#1B5E3A] font-medium">
                  {copy.weather.rainChance}: {day.rainProbPct}%
                </p>
                <p className="text-xs text-[#4D574B]">
                  {copy.weather.humidity}: {day.humidityPct}% · {day.windKmh} km/h
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dedicated 4-Month Seasonal Outlook */}
      <section
        aria-labelledby="four-month-heading"
        className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#DFDDD4]">
          <div>
            <h2 id="four-month-heading" className="text-2xl sm:text-3xl font-bold text-[#1D241C]">
              {copy.weather.fourMonthHeading}
            </h2>
            <p className="text-base text-[#4D574B] mt-1">
              {copy.weather.fourMonthSubheading}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePlanFromWeather}
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
          >
            <span>{copy.weather.planWithForecastBtn}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {activeLocation.fourMonthOutlook.map((monthItem) => {
            const barWidthPct = Math.max(
              8,
              Math.round((monthItem.expectedRainfallMm / maxMonthlyRain) * 100)
            );
            return (
              <div
                key={monthItem.month.en}
                className="p-5 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="text-lg font-bold text-[#1D241C]">
                      {tText(monthItem.month, language)}
                    </h3>
                    <span className="text-xs font-semibold text-[#6B4423]">
                      {copy.planner.seasons[monthItem.seasonPhase].split(' ')[0]}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-[#4D574B]">{copy.weather.avgTemp}</span>
                      <span className="font-semibold text-[#1D241C] tabular-nums">
                        {monthItem.avgTempMinC}° – {monthItem.avgTempMaxC}°C
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between gap-2 mb-1.5">
                        <span className="text-[#4D574B]">{copy.weather.expectedRain}</span>
                        <span className="font-semibold text-[#1B5E3A] tabular-nums">
                          {monthItem.expectedRainfallMm} mm
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#DFDDD4] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1B5E3A] rounded-full"
                          style={{ width: `${barWidthPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#4D574B] leading-relaxed pt-3 border-t border-[#DFDDD4]">
                  {tText(monthItem.fieldNote, language)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-5 bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl">
          <p className="text-xs font-semibold text-[#6B4423] mb-1">
            {copy.weather.seasonalShiftHeading}
          </p>
          <p className="text-base text-[#1D241C] leading-relaxed">
            {tText(activeLocation.seasonalShiftSummary, language)}
          </p>
        </div>
      </section>
    </div>
  );
}
