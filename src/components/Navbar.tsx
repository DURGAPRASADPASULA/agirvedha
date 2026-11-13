import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Cloud, Globe, Menu, X } from 'lucide-react';
import { LANGUAGE_OPTIONS, UI_COPY } from '../i18n/translations';
import type { Language, NavSection } from '../types/agri';

interface NavbarProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  user: User | null;
}

const SHORT_LANG_CODE: Record<Language, string> = {
  en: 'EN',
  hi: 'हिं',
  mr: 'मरा',
  pa: 'ਪੰ',
  gu: 'ગુ',
  ta: 'தமி',
  te: 'తె',
  kn: 'ಕ',
  ml: 'മ',
  bn: 'বাং',
  or: 'ଓ',
  as: 'অ',
  ur: 'ار',
  bho: 'भो',
  ne: 'ने',
  sa: 'सं',
};

export function Navbar({
  language,
  onSelectLanguage,
  activeSection,
  onNavigate,
  user,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [preferredRegional, setPreferredRegional] = useState<Language>(() =>
    language !== 'en' ? language : 'hi'
  );

  const copy = UI_COPY[language];

  const navItems: { id: NavSection; label: string }[] = [
    { id: 'home', label: copy.nav.home },
    { id: 'weather', label: copy.nav.weather },
    { id: 'planner', label: copy.nav.planner },
    { id: 'marketplace', label: copy.nav.marketplace },
    { id: 'mandi', label: copy.nav.mandi },
    { id: 'doctor', label: copy.nav.doctor },
  ];

  const handleNavClick = (section: NavSection) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  const handleSelectLang = (nextLang: Language) => {
    if (nextLang !== 'en') {
      setPreferredRegional(nextLang);
    }
    onSelectLanguage(nextLang);
  };

  const regionalTarget = language !== 'en' ? language : preferredRegional;

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#DFDDD4]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 lg:gap-4">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="text-lg sm:text-xl font-bold tracking-tight text-[#1B5E3A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B5E3A] cursor-pointer"
        >
          AgriVeda
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-2.5 xl:gap-5 text-sm font-medium text-[#4D574B]"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A] ${
                  isActive
                    ? 'border-[#1B5E3A] text-[#1D241C] font-semibold'
                    : 'border-transparent hover:text-[#1D241C] hover:border-[#DFDDD4]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Workspace Sync + Quick Language Toggle + 16-Language Selector + Mobile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('workspace')}
            aria-current={activeSection === 'workspace' ? 'page' : undefined}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === 'workspace'
                ? 'bg-[#F1EFE8] border-[#1B5E3A] text-[#1B5E3A]'
                : 'bg-[#F8F7F3] border-[#DFDDD4] text-[#1D241C] hover:bg-[#F1EFE8]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-[#1B5E3A] shrink-0" aria-hidden="true" />
            <span>
              {user
                ? user.displayName?.split(' ')[0] || copy.nav.workspace
                : copy.nav.workspace}
            </span>
          </button>

          {/* 1-Click Quick Language Toggle */}
          <div
            role="group"
            aria-label={copy.languageSwitch.quickToggleAria}
            data-testid="language-quick-toggle"
            className="inline-flex items-center bg-[#F1EFE8] border border-[#DFDDD4] rounded-lg p-0.5 shrink-0"
          >
            <button
              type="button"
              data-testid="lang-toggle-en"
              aria-pressed={language === 'en'}
              onClick={() => handleSelectLang('en')}
              className={`px-2 py-1.5 min-h-[34px] text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                language === 'en'
                  ? 'bg-[#1B5E3A] text-white'
                  : 'text-[#4D574B] hover:text-[#1D241C]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              data-testid="lang-toggle-regional"
              aria-pressed={language !== 'en'}
              onClick={() => handleSelectLang(regionalTarget)}
              className={`px-2 py-1.5 min-h-[34px] text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                language !== 'en'
                  ? 'bg-[#1B5E3A] text-white'
                  : 'text-[#4D574B] hover:text-[#1D241C]'
              }`}
            >
              {SHORT_LANG_CODE[regionalTarget]}
            </button>
          </div>

          {/* 16-Language Selector */}
          <div className="relative inline-flex items-center shrink-0">
            <Globe
              className="w-3.5 h-3.5 text-white absolute left-2.5 pointer-events-none"
              aria-hidden="true"
            />
            <select
              aria-label={copy.languageToggleAria}
              data-testid="language-select"
              value={language}
              onChange={(e) => handleSelectLang(e.target.value as Language)}
              className="pl-7 pr-2 py-2 min-h-[40px] max-w-[104px] sm:max-w-[172px] text-xs sm:text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option
                  key={opt.code}
                  value={opt.code}
                  className="bg-[#FFFFFF] text-[#1D241C]"
                >
                  {opt.code === 'en'
                    ? 'English'
                    : `${opt.nativeName} (${opt.englishName})`}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#DFDDD4] text-[#1D241C] bg-[#F8F7F3] hover:bg-[#F1EFE8] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden border-t border-[#DFDDD4] bg-[#FFFFFF] px-4 py-3 space-y-2"
        >
          <div className="space-y-1">
            {[...navItems, { id: 'workspace' as NavSection, label: copy.nav.workspace }].map(
              (item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full text-left px-4 py-3 min-h-[44px] rounded-lg text-base font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#F1EFE8] text-[#1B5E3A] font-semibold'
                        : 'text-[#1D241C] hover:bg-[#F8F7F3]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              }
            )}
          </div>

          {/* Mobile Quick 16-Language Grid */}
          <div className="pt-2 border-t border-[#DFDDD4]">
            <p className="text-xs font-semibold text-[#4D574B] mb-2 px-1">
              {copy.languageSwitch.allLanguagesAria}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = opt.code === language;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      handleSelectLang(opt.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-2 py-2 text-xs font-medium rounded-lg border text-center truncate cursor-pointer ${
                      active
                        ? 'bg-[#1B5E3A] border-[#1B5E3A] text-white font-semibold'
                        : 'bg-[#F8F7F3] border-[#DFDDD4] text-[#1D241C]'
                    }`}
                  >
                    {opt.nativeName}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
