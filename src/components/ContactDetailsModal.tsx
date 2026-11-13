import { useEffect, useState, type FormEvent } from 'react';
import { Clock, Mail, MapPin, Phone, RotateCcw, UserCheck, X } from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import { DEFAULT_CONTACT_DETAILS, normalizeContactDetails } from '../utils/agriLogic';
import type { ContactDetails, Language } from '../types/agri';

interface ContactDetailsModalProps {
  language: Language;
  isOpen: boolean;
  contactDetails: ContactDetails;
  onClose: () => void;
  onSave: (next: ContactDetails) => void;
}

export function ContactDetailsModal({
  language,
  isOpen,
  contactDetails,
  onClose,
  onSave,
}: ContactDetailsModalProps) {
  const [contactName, setContactName] = useState(contactDetails.contactName);
  const [email, setEmail] = useState(contactDetails.email);
  const [phone, setPhone] = useState(contactDetails.phone);
  const [address, setAddress] = useState(contactDetails.address);
  const [supportHours, setSupportHours] = useState(contactDetails.supportHours);

  useEffect(() => {
    if (isOpen) {
      setContactName(contactDetails.contactName);
      setEmail(contactDetails.email);
      setPhone(contactDetails.phone);
      setAddress(contactDetails.address);
      setSupportHours(contactDetails.supportHours);
    }
  }, [isOpen, contactDetails]);

  if (!isOpen) return null;

  const copy = UI_COPY[language];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = normalizeContactDetails({
      contactName,
      email,
      phone,
      address,
      supportHours,
    });
    onSave(cleaned);
    onClose();
  };

  const handleReset = () => {
    setContactName(DEFAULT_CONTACT_DETAILS.contactName);
    setEmail(DEFAULT_CONTACT_DETAILS.email);
    setPhone(DEFAULT_CONTACT_DETAILS.phone);
    setAddress(DEFAULT_CONTACT_DETAILS.address);
    setSupportHours(DEFAULT_CONTACT_DETAILS.supportHours);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-details-modal-title"
    >
      <div className="w-full max-w-lg bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#DFDDD4]">
          <div>
            <h2
              id="contact-details-modal-title"
              className="text-xl font-bold text-[#1D241C]"
            >
              {copy.footer.contactModalTitle}
            </h2>
            <p className="text-xs text-[#4D574B] mt-1">
              {copy.footer.contactModalDesc}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.confirmModal.cancel}
            className="p-1.5 rounded-lg text-[#4D574B] hover:bg-[#F8F7F3] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="contact-detail-name"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1D241C] mb-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#1B5E3A]" aria-hidden="true" />
              <span>{copy.footer.contactNameLabel}</span>
            </label>
            <input
              id="contact-detail-name"
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact-detail-email"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1D241C] mb-1"
              >
                <Mail className="w-3.5 h-3.5 text-[#1B5E3A]" aria-hidden="true" />
                <span>{copy.footer.emailLabel}</span>
              </label>
              <input
                id="contact-detail-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
              />
            </div>

            <div>
              <label
                htmlFor="contact-detail-phone"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1D241C] mb-1"
              >
                <Phone className="w-3.5 h-3.5 text-[#1B5E3A]" aria-hidden="true" />
                <span>{copy.footer.phoneLabel}</span>
              </label>
              <input
                id="contact-detail-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-detail-address"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1D241C] mb-1"
            >
              <MapPin className="w-3.5 h-3.5 text-[#1B5E3A]" aria-hidden="true" />
              <span>{copy.footer.addressLabel}</span>
            </label>
            <input
              id="contact-detail-address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            />
          </div>

          <div>
            <label
              htmlFor="contact-detail-hours"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1D241C] mb-1"
            >
              <Clock className="w-3.5 h-3.5 text-[#1B5E3A]" aria-hidden="true" />
              <span>{copy.footer.hoursLabel}</span>
            </label>
            <input
              id="contact-detail-hours"
              type="text"
              required
              value={supportHours}
              onChange={(e) => setSupportHours(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DFDDD4]">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#4D574B] hover:text-[#1D241C] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{copy.footer.resetContactBtn}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl cursor-pointer"
              >
                {copy.confirmModal.cancel}
              </button>
              <button
                type="submit"
                data-testid="save-contact-details-btn"
                className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
              >
                {copy.footer.saveContactBtn}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
