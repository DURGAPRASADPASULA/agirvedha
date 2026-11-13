import { AlertTriangle, X } from 'lucide-react';
import { UI_COPY } from '../i18n/translations';
import type { Language } from '../types/agri';

export interface PendingConfirmation {
  title: string;
  description: string;
  details?: string[];
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => Promise<void> | void;
}

interface ConfirmActionModalProps {
  language: Language;
  pending: PendingConfirmation | null;
  isBusy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmActionModal({
  language,
  pending,
  isBusy,
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  if (!pending) return null;
  const copy = UI_COPY[language];
  const isDanger = pending.tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDanger ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#F1EFE8] text-[#1B5E3A]'
              }`}
            >
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="confirm-modal-title"
                className="text-lg font-bold text-[#1D241C]"
              >
                {pending.title}
              </h2>
              <p className="text-sm text-[#4D574B] mt-1 leading-relaxed">
                {pending.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            aria-label={copy.confirmModal.cancel}
            className="p-1.5 rounded-lg text-[#4D574B] hover:text-[#1D241C] hover:bg-[#F8F7F3] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {pending.details && pending.details.length > 0 && (
          <ul className="bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl p-3.5 space-y-1.5 text-xs text-[#1D241C]">
            {pending.details.map((line, idx) => (
              <li key={idx} className="leading-relaxed">
                • {line}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#DFDDD4]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl cursor-pointer whitespace-nowrap shrink-0"
          >
            {copy.confirmModal.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white rounded-xl cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60 ${
              isDanger
                ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
                : 'bg-[#1B5E3A] hover:bg-[#14492C]'
            }`}
          >
            {isBusy
              ? copy.confirmModal.processing
              : pending.confirmLabel || copy.confirmModal.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
