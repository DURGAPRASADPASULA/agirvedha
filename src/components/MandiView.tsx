import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Minus,
  Search,
} from 'lucide-react';
import { LANGUAGE_OPTIONS, tText, UI_COPY } from '../i18n/translations';
import { filterMandiPrices, formatINR } from '../utils/agriLogic';
import { createFarmSpreadsheet } from '../services/workspaceApi';
import type { CropCategory, GroundingSource, Language, MandiPriceEntry } from '../types/agri';
import type { PendingConfirmation } from './ConfirmActionModal';

interface MandiViewProps {
  language: Language;
  prices: MandiPriceEntry[];
  accessToken: string | null;
  onRequestSignIn: () => void;
  onRequestConfirm: (pending: PendingConfirmation) => void;
  onNotify: (msg: string) => void;
}

export function MandiView({
  language,
  prices,
  accessToken,
  onRequestSignIn,
  onRequestConfirm,
  onNotify,
}: MandiViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [mandiFilter, setMandiFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<CropCategory | 'all'>('all');
  const [primaryUnit, setPrimaryUnit] = useState<'quintal' | 'kg'>('quintal');

  const [liveQuery, setLiveQuery] = useState('');
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [liveResult, setLiveResult] = useState<{
    summary: string;
    sources: GroundingSource[];
  } | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  const copy = UI_COPY[language];
  const langOption = LANGUAGE_OPTIONS.find((l) => l.code === language);
  const languageName = langOption ? langOption.englishName : 'English';

  const handleLiveWebSearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = liveQuery.trim();
    if (!trimmed || isLiveSearching) return;

    setIsLiveSearching(true);
    setLiveError(null);
    try {
      const response = await fetch('/api/search-advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, languageName }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        summary?: string;
        sources?: GroundingSource[];
        error?: string;
      };
      if (!response.ok || !data.summary) {
        throw new Error(data.error || 'Live web search failed.');
      }
      setLiveResult({
        summary: data.summary,
        sources: Array.isArray(data.sources) ? data.sources : [],
      });
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Live web search failed.');
    } finally {
      setIsLiveSearching(false);
    }
  };

  const stateOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of prices) {
      map.set(p.state.en, tText(p.state, language));
    }
    return Array.from(map.entries());
  }, [prices, language]);

  const districtOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of prices) {
      if (stateFilter === 'all' || p.state.en === stateFilter) {
        map.set(p.district.en, tText(p.district, language));
      }
    }
    return Array.from(map.entries());
  }, [prices, stateFilter, language]);

  const mandiOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of prices) {
      if (
        (stateFilter === 'all' || p.state.en === stateFilter) &&
        (districtFilter === 'all' || p.district.en === districtFilter)
      ) {
        map.set(p.mandiName.en, tText(p.mandiName, language));
      }
    }
    return Array.from(map.entries());
  }, [prices, stateFilter, districtFilter, language]);

  const filteredRates = useMemo(
    () =>
      filterMandiPrices(prices, {
        state: stateFilter,
        district: districtFilter,
        mandi: mandiFilter,
        category: categoryFilter,
        query: searchQuery,
      }),
    [prices, stateFilter, districtFilter, mandiFilter, categoryFilter, searchQuery]
  );

  const summaryStats = useMemo(() => {
    const gainers = filteredRates.filter((r) => r.trend === 'up').length;
    const losers = filteredRates.filter((r) => r.trend === 'down').length;
    return { gainers, losers };
  }, [filteredRates]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStateFilter('all');
    setDistrictFilter('all');
    setMandiFilter('all');
    setCategoryFilter('all');
  };

  const handleExportToSheets = () => {
    if (!accessToken) {
      onRequestSignIn();
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const title = `AgriVeda Mandi Rates ${today}`;
    const rows = [
      ['Crop', 'Variety', 'Mandi', 'District', 'State', 'Rate INR/Quintal', 'Rate INR/kg'],
      ...filteredRates.map((r) => [
        tText(r.cropName, language),
        tText(r.variety, language),
        tText(r.mandiName, language),
        tText(r.district, language),
        tText(r.state, language),
        r.pricePerQuintal,
        r.pricePerKg,
      ]),
    ];

    onRequestConfirm({
      title:
        language === 'en'
          ? 'Export Filtered Mandi Rates to Google Sheets?'
          : 'फ़िल्टर किए मंडी भाव Google Sheets में भेजें?',
      description: `Creates "${title}" with ${filteredRates.length} filtered market rows.`,
      details: [`Sheet Title: ${title}`, `Rows: ${filteredRates.length}`],
      onConfirm: async () => {
        await createFarmSpreadsheet(accessToken, title, 'Mandi_Rates', rows);
        onNotify(
          language === 'en'
            ? `Exported ${filteredRates.length} Mandi rates to Google Sheets.`
            : `${filteredRates.length} मंडी भाव Google Sheets में निर्यात किए गए।`
        );
      },
    });
  };

  const categories: (CropCategory | 'all')[] = [
    'all',
    'grains',
    'vegetables',
    'fruits',
    'pulses',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1D241C] tracking-tight">
            {copy.mandi.heading}
          </h1>
          <p className="text-base text-[#4D574B] mt-2 leading-relaxed">
            {copy.mandi.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          {/* Quintal / Kg Quick Toggle */}
          <div className="inline-flex items-center p-1 bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl">
            <button
              type="button"
              onClick={() => setPrimaryUnit('quintal')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                primaryUnit === 'quintal'
                  ? 'bg-[#FFFFFF] text-[#1D241C] shadow-xs'
                  : 'text-[#4D574B] hover:text-[#1D241C]'
              }`}
            >
              {copy.mandi.unitToggleQuintal}
            </button>
            <button
              type="button"
              onClick={() => setPrimaryUnit('kg')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                primaryUnit === 'kg'
                  ? 'bg-[#FFFFFF] text-[#1D241C] shadow-xs'
                  : 'text-[#4D574B] hover:text-[#1D241C]'
              }`}
            >
              {copy.mandi.unitToggleKg}
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportToSheets}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{copy.mandi.exportSheetsBtn}</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl p-4">
          <p className="text-xs font-medium text-[#4D574B]">{copy.mandi.summaryGainers}</p>
          <p className="text-2xl font-bold text-[#15803D] mt-1 tabular-nums">
            ▲ {summaryStats.gainers}
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl p-4">
          <p className="text-xs font-medium text-[#4D574B]">{copy.mandi.summaryLosers}</p>
          <p className="text-2xl font-bold text-[#B91C1C] mt-1 tabular-nums">
            ▼ {summaryStats.losers}
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl p-4">
          <p className="text-xs font-medium text-[#4D574B]">{copy.mandi.summaryUpdated}</p>
          <p className="text-2xl font-bold text-[#1D241C] mt-1 tabular-nums">
            10:30 AM IST
          </p>
        </div>
      </div>

      {/* Live Web Search Grounding Panel */}
      <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#1B5E3A] shrink-0" aria-hidden="true" />
          <h2 className="text-base font-bold text-[#1D241C]">
            {copy.mandi.liveSearchHeading}
          </h2>
        </div>

        <form onSubmit={handleLiveWebSearch} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            data-testid="mandi-live-search-input"
            value={liveQuery}
            onChange={(e) => setLiveQuery(e.target.value)}
            placeholder={copy.mandi.liveSearchPlaceholder}
            aria-label={copy.mandi.liveSearchHeading}
            className="flex-1 px-4 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] placeholder:text-[#4D574B]/70 focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
          />
          <button
            type="submit"
            data-testid="mandi-live-search-btn"
            disabled={isLiveSearching || !liveQuery.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {isLiveSearching ? copy.mandi.liveSearchingLabel : copy.mandi.liveSearchBtn}
            </span>
          </button>
        </form>

        {liveError && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B]">
            {liveError}
          </div>
        )}

        {liveResult && (
          <div
            data-testid="mandi-live-search-result"
            className="p-4 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl space-y-3"
          >
            <p className="text-sm text-[#1D241C] leading-relaxed whitespace-pre-wrap">
              {liveResult.summary}
            </p>
            {liveResult.sources.length > 0 && (
              <div className="pt-2 border-t border-[#DFDDD4] space-y-1.5">
                <p className="text-xs font-semibold text-[#4D574B]">
                  {copy.mandi.liveSearchSources}
                </p>
                <div className="flex flex-wrap gap-2">
                  {liveResult.sources.map((src) => (
                    <a
                      key={src.uri}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-lg text-xs font-medium text-[#1B5E3A]"
                    >
                      <span className="truncate max-w-[220px]">{src.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Filters & Search */}
      <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div>
            <label
              htmlFor="mandi-search"
              className="block text-sm font-semibold text-[#1D241C] mb-1.5"
            >
              {copy.mandi.searchLabel}
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#4D574B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="mandi-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={copy.mandi.searchPlaceholder}
                className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] placeholder:text-[#4D574B]/70 focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
              />
            </div>
          </div>

          {/* State Filter */}
          <div>
            <label
              htmlFor="mandi-state"
              className="block text-sm font-semibold text-[#1D241C] mb-1.5"
            >
              {copy.mandi.stateLabel}
            </label>
            <select
              id="mandi-state"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setDistrictFilter('all');
                setMandiFilter('all');
              }}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            >
              <option value="all">{copy.mandi.allStates}</option>
              {stateOptions.map(([enVal, label]) => (
                <option key={enVal} value={enVal}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label
              htmlFor="mandi-district"
              className="block text-sm font-semibold text-[#1D241C] mb-1.5"
            >
              {copy.mandi.districtLabel}
            </label>
            <select
              id="mandi-district"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setMandiFilter('all');
              }}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            >
              <option value="all">{copy.mandi.allDistricts}</option>
              {districtOptions.map(([enVal, label]) => (
                <option key={enVal} value={enVal}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Local Mandi Filter */}
          <div>
            <label
              htmlFor="mandi-local"
              className="block text-sm font-semibold text-[#1D241C] mb-1.5"
            >
              {copy.mandi.mandiLabel}
            </label>
            <select
              id="mandi-local"
              value={mandiFilter}
              onChange={(e) => setMandiFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            >
              <option value="all">{copy.mandi.allMandis}</option>
              {mandiOptions.map(([enVal, label]) => (
                <option key={enVal} value={enVal}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DFDDD4]">
          {categories.map((cat) => {
            const isActive = categoryFilter === cat;
            const label =
              cat === 'all' ? copy.mandi.allCategories : copy.mandi.categories[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 min-h-[40px] text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A] ${
                  isActive
                    ? 'bg-[#1B5E3A] text-white'
                    : 'bg-[#F8F7F3] text-[#4D574B] hover:text-[#1D241C] hover:bg-[#F1EFE8]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Market Data Grid / Empty State */}
      {filteredRates.length === 0 ? (
        <div className="p-8 bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl text-center space-y-4">
          <h2 className="text-xl font-bold text-[#1D241C]">
            {copy.mandi.noResultsTitle}
          </h2>
          <p className="text-base text-[#4D574B] max-w-md mx-auto">
            {copy.mandi.noResultsDesc}
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
          >
            {copy.mandi.clearFilters}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F7F3] border-b border-[#DFDDD4] text-xs font-semibold text-[#4D574B]">
                    <th className="py-3.5 px-5">{copy.mandi.colCrop}</th>
                    <th className="py-3.5 px-4">{copy.mandi.colMandi}</th>
                    <th className="py-3.5 px-4">{copy.mandi.colCategory}</th>
                    <th className="py-3.5 px-4 text-right">
                      {primaryUnit === 'quintal'
                        ? copy.mandi.colQuintal
                        : copy.mandi.colKg}
                    </th>
                    <th className="py-3.5 px-4 text-right">
                      {primaryUnit === 'quintal'
                        ? copy.mandi.colKg
                        : copy.mandi.colQuintal}
                    </th>
                    <th className="py-3.5 px-4 text-right">{copy.mandi.colChange}</th>
                    <th className="py-3.5 px-5 text-right">{copy.mandi.colArrivals}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFDDD4] text-sm">
                  {filteredRates.map((row) => {
                    const isUp = row.trend === 'up';
                    const isDown = row.trend === 'down';
                    const changeColor = isUp
                      ? 'text-[#15803D]'
                      : isDown
                        ? 'text-[#B91C1C]'
                        : 'text-[#4D574B]';

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-[#F8F7F3]/75 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <p className="font-bold text-[#1D241C] text-base">
                            {tText(row.cropName, language)}
                          </p>
                          <p className="text-xs text-[#4D574B]">
                            {tText(row.variety, language)}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-medium text-[#1D241C]">
                            {tText(row.mandiName, language)}
                          </p>
                          <p className="text-xs text-[#4D574B]">
                            {tText(row.district, language)}, {tText(row.state, language)}
                          </p>
                        </td>

                        <td className="py-4 px-4 text-[#4D574B]">
                          {copy.mandi.categories[row.category]}
                        </td>

                        <td className="py-4 px-4 text-right font-bold text-[#1D241C] text-base tabular-nums">
                          {primaryUnit === 'quintal'
                            ? formatINR(row.pricePerQuintal)
                            : formatINR(row.pricePerKg)}
                        </td>

                        <td className="py-4 px-4 text-right font-mono text-[#4D574B] tabular-nums">
                          {primaryUnit === 'quintal'
                            ? formatINR(row.pricePerKg)
                            : formatINR(row.pricePerQuintal)}
                        </td>

                        <td className={`py-4 px-4 text-right font-semibold tabular-nums ${changeColor}`}>
                          <span className="inline-flex items-center justify-end gap-1">
                            {isUp && <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
                            {isDown && <ArrowDownRight className="w-4 h-4 shrink-0" aria-hidden="true" />}
                            {!isUp && !isDown && <Minus className="w-4 h-4 shrink-0" aria-hidden="true" />}
                            <span>
                              {isUp ? '+' : ''}
                              {formatINR(row.deltaQuintal)}
                              <span className="ml-1.5 font-normal opacity-85">
                                ({isUp ? '+' : ''}
                                {row.deltaPercent}%)
                              </span>
                            </span>
                            <span className="sr-only">
                              {isUp
                                ? copy.mandi.upLabel
                                : isDown
                                  ? copy.mandi.downLabel
                                  : copy.mandi.flatLabel}
                            </span>
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right text-[#4D574B] tabular-nums">
                          {row.arrivalsTonnes} {copy.mandi.tonnesUnit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards View */}
          <div className="md:hidden space-y-3">
            {filteredRates.map((row) => {
              const isUp = row.trend === 'up';
              const isDown = row.trend === 'down';
              const changeColor = isUp
                ? 'text-[#15803D]'
                : isDown
                  ? 'text-[#B91C1C]'
                  : 'text-[#4D574B]';

              return (
                <article
                  key={row.id}
                  className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[#1D241C]">
                        {tText(row.cropName, language)}
                      </h3>
                      <p className="text-xs text-[#4D574B]">
                        {tText(row.variety, language)} · {copy.mandi.categories[row.category]}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <p className="text-lg font-bold text-[#1D241C]">
                        {primaryUnit === 'quintal'
                          ? formatINR(row.pricePerQuintal)
                          : formatINR(row.pricePerKg)}
                      </p>
                      <p className="text-xs text-[#4D574B]">
                        {primaryUnit === 'quintal'
                          ? `${formatINR(row.pricePerKg)} ${copy.mandi.perKg}`
                          : `${formatINR(row.pricePerQuintal)} ${copy.mandi.perQuintal}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#DFDDD4] text-xs">
                    <span className="text-[#4D574B]">
                      {tText(row.mandiName, language)}, {tText(row.district, language)}
                    </span>
                    <span className={`font-semibold tabular-nums inline-flex items-center gap-1 ${changeColor}`}>
                      {isUp && <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />}
                      {isDown && <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />}
                      <span>
                        {isUp ? '+' : ''}
                        {formatINR(row.deltaQuintal)} ({isUp ? '+' : ''}
                        {row.deltaPercent}%)
                      </span>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
