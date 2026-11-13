import { useMemo, useState } from 'react';
import {
  ChevronDown,
  HelpCircle,
  Mail,
  MessageSquareText,
  Phone,
  Search,
} from 'lucide-react';
import { AGRI_FAQS } from '../data/faqData';
import { tText, UI_COPY } from '../i18n/translations';
import { filterFaqItems } from '../utils/agriLogic';
import type { ContactDetails, FaqCategory, Language } from '../types/agri';

interface HelpFaqSectionProps {
  language: Language;
  contactDetails: ContactDetails;
  onJumpToContact: () => void;
  onAskAi: () => void;
}

export function HelpFaqSection({
  language,
  contactDetails,
  onJumpToContact,
  onAskAi,
}: HelpFaqSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<FaqCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(AGRI_FAQS[0]?.id ?? null);

  const copy = UI_COPY[language];

  const filteredFaqs = useMemo(
    () =>
      filterFaqItems(AGRI_FAQS, categoryFilter, searchQuery, (txt) =>
        tText(txt, language)
      ),
    [categoryFilter, searchQuery, language]
  );

  const categories: (FaqCategory | 'all')[] = [
    'all',
    'weather',
    'planner',
    'marketplace',
    'mandi',
    'doctor',
    'support',
  ];

  return (
    <section
      id="help-faq"
      data-testid="help-faq-section"
      aria-labelledby="help-faq-heading"
      className="bg-[#F8F7F3] border border-[#DFDDD4] rounded-2xl p-5 sm:p-6 space-y-5"
    >
      {/* Header & Direct Link to Contact Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DFDDD4]">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#1B5E3A] shrink-0" aria-hidden="true" />
            <h2 id="help-faq-heading" className="text-xl font-bold text-[#1D241C]">
              {copy.faq.heading}
            </h2>
          </div>
          <p className="text-sm text-[#4D574B] leading-relaxed">{copy.faq.subheading}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="faq-go-to-contact-btn"
            onClick={onJumpToContact}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#1B5E3A] bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl cursor-pointer whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{copy.faq.goToContactBtn}</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer whitespace-nowrap"
          >
            <MessageSquareText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{copy.faq.askAiBtn}</span>
          </button>
        </div>
      </div>

      {/* Search & Topic Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-[#4D574B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            data-testid="faq-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={copy.faq.searchPlaceholder}
            aria-label={copy.faq.heading}
            className="w-full pl-10 pr-4 py-2 min-h-[40px] bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] placeholder:text-[#4D574B]/70 focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const active = categoryFilter === cat;
            const label =
              cat === 'all' ? copy.faq.allCategories : copy.faq.categories[cat];
            return (
              <button
                key={cat}
                type="button"
                data-testid={`faq-category-${cat}`}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#1B5E3A] text-white border-[#1B5E3A]'
                    : 'bg-[#FFFFFF] text-[#4D574B] border-[#DFDDD4] hover:text-[#1D241C] hover:bg-[#F1EFE8]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion Q&A List */}
      {filteredFaqs.length === 0 ? (
        <div className="p-6 bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl text-center space-y-1">
          <p className="text-base font-bold text-[#1D241C]">{copy.faq.noResultsTitle}</p>
          <p className="text-sm text-[#4D574B]">{copy.faq.noResultsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFaqs.map((item) => {
            const isOpen = openFaqId === item.id;
            const categoryLabel = copy.faq.categories[item.category];
            return (
              <div
                key={item.id}
                data-testid={`faq-item-${item.id}`}
                className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl overflow-hidden self-start"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${item.id}`}
                  onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                  className="w-full px-4 py-3.5 text-left flex items-start justify-between gap-3 hover:bg-[#F8F7F3]/70 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B4423]">
                      {categoryLabel}
                    </span>
                    <p className="text-sm font-bold text-[#1D241C] leading-snug">
                      {tText(item.question, language)}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#4D574B] shrink-0 mt-1 transition-transform ${
                      isOpen ? 'rotate-180 text-[#1B5E3A]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div
                    id={`faq-panel-${item.id}`}
                    className="px-4 pb-4 pt-2 border-t border-[#DFDDD4] text-sm text-[#4D574B] leading-relaxed"
                  >
                    {tText(item.answer, language)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Linked Contact Details Bar */}
      <div className="pt-3 border-t border-[#DFDDD4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[#4D574B]">
          <span className="font-semibold text-[#1D241C]">{copy.faq.stillNeedHelp}</span>
          <a
            href={`mailto:${contactDetails.email}`}
            className="inline-flex items-center gap-1 font-medium text-[#1B5E3A] hover:underline"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{contactDetails.email}</span>
          </a>
          <a
            href={`tel:${contactDetails.phone.replace(/\s+/g, '')}`}
            className="inline-flex items-center gap-1 font-mono font-semibold text-[#1D241C] hover:underline tabular-nums"
          >
            <Phone className="w-3.5 h-3.5 text-[#1B5E3A] shrink-0" aria-hidden="true" />
            <span>{contactDetails.phone}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
