import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  CloudSun,
  FolderSync,
  IndianRupee,
  ShieldAlert,
  ShoppingBag,
  Sprout,
} from 'lucide-react';
import { tText, UI_COPY } from '../i18n/translations';
import { formatINR } from '../utils/agriLogic';
import type { Language, LocationWeather, MandiPriceWithDelta, NavSection } from '../types/agri';
import { ResilientImage } from './ResilientImage';

interface HomeViewProps {
  language: Language;
  featuredWeather: LocationWeather;
  topGainerMandi: MandiPriceWithDelta | undefined;
  marketplaceCount: number;
  diseaseCount: number;
  onNavigate: (section: NavSection) => void;
}

export function HomeView({
  language,
  featuredWeather,
  topGainerMandi,
  marketplaceCount,
  diseaseCount,
  onNavigate,
}: HomeViewProps) {
  const copy = UI_COPY[language];

  const modules = [
    {
      id: 'weather' as NavSection,
      index: '01',
      title: copy.home.modules.weatherTitle,
      description: copy.home.modules.weatherDesc,
      icon: CloudSun,
      image: null,
      imageAlt: '',
    },
    {
      id: 'planner' as NavSection,
      index: '02',
      title: copy.home.modules.plannerTitle,
      description: copy.home.modules.plannerDesc,
      icon: Sprout,
      image: '/src/assets/images/crop_planner_field_1794548772834.jpg',
      imageAlt:
        language === 'en'
          ? 'Fertile Indian farmland soil with sprouting green crop rows'
          : 'उपजाऊ भारतीय खेत की मिट्टी में उगती हरी फसलों की कतारें',
    },
    {
      id: 'marketplace' as NavSection,
      index: '03',
      title: copy.home.modules.marketplaceTitle,
      description: copy.home.modules.marketplaceDesc,
      icon: ShoppingBag,
      image: '/src/assets/images/market_fresh_tomatoes_1794550105613.jpg',
      imageAlt:
        language === 'en'
          ? 'Fresh farm-picked desi tomatoes and produce basket for direct customer sale'
          : 'सीधी बिक्री के लिए खेत से तोड़े ताज़े देसी टमाटर और हरी मिर्च की टोकरी',
    },
    {
      id: 'mandi' as NavSection,
      index: '04',
      title: copy.home.modules.mandiTitle,
      description: copy.home.modules.mandiDesc,
      icon: IndianRupee,
      image: '/src/assets/images/mandi_produce_market_1794548773535.jpg',
      imageAlt:
        language === 'en'
          ? 'Indian agricultural wholesale Mandi sacks of wheat, red onions, and pulses'
          : 'भारतीय कृषि थोक मंडी में गेहूँ, लाल प्याज और दालों की बोरियाँ',
    },
    {
      id: 'doctor' as NavSection,
      index: '05',
      title: copy.home.modules.doctorTitle,
      description: copy.home.modules.doctorDesc,
      icon: ShieldAlert,
      image: '/src/assets/images/crop_doctor_leaf_1794548773496.jpg',
      imageAlt:
        language === 'en'
          ? 'Farmer inspecting healthy green paddy and vegetable leaves in morning sunlight'
          : 'सुबह की धूप में किसान द्वारा धान और सब्जी की पत्तियों का निरीक्षण',
    },
    {
      id: 'workspace' as NavSection,
      index: '06',
      title: copy.home.modules.workspaceTitle,
      description: copy.home.modules.workspaceDesc,
      icon: FolderSync,
      image: '/src/assets/images/market_wheat_pulses_1794550114284.jpg',
      imageAlt:
        language === 'en'
          ? 'Sharbati wheat and green moong grains ready for Mandi tracking and record sync'
          : 'मंडी भाव व डिजिटल रिकॉर्ड सिंक के लिए तैयार शरबती गेहूँ और मूंग दाने',
    },
  ];

  const advisories = [
    {
      season: language === 'en' ? 'Rabi Sowing · Indo-Gangetic & Malwa' : 'रबी बुवाई · मैदानी व मालवा क्षेत्र',
      text:
        language === 'en'
          ? 'Soil moisture is favorable for timely Wheat (HD-2967) and Desi Chana sowing. Treat seeds with Trichoderma before planting.'
          : 'समय पर गेहूँ (HD-2967) और देसी चने की बुवाई के लिए मिट्टी में नमी अनुकूल है। बुवाई से पहले बीज को ट्राइकोडर्मा से उपचारित करें।',
    },
    {
      season: language === 'en' ? 'Direct Farm Harvest · Nashik & Sehore' : 'सीधा बाज़ार · नासिक व सीहोर',
      text:
        language === 'en'
          ? 'Direct customer demand for Sharbati Wheat and shade-cured Red Onions is strong this week. List morning harvests early for same-day pickup.'
          : 'इस सप्ताह शरबती गेहूँ और लाल प्याज की सीधी मांग अच्छी है। तुरंत ग्राहक ऑर्डर पाने के लिए सुबह की कटाई सूचीबद्ध करें।',
    },
    {
      season: language === 'en' ? 'AI Plant Health Alert · Fog & Moisture' : 'AI फसल सुरक्षा चेतावनी · कोहरा व नमी',
      text:
        language === 'en'
          ? 'Watch Potato and Tomato plots for Early/Late Blight spots during morning dew; use AI Camera Crop Doctor to check symptoms early.'
          : 'सुबह की ओस में आलू और टमाटर में झुलसा रोग के धब्बों पर नज़र रखें; लक्षण दिखते ही AI कैमरे से जांच करें।',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Split Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center py-2">
          <p className="text-sm font-semibold text-[#6B4423] tracking-wide mb-3">
            {copy.home.heroKicker}
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#1D241C] leading-[1.15] tracking-tight mb-5"
            style={{ textWrap: 'balance' }}
          >
            {copy.home.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-[#4D574B] leading-relaxed max-w-xl mb-8">
            {copy.home.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('planner')}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] text-sm sm:text-base font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
            >
              <span>{copy.home.primaryCta}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('marketplace')}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] text-sm sm:text-base font-semibold text-[#1D241C] bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
            >
              <span>{copy.home.secondaryCta}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('doctor')}
              className="inline-flex items-center gap-2 px-4 py-3 min-h-[48px] text-sm font-semibold text-[#1B5E3A] bg-[#F1EFE8] hover:bg-[#E7E4DA] border border-[#DFDDD4] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{copy.home.scanCta}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-full min-h-[260px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-[#DFDDD4] bg-[#EAE7DC]">
            <ResilientImage
              src="/src/assets/images/hero_indian_farmland_1794548772559.jpg"
              alt={
                language === 'en'
                  ? 'Golden hour sunrise over irrigated wheat and mustard fields in rural India'
                  : 'ग्रामीण भारत में सिंचित गेहूँ और सरसों के हरे-भरे खेतों का सूर्योदय दृश्य'
              }
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Quick Snapshot Strip */}
      <section aria-label={copy.home.quickStripTitle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('weather')}
            className="text-left p-5 bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl hover:border-[#1B5E3A] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
          >
            <p className="text-xs font-medium text-[#4D574B] mb-1.5">
              {copy.home.kpiWeatherLabel}
            </p>
            <p className="text-2xl font-bold text-[#1D241C] tabular-nums">
              {featuredWeather.current.tempC}°C
            </p>
            <p className="text-sm text-[#4D574B] mt-1">
              {tText(featuredWeather.villageOrTown, language)}, {tText(featuredWeather.district, language)} ·{' '}
              {featuredWeather.current.rainProbPct}% {copy.weather.rainChance}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('marketplace')}
            className="text-left p-5 bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl hover:border-[#1B5E3A] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
          >
            <p className="text-xs font-medium text-[#4D574B] mb-1.5">
              {copy.home.kpiMarketplaceLabel}
            </p>
            <p className="text-2xl font-bold text-[#1B5E3A] tabular-nums">
              {marketplaceCount}
            </p>
            <p className="text-sm text-[#4D574B] mt-1">
              {language === 'en' ? 'Zero middlemen · Fresh farm harvest' : 'बिना बिचौलिए · ताज़ा खेत उपज'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('mandi')}
            className="text-left p-5 bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl hover:border-[#1B5E3A] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
          >
            <p className="text-xs font-medium text-[#4D574B] mb-1.5">
              {copy.home.kpiMandiLabel}
            </p>
            <p className="text-2xl font-bold text-[#1D241C] tabular-nums">
              {topGainerMandi ? formatINR(topGainerMandi.pricePerQuintal) : '₹2,850'}
              <span className="text-sm font-medium text-[#4D574B]"> {copy.mandi.perQuintal}</span>
            </p>
            <p className="text-sm text-[#15803D] font-medium mt-1 tabular-nums">
              {topGainerMandi
                ? `${tText(topGainerMandi.cropName, language)} · ▲ +${formatINR(topGainerMandi.deltaQuintal)}`
                : 'Onion · ▲ +₹230'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('doctor')}
            className="text-left p-5 bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl hover:border-[#1B5E3A] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
          >
            <p className="text-xs font-medium text-[#4D574B] mb-1.5">
              {copy.home.kpiDoctorLabel}
            </p>
            <p className="text-2xl font-bold text-[#1D241C] tabular-nums">
              {diseaseCount}
            </p>
            <p className="text-sm text-[#4D574B] mt-1">
              {language === 'en'
                ? 'AI camera scan + organic remedies'
                : 'AI कैमरा जांच + जैविक उपाय'}
            </p>
          </button>
        </div>
      </section>

      {/* Six Core Tools Grid */}
      <section className="space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1D241C] tracking-tight">
            {copy.home.sectionsHeading}
          </h2>
          <p className="text-base text-[#4D574B] mt-2">
            {copy.home.sectionsSubheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                {mod.image ? (
                  <div className="h-44 w-full overflow-hidden border-b border-[#DFDDD4] bg-[#EAE7DC]">
                    <ResilientImage
                      src={mod.image}
                      alt={mod.imageAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-44 w-full border-b border-[#DFDDD4] bg-[#F1EFE8] p-5 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-[#6B4423]">
                          {tText(featuredWeather.villageOrTown, language)}, {tText(featuredWeather.district, language)}
                        </p>
                        <p className="text-3xl font-bold text-[#1D241C] tabular-nums mt-1">
                          {featuredWeather.current.tempC}°C
                        </p>
                      </div>
                      <p className="text-sm font-medium text-[#4D574B] text-right">
                        {tText(featuredWeather.current.condition, language)}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#DFDDD4] text-xs">
                      {featuredWeather.fourMonthOutlook.map((m) => (
                        <div key={m.month.en}>
                          <p className="font-semibold text-[#1D241C] truncate">
                            {tText(m.month, language).slice(0, 3)}
                          </p>
                          <p className="text-[#4D574B] tabular-nums">
                            {m.expectedRainfallMm} mm
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <span className="text-xs font-mono font-semibold text-[#6B4423]">
                        {mod.index}
                      </span>
                      <Icon className="w-5 h-5 text-[#1B5E3A]" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1D241C] mb-2">
                      {mod.title}
                    </h3>
                    <p className="text-[15px] text-[#4D574B] leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => onNavigate(mod.id)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B5E3A] hover:text-[#14492C] py-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
                    >
                      <span>{copy.home.openSection}</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Seasonal Field Advisory */}
      <section className="bg-[#F1EFE8] border border-[#DFDDD4] rounded-2xl p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1D241C]">
            {copy.home.advisoryTitle}
          </h2>
          <p className="text-sm text-[#4D574B] mt-1">
            {copy.home.advisorySubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#DFDDD4]">
          {advisories.map((adv, idx) => (
            <div
              key={idx}
              className={idx > 0 ? 'pt-5 md:pt-0 md:pl-6' : ''}
            >
              <p className="text-xs font-semibold text-[#6B4423] mb-2">
                {adv.season}
              </p>
              <p className="text-[15px] text-[#1D241C] leading-relaxed">
                {adv.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
