import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  CheckCircle2,
  Crosshair,
  Mail,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBasket,
  Sprout,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import {
  calculateCartTotal,
  filterMarketplaceListings,
  formatCoordinates,
  formatINR,
} from '../utils/agriLogic';
import {
  createMarketplaceListing,
  deleteMarketplaceListing,
  markListingSoldOut,
  placeOrderInFirestore,
} from '../services/firebase';
import { sendGmailMessage } from '../services/workspaceApi';
import type {
  CartItem,
  CropCategory,
  Language,
  MarketplaceListing,
} from '../types/agri';
import { ResilientImage } from './ResilientImage';
import { GoogleSignInButton } from './GoogleSignInButton';
import type { PendingConfirmation } from './ConfirmActionModal';

interface MarketplaceViewProps {
  language: Language;
  listings: MarketplaceListing[];
  cart: CartItem[];
  onAddToCart: (listing: MarketplaceListing) => void;
  onUpdateCartQty: (listingId: string, deltaKg: number) => void;
  onClearCart: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => Promise<void>;
  onRequestConfirm: (pending: PendingConfirmation) => void;
  onNotify: (msg: string) => void;
  defaultSupportEmail?: string;
}

const DEFAULT_IMAGE_BY_CATEGORY: Record<CropCategory, string> = {
  grains: '/src/assets/images/market_wheat_pulses_1794550114284.jpg',
  pulses: '/src/assets/images/market_wheat_pulses_1794550114284.jpg',
  vegetables: '/src/assets/images/market_fresh_tomatoes_1794550105613.jpg',
  fruits: '/src/assets/images/market_red_onions_1794550106011.jpg',
};

async function compressImageToDataUrl(file: File): Promise<string> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawUrl.slice(0, 400000));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.72);
      resolve(compressed.length <= 420000 ? compressed : canvas.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = () => resolve(rawUrl.slice(0, 400000));
    img.src = rawUrl;
  });
}

export function MarketplaceView({
  language,
  listings,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onClearCart,
  user,
  accessToken,
  onSignIn,
  onRequestConfirm,
  onNotify,
  defaultSupportEmail,
}: MarketplaceViewProps) {
  const [mode, setMode] = useState<'customer' | 'farmer'>('customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CropCategory | 'all'>('all');
  const [cartOpen, setCartOpen] = useState(false);

  // Farmer "Sell Your Harvest" form state
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState<CropCategory>('vegetables');
  const [quantityValue, setQuantityValue] = useState('50');
  const [quantityUnit, setQuantityUnit] = useState<'kg' | 'quintal'>('kg');
  const [pricePerKg, setPricePerKg] = useState('35');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [farmerName, setFarmerName] = useState(() => user?.displayName || '');
  const [village, setVillage] = useState('');
  const [freshnessLabel, setFreshnessLabel] = useState('Harvested Today · Farm Fresh');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const [isLocatingVillage, setIsLocatingVillage] = useState(false);

  // Cart checkout state
  const [buyerName, setBuyerName] = useState(() => user?.displayName || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Contact Farmer modal state
  const [contactTarget, setContactTarget] = useState<MarketplaceListing | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const copy = UI_COPY[language];
  const cartSummary = useMemo(() => calculateCartTotal(cart), [cart]);

  const filteredListings = useMemo(
    () => filterMarketplaceListings(listings, categoryFilter, searchQuery),
    [listings, categoryFilter, searchQuery]
  );

  const categories: (CropCategory | 'all')[] = [
    'all',
    'vegetables',
    'fruits',
    'grains',
    'pulses',
  ];

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file);
      setImageDataUrl(compressed);
    } catch {
      setFormError('Could not process selected photo. Please try a smaller image.');
    }
  };

  const handlePublishSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPublishNotice(null);

    if (!user) {
      setFormError(copy.marketplace.signInToPublishHint);
      return;
    }

    const parsedQty = Number(quantityValue);
    const parsedPrice = Number(pricePerKg);
    if (!cropName.trim() || !farmerName.trim() || !village.trim()) {
      setFormError(
        language === 'en'
          ? 'Please enter crop name, farmer name, and village location.'
          : 'कृपया फसल का नाम, किसान का नाम और गाँव का स्थान भरें।'
      );
      return;
    }
    if (!Number.isFinite(parsedQty) || parsedQty <= 0 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFormError(
        language === 'en'
          ? 'Please enter valid positive quantity and ₹/kg price.'
          : 'कृपया सही मात्रा और ₹/किलो कीमत दर्ज करें।'
      );
      return;
    }

    setIsPublishing(true);
    try {
      await createMarketplaceListing({
        farmerName: farmerName.trim(),
        village: village.trim(),
        cropName: cropName.trim(),
        category,
        quantityValue: parsedQty,
        quantityUnit,
        pricePerKg: parsedPrice,
        harvestDate,
        freshnessLabel: freshnessLabel.trim() || 'Harvested Today',
        imageDataUrl: imageDataUrl || DEFAULT_IMAGE_BY_CATEGORY[category],
      });
      setCropName('');
      setVillage('');
      setImageDataUrl('');
      setPublishNotice(copy.marketplace.publishSuccess);
      onNotify(copy.marketplace.publishSuccess);
      setMode('customer');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to publish harvest listing.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const cleanBuyer = buyerName.trim() || user?.displayName || 'Customer';
    const cleanAddr = deliveryAddress.trim() || 'Local Village Pickup';
    const itemSummary = cart
      .map((c) => `${c.listing.cropName} (${c.quantityKg} kg)`)
      .join(', ');

    setIsPlacingOrder(true);
    try {
      if (user) {
        await placeOrderInFirestore(cleanBuyer, cleanAddr, cartSummary.totalInr, itemSummary);
      }
      setOrderNotice(
        `${copy.marketplace.orderConfirmedTitle}: ${itemSummary} · ${formatINR(cartSummary.totalInr)}`
      );
      onClearCart();
      onNotify(copy.marketplace.orderConfirmedDesc);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Order failed.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleUseGpsForVillage = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setFormError(copy.weather.gps.unsupportedError);
      return;
    }
    setIsLocatingVillage(true);
    setFormError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordsLabel = formatCoordinates(pos.coords.latitude, pos.coords.longitude);
        setVillage((prev) => {
          const trimmed = prev.trim();
          if (!trimmed || trimmed.startsWith('GPS:')) {
            return `GPS: ${coordsLabel}`;
          }
          const base = trimmed.replace(/\s*\(GPS:[^)]*\)$/, '');
          return `${base} (GPS: ${coordsLabel})`;
        });
        setIsLocatingVillage(false);
        onNotify(`${copy.weather.gps.coordsLabel}: ${coordsLabel}`);
      },
      (err) => {
        setIsLocatingVillage(false);
        setFormError(err.message || copy.weather.gps.permissionHint);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  const openContactFarmer = (listing: MarketplaceListing) => {
    setContactTarget(listing);
    setContactEmail(user?.email || defaultSupportEmail || '');
    setContactMessage(
      language === 'en'
        ? `Namaste ${listing.farmerName}, I would like to buy ${listing.cropName} (${formatINR(listing.pricePerKg)}/kg) from ${listing.village}. Please share pickup or delivery timing.`
        : `नमस्ते ${listing.farmerName}, मैं ${listing.village} से आपकी ${listing.cropName} (${formatINR(listing.pricePerKg)}/किलो) खरीदना चाहता हूँ। कृपया समय बताएं।`
    );
  };

  const handleSendInquiry = () => {
    if (!contactTarget) return;
    const recipient = contactEmail.trim();
    if (accessToken && recipient) {
      const subject = `AgriVeda Direct Order Inquiry: ${contactTarget.cropName}`;
      onRequestConfirm({
        title:
          language === 'en'
            ? 'Send Farmer Inquiry via Gmail?'
            : 'Gmail द्वारा किसान पूछताछ भेजें?',
        description:
          language === 'en'
            ? `Send an email inquiry regarding ${contactTarget.cropName} to ${recipient}.`
            : `${contactTarget.cropName} के लिए ${recipient} को ईमेल भेजें।`,
        details: [`To: ${recipient}`, `Subject: ${subject}`],
        onConfirm: async () => {
          await sendGmailMessage(accessToken, recipient, subject, contactMessage);
          onNotify(
            language === 'en'
              ? `Inquiry sent via Gmail to ${recipient}.`
              : `${recipient} को Gmail द्वारा संदेश भेजा गया।`
          );
          setContactTarget(null);
        },
      });
    } else {
      onNotify(
        language === 'en'
          ? `Direct inquiry logged for ${contactTarget.farmerName} (${contactTarget.village}).`
          : `${contactTarget.farmerName} (${contactTarget.village}) के लिए पूछताछ दर्ज की गई।`
      );
      setContactTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Mode Switch */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1D241C] tracking-tight">
            {copy.marketplace.heading}
          </h1>
          <p className="text-base text-[#4D574B] mt-2 leading-relaxed">
            {copy.marketplace.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-1 bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl">
            <button
              type="button"
              onClick={() => setMode('customer')}
              className={`px-4 py-2 min-h-[40px] text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mode === 'customer'
                  ? 'bg-[#FFFFFF] text-[#1D241C] shadow-xs'
                  : 'text-[#4D574B] hover:text-[#1D241C]'
              }`}
            >
              {copy.marketplace.customerTab}
            </button>
            <button
              type="button"
              onClick={() => setMode('farmer')}
              className={`px-4 py-2 min-h-[40px] text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                mode === 'farmer'
                  ? 'bg-[#FFFFFF] text-[#1D241C] shadow-xs'
                  : 'text-[#4D574B] hover:text-[#1D241C]'
              }`}
            >
              {copy.marketplace.farmerTab}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingBasket className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{copy.marketplace.cartBtn}</span>
            <span className="font-mono tabular-nums">
              ({cartSummary.totalItemsKg} kg · {formatINR(cartSummary.totalInr)})
            </span>
          </button>
        </div>
      </div>

      {publishNotice && (
        <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl flex items-center gap-3 text-sm text-[#14532D]">
          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{publishNotice}</span>
        </div>
      )}

      {mode === 'customer' ? (
        <div className="space-y-6">
          {/* Customer Search & Category Filter */}
          <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6">
                <label
                  htmlFor="marketplace-search"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.searchLabel}
                </label>
                <div className="relative">
                  <Search
                    className="w-4 h-4 text-[#4D574B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="marketplace-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={copy.marketplace.searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] placeholder:text-[#4D574B]/70 focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
                  />
                </div>
              </div>

              <div className="md:col-span-6 flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isActive = categoryFilter === cat;
                  const label =
                    cat === 'all'
                      ? copy.marketplace.allCategories
                      : copy.mandi.categories[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-4 py-2 min-h-[40px] text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
            </div>
          </section>

          {/* Produce Grid */}
          {filteredListings.length === 0 ? (
            <div className="p-8 bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl text-center space-y-2">
              <h2 className="text-xl font-bold text-[#1D241C]">
                {copy.marketplace.noListingsTitle}
              </h2>
              <p className="text-sm text-[#4D574B]">{copy.marketplace.noListingsDesc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item) => {
                const isOwner = Boolean(user && item.ownerId === user.uid && !item.isDemo);
                return (
                  <article
                    key={item.id}
                    className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-48 w-full overflow-hidden border-b border-[#DFDDD4] bg-[#EAE7DC]">
                        <ResilientImage
                          src={item.imageDataUrl || DEFAULT_IMAGE_BY_CATEGORY[item.category]}
                          alt={`${item.cropName} from ${item.farmerName}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-5 space-y-3">
                        {/* Zero-pill unboxed typographic metadata */}
                        <p className="text-xs font-semibold text-[#1B5E3A]">
                          {copy.mandi.categories[item.category]} · {item.freshnessLabel}
                        </p>

                        <div className="flex items-start justify-between gap-3">
                          <h2 className="text-xl font-bold text-[#1D241C] leading-snug">
                            {item.cropName}
                          </h2>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-bold text-[#1D241C] tabular-nums">
                              {formatINR(item.pricePerKg)}
                            </p>
                            <p className="text-xs text-[#4D574B]">{copy.mandi.perKg}</p>
                          </div>
                        </div>

                        <div className="text-sm text-[#4D574B] space-y-1 pt-2 border-t border-[#DFDDD4]">
                          <p>
                            <span className="font-semibold text-[#1D241C]">
                              {copy.marketplace.farmerLabel}:
                            </span>{' '}
                            {item.farmerName}
                          </p>
                          <p className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#6B4423] shrink-0" aria-hidden="true" />
                            <span>{item.village}</span>
                          </p>
                          <p className="text-xs tabular-nums">
                            {copy.marketplace.availableLabel}: {item.quantityValue}{' '}
                            {item.quantityUnit} · {copy.marketplace.harvestedLabel}:{' '}
                            {item.harvestDate}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(item);
                            onNotify(
                              language === 'en'
                                ? `Added 5 kg of ${item.cropName} to basket.`
                                : `${item.cropName} (5 किलो) टोकरी में जोड़ा गया।`
                            );
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{copy.marketplace.addToCartBtn}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openContactFarmer(item)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl cursor-pointer whitespace-nowrap"
                        >
                          <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{copy.marketplace.contactFarmerBtn}</span>
                        </button>
                      </div>

                      {isOwner && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DFDDD4]">
                          <button
                            type="button"
                            onClick={() =>
                              onRequestConfirm({
                                title:
                                  language === 'en'
                                    ? 'Mark harvest as Sold Out?'
                                    : 'उपज को बिक चुका चिह्नित करें?',
                                description: `${item.cropName} (${item.quantityValue} ${item.quantityUnit})`,
                                onConfirm: async () => {
                                  await markListingSoldOut(item);
                                  onNotify('Listing marked as sold out.');
                                },
                              })
                            }
                            className="text-xs font-semibold text-[#6B4423] hover:underline cursor-pointer"
                          >
                            {copy.marketplace.markSoldOutBtn}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onRequestConfirm({
                                title:
                                  language === 'en'
                                    ? 'Delete your harvest listing?'
                                    : 'अपनी फसल सूची हटाएं?',
                                description: `${item.cropName} will be removed from the marketplace.`,
                                tone: 'danger',
                                onConfirm: async () => {
                                  await deleteMarketplaceListing(item.id);
                                  onNotify('Harvest listing removed.');
                                },
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{copy.marketplace.deleteListingBtn}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Farmer View: Sell Your Harvest Form */
        <section className="max-w-3xl bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#DFDDD4]">
            <h2 className="text-2xl font-bold text-[#1D241C]">
              {copy.marketplace.sellFormHeading}
            </h2>
            <p className="text-sm text-[#4D574B] mt-1">
              {copy.marketplace.sellFormSubheading}
            </p>
          </div>

          {!user && (
            <div className="p-4 bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-sm text-[#1D241C]">
                {copy.marketplace.signInToPublishHint}
              </p>
              <GoogleSignInButton onClick={onSignIn} />
            </div>
          )}

          {formError && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C]">
              {formError}
            </div>
          )}

          <form onSubmit={handlePublishSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sell-crop-name"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.cropNameLabel}
                </label>
                <input
                  id="sell-crop-name"
                  type="text"
                  required
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder={copy.marketplace.cropNamePlaceholder}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C]"
                />
              </div>

              <div>
                <label
                  htmlFor="sell-category"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.categoryLabel}
                </label>
                <select
                  id="sell-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CropCategory)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C]"
                >
                  <option value="vegetables">{copy.mandi.categories.vegetables}</option>
                  <option value="fruits">{copy.mandi.categories.fruits}</option>
                  <option value="grains">{copy.mandi.categories.grains}</option>
                  <option value="pulses">{copy.mandi.categories.pulses}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="sell-qty"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.quantityLabel}
                </label>
                <input
                  id="sell-qty"
                  type="number"
                  min={1}
                  required
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="sell-unit"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.unitLabel}
                </label>
                <select
                  id="sell-unit"
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value as 'kg' | 'quintal')}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C]"
                >
                  <option value="kg">kg</option>
                  <option value="quintal">quintal</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sell-price"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.pricePerKgLabel}
                </label>
                <input
                  id="sell-price"
                  type="number"
                  min={1}
                  required
                  value={pricePerKg}
                  onChange={(e) => setPricePerKg(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sell-farmer-name"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.farmerNameLabel}
                </label>
                <input
                  id="sell-farmer-name"
                  type="text"
                  required
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder={copy.marketplace.farmerNamePlaceholder}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C]"
                />
              </div>

              <div>
                <label
                  htmlFor="sell-village"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.villageLabel}
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="sell-village"
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder={copy.marketplace.villagePlaceholder}
                    className="flex-1 min-w-0 px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C]"
                  />
                  <button
                    type="button"
                    data-testid="marketplace-use-gps-btn"
                    onClick={handleUseGpsForVillage}
                    disabled={isLocatingVillage}
                    aria-label={copy.weather.gps.detectBtn}
                    title={copy.weather.gps.detectBtn}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[44px] text-xs font-semibold text-[#1B5E3A] bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
                  >
                    <Crosshair className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{isLocatingVillage ? '...' : 'GPS'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sell-harvest-date"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.harvestDateLabel}
                </label>
                <input
                  id="sell-harvest-date"
                  type="date"
                  required
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C]"
                />
              </div>

              <div>
                <label
                  htmlFor="sell-freshness"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.marketplace.freshnessLabel}
                </label>
                <input
                  id="sell-freshness"
                  type="text"
                  value={freshnessLabel}
                  onChange={(e) => setFreshnessLabel(e.target.value)}
                  placeholder={copy.marketplace.freshnessPlaceholder}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sell-photo"
                className="block text-sm font-semibold text-[#1D241C] mb-1.5"
              >
                {copy.marketplace.photoLabel}
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl text-sm font-medium text-[#1D241C] cursor-pointer">
                  <Upload className="w-4 h-4 text-[#1B5E3A]" aria-hidden="true" />
                  <span>{copy.marketplace.photoLabel}</span>
                  <input
                    id="sell-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                </label>
                <p className="text-xs text-[#4D574B]">{copy.marketplace.photoHint}</p>
              </div>
              {imageDataUrl && (
                <div className="mt-3 w-36 h-24 rounded-xl overflow-hidden border border-[#DFDDD4]">
                  <img
                    src={imageDataUrl}
                    alt="Uploaded harvest preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPublishing}
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] text-base font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer disabled:opacity-60"
              >
                <Sprout className="w-5 h-5" aria-hidden="true" />
                <span>
                  {isPublishing
                    ? copy.marketplace.publishingBtn
                    : copy.marketplace.publishBtn}
                </span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Cart Drawer Modal */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-drawer-title"
        >
          <div className="w-full max-w-md bg-[#FFFFFF] h-full flex flex-col justify-between border-l border-[#DFDDD4] p-6 overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#DFDDD4]">
                <h2 id="cart-drawer-title" className="text-xl font-bold text-[#1D241C]">
                  {copy.marketplace.cartTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  aria-label="Close basket"
                  className="p-2 rounded-lg text-[#4D574B] hover:bg-[#F8F7F3] cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {orderNotice && (
                <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-sm text-[#14532D] space-y-1">
                  <p className="font-bold">{orderNotice}</p>
                  <p className="text-xs">{copy.marketplace.orderConfirmedDesc}</p>
                </div>
              )}

              {cart.length === 0 ? (
                <p className="text-sm text-[#4D574B] py-8 text-center">
                  {copy.marketplace.cartEmpty}
                </p>
              ) : (
                <div className="space-y-3">
                  {cart.map((entry) => (
                    <div
                      key={entry.listing.id}
                      className="p-3.5 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#1D241C]">
                          {entry.listing.cropName}
                        </p>
                        <p className="text-xs text-[#4D574B]">
                          {entry.listing.farmerName} · {formatINR(entry.listing.pricePerKg)}/kg
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(entry.listing.id, -5)}
                          aria-label={`Decrease quantity for ${entry.listing.cropName}`}
                          className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#DFDDD4] flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <span className="text-sm font-mono font-semibold tabular-nums w-12 text-center">
                          {entry.quantityKg} kg
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateCartQty(entry.listing.id, 5)}
                          aria-label={`Increase quantity for ${entry.listing.cropName}`}
                          className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#DFDDD4] flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <form
                onSubmit={handlePlaceOrder}
                className="pt-5 mt-6 border-t border-[#DFDDD4] space-y-4"
              >
                <div>
                  <label
                    htmlFor="cart-buyer-name"
                    className="block text-xs font-semibold text-[#1D241C] mb-1"
                  >
                    {copy.marketplace.buyerNameLabel}
                  </label>
                  <input
                    id="cart-buyer-name"
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 min-h-[40px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cart-delivery-addr"
                    className="block text-xs font-semibold text-[#1D241C] mb-1"
                  >
                    {copy.marketplace.deliveryAddressLabel}
                  </label>
                  <input
                    id="cart-delivery-addr"
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Ward 4, Nashik Road"
                    className="w-full px-3 py-2 min-h-[40px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-lg text-sm"
                  />
                </div>

                <div className="flex items-baseline justify-between text-base font-bold text-[#1D241C]">
                  <span>{copy.marketplace.totalLabel}</span>
                  <span className="text-xl tabular-nums">
                    {formatINR(cartSummary.totalInr)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="w-full py-3 min-h-[48px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {copy.marketplace.placeOrderBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Contact Farmer Modal */}
      {contactTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-farmer-title"
        >
          <div className="w-full max-w-lg bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#DFDDD4]">
              <div>
                <h2 id="contact-farmer-title" className="text-xl font-bold text-[#1D241C]">
                  {copy.marketplace.contactModalTitle}
                </h2>
                <p className="text-xs text-[#4D574B] mt-0.5">
                  {contactTarget.farmerName} · {contactTarget.village} ·{' '}
                  {contactTarget.cropName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactTarget(null)}
                aria-label="Close contact dialog"
                className="p-1.5 rounded-lg text-[#4D574B] hover:bg-[#F8F7F3] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-xs font-semibold text-[#1D241C] mb-1"
                >
                  {copy.marketplace.contactRecipientLabel}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="farmer-coop@example.com"
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-msg"
                  className="block text-xs font-semibold text-[#1D241C] mb-1"
                >
                  {copy.marketplace.contactMessageLabel}
                </label>
                <textarea
                  id="contact-msg"
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setContactTarget(null)}
                className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl cursor-pointer"
              >
                {copy.confirmModal.cancel}
              </button>
              <button
                type="button"
                onClick={handleSendInquiry}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>
                  {accessToken && contactEmail.trim()
                    ? copy.marketplace.sendGmailInquiryBtn
                    : copy.marketplace.sendLocalInquiryBtn}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
