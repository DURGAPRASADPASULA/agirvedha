import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  BookmarkCheck,
  Calendar,
  CalendarPlus,
  Droplets,
  MessageSquare,
  RotateCcw,
  Sprout,
} from 'lucide-react';
import { tText, UI_COPY } from '../i18n/translations';
import { recommendCrops } from '../utils/agriLogic';
import { saveCropPlanToFirestore } from '../services/firebase';
import { createCalendarEvent } from '../services/workspaceApi';
import type {
  AgroRegion,
  AgroSeason,
  CropCatalogItem,
  CropPlannerInput,
  Language,
  RainfallLevel,
  SoilType,
  TemperatureBand,
} from '../types/agri';
import type { PendingConfirmation } from './ConfirmActionModal';

interface CropPlannerViewProps {
  language: Language;
  regions: AgroRegion[];
  catalog: CropCatalogItem[];
  plannerInput: CropPlannerInput;
  onUpdateInput: (next: CropPlannerInput) => void;
  onResetInput: () => void;
  user: User | null;
  accessToken: string | null;
  onRequestSignIn: () => void;
  onRequestConfirm: (pending: PendingConfirmation) => void;
  onNotify: (msg: string) => void;
  onAskAi: (topicLabel: string, promptText: string) => void;
}

export function CropPlannerView({
  language,
  regions,
  catalog,
  plannerInput,
  onUpdateInput,
  onResetInput,
  user,
  accessToken,
  onRequestSignIn,
  onRequestConfirm,
  onNotify,
  onAskAi,
}: CropPlannerViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const copy = UI_COPY[language];

  const recommendations = useMemo(
    () => recommendCrops(catalog, plannerInput),
    [catalog, plannerInput]
  );

  const soilOptions: SoilType[] = ['alluvial', 'black', 'red', 'sandy'];
  const seasonOptions: AgroSeason[] = ['Kharif', 'Rabi', 'Zaid'];
  const rainfallOptions: RainfallLevel[] = ['low', 'moderate', 'high'];
  const tempOptions: TemperatureBand[] = ['cool', 'mild', 'warm'];

  const handleSavePlan = async () => {
    if (!user) {
      onRequestSignIn();
      return;
    }
    const topCrop = recommendations[0];
    setIsSaving(true);
    try {
      await saveCropPlanToFirestore({
        regionId: plannerInput.regionId,
        soilType: plannerInput.soilType,
        season: plannerInput.season,
        expectedRainfall: plannerInput.expectedRainfall,
        temperatureBand: plannerInput.temperatureBand,
        topCropName: topCrop ? tText(topCrop.name, language) : 'Seasonal Plan',
        notes: topCrop ? tText(topCrop.sowingTips, language) : 'Saved from Crop Planner',
      });
      onNotify(copy.planner.planSavedNote);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to save crop plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleSowing = (cropName: string, tip: string) => {
    if (!accessToken) {
      onRequestSignIn();
      return;
    }
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const summary = `AgriVeda Sowing Prep: ${cropName}`;
    onRequestConfirm({
      title:
        language === 'en'
          ? 'Add Sowing Reminder to Google Calendar?'
          : 'Google Calendar में बुवाई रिमाइंडर जोड़ें?',
      description: `Creates a 08:00 AM IST event on ${nextWeek}.`,
      details: [`Crop: ${cropName}`, `Season: ${plannerInput.season}`],
      onConfirm: async () => {
        await createCalendarEvent(accessToken, summary, tip, nextWeek);
        onNotify(
          language === 'en'
            ? `Sowing reminder added to Google Calendar for ${nextWeek}.`
            : `${nextWeek} के लिए बुवाई रिमाइंडर Google Calendar में जोड़ा गया।`
        );
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1D241C] tracking-tight">
            {copy.planner.heading}
          </h1>
          <p className="text-base text-[#4D574B] mt-2 leading-relaxed">
            {copy.planner.subheading}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleSavePlan()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer whitespace-nowrap shrink-0 self-start lg:self-auto"
        >
          <BookmarkCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{copy.planner.savePlanBtn}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Selection Panel */}
        <section
          aria-labelledby="planner-form-heading"
          className="lg:col-span-5 bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#DFDDD4]">
            <h2 id="planner-form-heading" className="text-xl font-bold text-[#1D241C]">
              {copy.planner.formHeading}
            </h2>
            <button
              type="button"
              onClick={onResetInput}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4D574B] hover:text-[#1D241C] cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{copy.planner.resetBtn}</span>
            </button>
          </div>

          {/* Region Dropdown */}
          <div>
            <label
              htmlFor="planner-region"
              className="block text-sm font-semibold text-[#1D241C] mb-2"
            >
              {copy.planner.regionLabel}
            </label>
            <select
              id="planner-region"
              value={plannerInput.regionId}
              onChange={(e) =>
                onUpdateInput({ ...plannerInput, regionId: e.target.value })
              }
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-base text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            >
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {tText(region.name, language)}
                </option>
              ))}
            </select>
          </div>

          {/* Soil Type Selector */}
          <div>
            <label
              htmlFor="planner-soil"
              className="block text-sm font-semibold text-[#1D241C] mb-2"
            >
              {copy.planner.soilLabel}
            </label>
            <select
              id="planner-soil"
              value={plannerInput.soilType}
              onChange={(e) =>
                onUpdateInput({
                  ...plannerInput,
                  soilType: e.target.value as SoilType,
                })
              }
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-base text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            >
              {soilOptions.map((soil) => (
                <option key={soil} value={soil}>
                  {copy.planner.soils[soil]}
                </option>
              ))}
            </select>
          </div>

          {/* Upcoming 4-Month Season */}
          <div>
            <p className="text-sm font-semibold text-[#1D241C] mb-2">
              {copy.planner.seasonLabel}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {seasonOptions.map((season) => {
                const isActive = plannerInput.season === season;
                return (
                  <button
                    key={season}
                    type="button"
                    onClick={() =>
                      onUpdateInput({ ...plannerInput, season })
                    }
                    className={`px-3 py-2.5 min-h-[44px] text-sm font-medium rounded-xl border text-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A] ${
                      isActive
                        ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]'
                        : 'bg-[#F8F7F3] text-[#1D241C] border-[#DFDDD4] hover:bg-[#F1EFE8]'
                    }`}
                  >
                    {copy.planner.seasons[season].split(' ')[0]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#4D574B] mt-1.5">
              {copy.planner.seasons[plannerInput.season]}
            </p>
          </div>

          {/* Expected 4-Month Rainfall */}
          <div>
            <label
              htmlFor="planner-rainfall"
              className="block text-sm font-semibold text-[#1D241C] mb-2"
            >
              {copy.planner.rainfallLabel}
            </label>
            <select
              id="planner-rainfall"
              value={plannerInput.expectedRainfall}
              onChange={(e) =>
                onUpdateInput({
                  ...plannerInput,
                  expectedRainfall: e.target.value as RainfallLevel,
                })
              }
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-base text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            >
              {rainfallOptions.map((tier) => (
                <option key={tier} value={tier}>
                  {copy.planner.rainfall[tier]}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Temperature Band */}
          <div>
            <label
              htmlFor="planner-temp"
              className="block text-sm font-semibold text-[#1D241C] mb-2"
            >
              {copy.planner.tempLabel}
            </label>
            <select
              id="planner-temp"
              value={plannerInput.temperatureBand}
              onChange={(e) =>
                onUpdateInput({
                  ...plannerInput,
                  temperatureBand: e.target.value as TemperatureBand,
                })
              }
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-base text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            >
              {tempOptions.map((band) => (
                <option key={band} value={band}>
                  {copy.planner.temp[band]}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Right Recommendations Output */}
        <section
          aria-labelledby="planner-results-heading"
          className="lg:col-span-7 space-y-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="planner-results-heading" className="text-2xl font-bold text-[#1D241C]">
              {copy.planner.resultsHeading}
            </h2>
            <p className="text-sm font-medium text-[#4D574B] tabular-nums">
              {recommendations.length} {copy.planner.resultsCountSuffix}
            </p>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-8 bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl text-center space-y-4">
              <Sprout className="w-10 h-10 text-[#6B4423] mx-auto" aria-hidden="true" />
              <div>
                <h3 className="text-xl font-bold text-[#1D241C]">
                  {copy.planner.noMatchTitle}
                </h3>
                <p className="text-base text-[#4D574B] mt-1 max-w-md mx-auto">
                  {copy.planner.noMatchDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={onResetInput}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
              >
                {copy.planner.resetBtn}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((crop) => (
                <article
                  key={crop.id}
                  className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#DFDDD4]">
                    <div>
                      <p className="text-xs font-medium text-[#6B4423] mb-1">
                        {copy.mandi.categories[crop.category]} · {crop.idealSeasons.join(' / ')}
                      </p>
                      <h3 className="text-xl font-bold text-[#1D241C]">
                        {tText(crop.name, language)}
                      </h3>
                      <p className="text-sm text-[#4D574B] mt-1">
                        {tText(crop.fitSummary, language)}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <p className="text-xs text-[#4D574B]">{copy.planner.matchScoreLabel}</p>
                      <p className="text-2xl font-bold text-[#1B5E3A] tabular-nums">
                        {crop.matchScore}%
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-[#6B4423] mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-[#4D574B]">{copy.planner.harvestWindow}</p>
                        <p className="font-semibold text-[#1D241C] tabular-nums">
                          {crop.harvestDaysMin}–{crop.harvestDaysMax} {copy.planner.daysUnit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Droplets className="w-4 h-4 text-[#1B5E3A] mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-[#4D574B]">{copy.planner.waterNeed}</p>
                        <p className="font-semibold text-[#1D241C]">
                          {copy.planner.waterLevels[crop.waterNeed]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Sprout className="w-4 h-4 text-[#1B5E3A] mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="text-[#4D574B]">{copy.planner.expectedYield}</p>
                        <p className="font-semibold text-[#1D241C] tabular-nums">
                          {tText(crop.expectedYieldPerAcre, language)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sowing & Fertilizer Guidance */}
                  <div className="pt-3 border-t border-[#DFDDD4] grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-[#1D241C] mb-1">
                        {copy.planner.sowingTips}
                      </p>
                      <p className="text-[#4D574B] leading-relaxed">
                        {tText(crop.sowingTips, language)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1D241C] mb-1">
                        {copy.planner.fertilizerNote}
                      </p>
                      <p className="text-[#4D574B] leading-relaxed">
                        {tText(crop.fertilizerNote, language)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#DFDDD4] flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleScheduleSowing(tText(crop.name, language), tText(crop.sowingTips, language))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5E3A] hover:text-[#14492C] cursor-pointer"
                    >
                      <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                      <span>{copy.planner.addReminderBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cropName = tText(crop.name, language);
                        onAskAi(
                          cropName,
                          language === 'en'
                            ? `I am planning to sow ${cropName} in ${plannerInput.soilType} soil during ${plannerInput.season}. What common diseases, fertilizer schedule, and water management problems should I watch out for?`
                            : `मैं ${plannerInput.season} में ${cropName} की बुवाई करने की सोच रहा हूँ। इसमें आने वाले मुख्य रोग, खाद और सिंचाई की समस्याओं से कैसे बचें?`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B4423] hover:text-[#1D241C] cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{copy.doctor.askAiAboutThisBtn}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
