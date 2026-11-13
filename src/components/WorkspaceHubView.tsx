import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Calendar,
  ExternalLink,
  FileSpreadsheet,
  FolderOpen,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { tText, UI_COPY } from '../i18n/translations';
import {
  createCalendarEvent,
  createFarmSpreadsheet,
  deleteDriveFile,
  listDriveFiles,
  listRecentGmailMessages,
  listUpcomingCalendarEvents,
  readSpreadsheetPreview,
  sendGmailMessage,
  uploadTextReportToDrive,
} from '../services/workspaceApi';
import { enrichMandiPrice, formatINR } from '../utils/agriLogic';
import type {
  CalendarEventSummary,
  CropPlanRecord,
  CropScanLogRecord,
  DriveFileSummary,
  GmailMessageSummary,
  Language,
  MandiPriceEntry,
  MarketplaceOrderRecord,
  SheetPreviewData,
} from '../types/agri';
import { GoogleSignInButton } from './GoogleSignInButton';
import type { PendingConfirmation } from './ConfirmActionModal';

interface WorkspaceHubViewProps {
  language: Language;
  user: User | null;
  accessToken: string | null;
  isSigningIn: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  mandiPrices: MandiPriceEntry[];
  savedPlans: CropPlanRecord[];
  orders: MarketplaceOrderRecord[];
  scanLogs: CropScanLogRecord[];
  onRequestConfirm: (pending: PendingConfirmation) => void;
  onNotify: (msg: string) => void;
}

export function WorkspaceHubView({
  language,
  user,
  accessToken,
  isSigningIn,
  onSignIn,
  onSignOut,
  mandiPrices,
  savedPlans,
  orders,
  scanLogs,
  onRequestConfirm,
  onNotify,
}: WorkspaceHubViewProps) {
  const copy = UI_COPY[language];

  // Drive state
  const [driveSearch, setDriveSearch] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFileSummary[]>([]);
  const [driveBusy, setDriveBusy] = useState(false);

  // Sheets state
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [sheetIdInput, setSheetIdInput] = useState('');
  const [sheetPreview, setSheetPreview] = useState<SheetPreviewData | null>(null);
  const [sheetsBusy, setSheetsBusy] = useState(false);

  // Gmail state
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [gmailTo, setGmailTo] = useState('');
  const [gmailSubject, setGmailSubject] = useState('AgriVeda Farm Advisory & Market Update');
  const [gmailBody, setGmailBody] = useState(
    'Namaste, sharing today’s Mandi rate highlights and seasonal crop plan from AgriVeda.'
  );
  const [gmailBusy, setGmailBusy] = useState(false);

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventSummary[]>([]);
  const [eventSummary, setEventSummary] = useState('Rabi Wheat Top-Dressing & Irrigation');
  const [eventDate, setEventDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [calendarBusy, setCalendarBusy] = useState(false);

  // Cloud history tab
  const [historyTab, setHistoryTab] = useState<'plans' | 'orders' | 'scans'>('plans');

  const requireToken = (): string | null => {
    if (!accessToken) {
      onNotify(
        language === 'en'
          ? 'Please sign in / reconnect with Google first to access Workspace APIs.'
          : 'Workspace API उपयोग करने के लिए कृपया पहले Google से साइन इन करें।'
      );
      return null;
    }
    return accessToken;
  };

  /* ---- DRIVE HANDLERS ---- */
  const handleLoadDrive = async () => {
    const token = requireToken();
    if (!token) return;
    setDriveBusy(true);
    try {
      const files = await listDriveFiles(token, driveSearch);
      setDriveFiles(files);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Drive error');
    } finally {
      setDriveBusy(false);
    }
  };

  const handleUploadSummaryToDrive = () => {
    const token = requireToken();
    if (!token) return;
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `AgriVeda_Mandi_Report_${today}.txt`;
    const topRates = mandiPrices
      .slice(0, 6)
      .map(enrichMandiPrice)
      .map(
        (m) =>
          `- ${tText(m.cropName, language)} (${tText(m.mandiName, language)}): ${formatINR(m.pricePerQuintal)}/qtl (${formatINR(m.pricePerKg)}/kg)`
      )
      .join('\n');

    onRequestConfirm({
      title:
        language === 'en'
          ? 'Upload Advisory Report to Google Drive?'
          : 'Google Drive में रिपोर्ट अपलोड करें?',
      description: `Creates "${fileName}" in your Drive root folder.`,
      details: [`File: ${fileName}`, 'Contains top 6 live Mandi modal rates'],
      onConfirm: async () => {
        const uploaded = await uploadTextReportToDrive(
          token,
          fileName,
          `AgriVeda Field & Mandi Report (${today})\n\n${topRates}`
        );
        setDriveFiles((prev) => [uploaded, ...prev]);
        onNotify(`Uploaded "${uploaded.name}" to Google Drive.`);
      },
    });
  };

  const handleDeleteDrive = (file: DriveFileSummary) => {
    const token = requireToken();
    if (!token) return;
    onRequestConfirm({
      title:
        language === 'en'
          ? 'Delete file from Google Drive?'
          : 'Google Drive से फ़ाइल हटाएं?',
      description: `Permanently delete "${file.name}" from your Google Drive?`,
      details: [`File ID: ${file.id}`],
      tone: 'danger',
      onConfirm: async () => {
        await deleteDriveFile(token, file.id);
        setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
        onNotify(`Deleted "${file.name}" from Google Drive.`);
      },
    });
  };

  /* ---- SHEETS HANDLERS ---- */
  const handleCreateMandiSheet = () => {
    const token = requireToken();
    if (!token) return;
    const today = new Date().toISOString().slice(0, 10);
    const title = `AgriVeda Mandi Rates ${today}`;
    const rows = [
      ['Crop', 'Variety', 'Mandi', 'District', 'State', 'Rate INR/Quintal', 'Rate INR/kg'],
      ...mandiPrices.map((m) => {
        const e = enrichMandiPrice(m);
        return [
          tText(m.cropName, language),
          tText(m.variety, language),
          tText(m.mandiName, language),
          tText(m.district, language),
          tText(m.state, language),
          e.pricePerQuintal,
          e.pricePerKg,
        ];
      }),
    ];

    onRequestConfirm({
      title:
        language === 'en'
          ? 'Create New Mandi Rates Google Sheet?'
          : 'नई मंडी भाव Google Sheet बनाएं?',
      description: `Creates "${title}" with ${mandiPrices.length} market rows.`,
      details: [`Title: ${title}`, `Tab: Mandi_Rates`, `Rows: ${mandiPrices.length}`],
      onConfirm: async () => {
        setSheetsBusy(true);
        try {
          const created = await createFarmSpreadsheet(token, title, 'Mandi_Rates', rows);
          setCreatedSheetUrl(created.spreadsheetUrl);
          setSheetIdInput(created.spreadsheetId);
          onNotify(`Created Google Sheet "${title}".`);
        } finally {
          setSheetsBusy(false);
        }
      },
    });
  };

  const handlePreviewSheet = async () => {
    const token = requireToken();
    if (!token || !sheetIdInput.trim()) return;
    setSheetsBusy(true);
    try {
      const preview = await readSpreadsheetPreview(token, sheetIdInput.trim());
      setSheetPreview(preview);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to load Google Sheet');
    } finally {
      setSheetsBusy(false);
    }
  };

  /* ---- GMAIL HANDLERS ---- */
  const handleRefreshGmail = async () => {
    const token = requireToken();
    if (!token) return;
    setGmailBusy(true);
    try {
      const msgs = await listRecentGmailMessages(token, 5);
      setGmailMessages(msgs);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gmail read failed');
    } finally {
      setGmailBusy(false);
    }
  };

  const handleSendGmail = () => {
    const token = requireToken();
    if (!token) return;
    const recipient = gmailTo.trim();
    if (!recipient) {
      onNotify('Please enter a recipient email address.');
      return;
    }
    onRequestConfirm({
      title:
        language === 'en'
          ? 'Send Email via Gmail?'
          : 'Gmail द्वारा ईमेल भेजें?',
      description: `Send this message from your Gmail account to ${recipient}?`,
      details: [`To: ${recipient}`, `Subject: ${gmailSubject}`],
      onConfirm: async () => {
        await sendGmailMessage(token, recipient, gmailSubject, gmailBody);
        onNotify(`Email sent via Gmail to ${recipient}.`);
        setGmailTo('');
      },
    });
  };

  /* ---- CALENDAR HANDLERS ---- */
  const handleRefreshCalendar = async () => {
    const token = requireToken();
    if (!token) return;
    setCalendarBusy(true);
    try {
      const events = await listUpcomingCalendarEvents(token, 6);
      setCalendarEvents(events);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Calendar read failed');
    } finally {
      setCalendarBusy(false);
    }
  };

  const handleCreateCalendar = () => {
    const token = requireToken();
    if (!token || !eventSummary.trim() || !eventDate) return;
    onRequestConfirm({
      title:
        language === 'en'
          ? 'Add Farm Reminder to Google Calendar?'
          : 'Google Calendar में खेती कार्य जोड़ें?',
      description: `Creates an 08:00 AM IST event on ${eventDate}.`,
      details: [`Summary: ${eventSummary}`, `Date: ${eventDate}`],
      onConfirm: async () => {
        const ev = await createCalendarEvent(
          token,
          eventSummary.trim(),
          'Scheduled via AgriVeda Rural Advisory',
          eventDate
        );
        setCalendarEvents((prev) => [ev, ...prev]);
        onNotify(`Added "${ev.summary}" to Google Calendar.`);
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1D241C] tracking-tight">
          {copy.workspace.heading}
        </h1>
        <p className="text-base text-[#4D574B] mt-2 leading-relaxed">
          {copy.workspace.subheading}
        </p>
      </div>

      {/* Authentication Banner */}
      <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {user ? (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#1B5E3A]">
                {copy.workspace.connectedAs}
              </p>
              <p className="text-lg font-bold text-[#1D241C]">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-[#4D574B]">{user.email}</p>
              {!accessToken && (
                <p className="text-xs text-[#A16207] pt-1">
                  {copy.workspace.reconnectPrompt}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {!accessToken && (
                <GoogleSignInButton
                  onClick={() => void onSignIn()}
                  disabled={isSigningIn}
                  label={copy.workspace.reconnectBtn}
                />
              )}
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl cursor-pointer"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>{copy.workspace.signOutBtn}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-[#4D574B] max-w-xl">
              {copy.workspace.signInPrompt}
            </p>
            <GoogleSignInButton
              onClick={() => void onSignIn()}
              disabled={isSigningIn}
            />
          </>
        )}
      </section>

      {/* 4 Workspace Integration Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Drive */}
        <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#DFDDD4]">
            <div>
              <h2 className="text-xl font-bold text-[#1D241C] inline-flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#1B5E3A]" aria-hidden="true" />
                <span>{copy.workspace.driveTitle}</span>
              </h2>
              <p className="text-xs text-[#4D574B] mt-1">{copy.workspace.driveDesc}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                className="w-4 h-4 text-[#4D574B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                placeholder={copy.workspace.driveSearchPlaceholder}
                className="w-full pl-9 pr-3 py-2 min-h-[40px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleLoadDrive()}
              disabled={driveBusy}
              className="px-4 py-2 min-h-[40px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 inline mr-1.5" aria-hidden="true" />
              List Files
            </button>
          </div>

          <button
            type="button"
            onClick={handleUploadSummaryToDrive}
            className="w-full py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
          >
            {copy.workspace.driveSaveReportBtn}
          </button>

          {driveFiles.length > 0 && (
            <ul className="divide-y divide-[#DFDDD4] border border-[#DFDDD4] rounded-xl text-sm">
              {driveFiles.map((f) => (
                <li
                  key={f.id}
                  className="p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#1D241C] truncate">{f.name}</p>
                    <p className="text-xs text-[#4D574B] truncate">{f.mimeType}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {f.webViewLink && (
                      <a
                        href={f.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-[#1B5E3A] hover:bg-[#F8F7F3] rounded-lg"
                        aria-label={`Open ${f.name}`}
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteDrive(f)}
                      className="p-1.5 text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg cursor-pointer"
                      aria-label={`Delete ${f.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Google Sheets */}
        <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-4">
          <div className="pb-3 border-b border-[#DFDDD4]">
            <h2 className="text-xl font-bold text-[#1D241C] inline-flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#1B5E3A]" aria-hidden="true" />
              <span>{copy.workspace.sheetsTitle}</span>
            </h2>
            <p className="text-xs text-[#4D574B] mt-1">{copy.workspace.sheetsDesc}</p>
          </div>

          <button
            type="button"
            onClick={handleCreateMandiSheet}
            disabled={sheetsBusy}
            className="w-full py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
          >
            {copy.workspace.sheetsExportMandiBtn}
          </button>

          {createdSheetUrl && (
            <a
              href={createdSheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B5E3A] hover:underline"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span>Open Created Mandi Spreadsheet</span>
            </a>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#DFDDD4]">
            <input
              type="text"
              value={sheetIdInput}
              onChange={(e) => setSheetIdInput(e.target.value)}
              placeholder={copy.workspace.sheetsIdPlaceholder}
              className="flex-1 min-w-[180px] px-3 py-2 min-h-[40px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={() => void handlePreviewSheet()}
              disabled={sheetsBusy}
              className="px-4 py-2 min-h-[40px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl cursor-pointer"
            >
              {copy.workspace.sheetsPreviewBtn}
            </button>
          </div>

          {sheetPreview && (
            <div className="border border-[#DFDDD4] rounded-xl overflow-hidden text-xs">
              <div className="bg-[#F8F7F3] px-3 py-2 font-semibold text-[#1D241C] border-b border-[#DFDDD4]">
                {sheetPreview.title} · Tab: {sheetPreview.activeTab}
              </div>
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {sheetPreview.rows.slice(0, 6).map((row, idx) => (
                      <tr key={idx} className="border-b border-[#DFDDD4] last:border-b-0">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-2.5 py-1.5 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Gmail */}
        <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#DFDDD4]">
            <div>
              <h2 className="text-xl font-bold text-[#1D241C] inline-flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#1B5E3A]" aria-hidden="true" />
                <span>{copy.workspace.gmailTitle}</span>
              </h2>
              <p className="text-xs text-[#4D574B] mt-1">{copy.workspace.gmailDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleRefreshGmail()}
              disabled={gmailBusy}
              className="px-3 py-2 text-xs font-semibold text-[#1D241C] bg-[#F8F7F3] border border-[#DFDDD4] rounded-lg cursor-pointer shrink-0"
            >
              {copy.workspace.gmailRefreshBtn}
            </button>
          </div>

          <div className="space-y-2.5">
            <input
              type="email"
              value={gmailTo}
              onChange={(e) => setGmailTo(e.target.value)}
              placeholder="Recipient email (buyer or FPO)..."
              className="w-full px-3 py-2 min-h-[40px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
            />
            <input
              type="text"
              value={gmailSubject}
              onChange={(e) => setGmailSubject(e.target.value)}
              className="w-full px-3 py-2 min-h-[40px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
            />
            <textarea
              rows={2}
              value={gmailBody}
              onChange={(e) => setGmailBody(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
            />
            <button
              type="button"
              onClick={handleSendGmail}
              className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{copy.workspace.gmailSendBtn}</span>
            </button>
          </div>

          {gmailMessages.length > 0 && (
            <ul className="divide-y divide-[#DFDDD4] border border-[#DFDDD4] rounded-xl text-xs">
              {gmailMessages.map((msg) => (
                <li key={msg.id} className="p-3 space-y-0.5">
                  <p className="font-bold text-[#1D241C] truncate">{msg.subject}</p>
                  <p className="text-[#6B4423] truncate">{msg.from}</p>
                  <p className="text-[#4D574B] line-clamp-2">{msg.snippet}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Google Calendar */}
        <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#DFDDD4]">
            <div>
              <h2 className="text-xl font-bold text-[#1D241C] inline-flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#1B5E3A]" aria-hidden="true" />
                <span>{copy.workspace.calendarTitle}</span>
              </h2>
              <p className="text-xs text-[#4D574B] mt-1">{copy.workspace.calendarDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleRefreshCalendar()}
              disabled={calendarBusy}
              className="px-3 py-2 text-xs font-semibold text-[#1D241C] bg-[#F8F7F3] border border-[#DFDDD4] rounded-lg cursor-pointer shrink-0"
            >
              Load Events
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={eventSummary}
              onChange={(e) => setEventSummary(e.target.value)}
              className="sm:col-span-2 px-3 py-2 min-h-[40px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
            />
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="px-3 py-2 min-h-[40px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleCreateCalendar}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
          >
            <Calendar className="w-4 h-4" aria-hidden="true" />
            <span>{copy.workspace.calendarCreateBtn}</span>
          </button>

          {calendarEvents.length > 0 && (
            <ul className="divide-y divide-[#DFDDD4] border border-[#DFDDD4] rounded-xl text-xs">
              {calendarEvents.map((ev) => (
                <li key={ev.id} className="p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-[#1D241C]">{ev.summary}</p>
                    <p className="text-[#4D574B] tabular-nums">{ev.start}</p>
                  </div>
                  {ev.htmlLink && (
                    <a
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1B5E3A] font-semibold hover:underline shrink-0"
                    >
                      Open
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Firestore User History */}
      {user && (
        <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#DFDDD4]">
            <h2 className="text-xl font-bold text-[#1D241C]">
              {copy.workspace.cloudHistoryTitle}
            </h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['plans', `${copy.workspace.savedPlansTab} (${savedPlans.length})`],
                  ['orders', `${copy.workspace.ordersTab} (${orders.length})`],
                  ['scans', `${copy.workspace.scanLogsTab} (${scanLogs.length})`],
                ] as const
              ).map(([tabKey, label]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setHistoryTab(tabKey)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                    historyTab === tabKey
                      ? 'bg-[#1B5E3A] text-white'
                      : 'bg-[#F8F7F3] text-[#4D574B] hover:text-[#1D241C]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {historyTab === 'plans' && (
            <div className="space-y-3 text-sm">
              {savedPlans.length === 0 ? (
                <p className="text-[#4D574B]">No saved crop plans yet.</p>
              ) : (
                savedPlans.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl flex flex-wrap justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-[#1D241C]">{p.topCropName}</p>
                      <p className="text-xs text-[#4D574B]">
                        {p.season} · {p.soilType} soil · {p.notes}
                      </p>
                    </div>
                    <span className="text-xs text-[#4D574B]">{p.createdAtLabel}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {historyTab === 'orders' && (
            <div className="space-y-3 text-sm">
              {orders.length === 0 ? (
                <p className="text-[#4D574B]">No direct marketplace orders recorded yet.</p>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl flex flex-wrap justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-[#1D241C]">{o.itemSummary}</p>
                      <p className="text-xs text-[#4D574B]">
                        {o.buyerName} · {o.deliveryAddress} · {o.createdAtLabel}
                      </p>
                    </div>
                    <span className="font-bold text-[#1B5E3A] tabular-nums">
                      {formatINR(o.totalInr)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {historyTab === 'scans' && (
            <div className="space-y-3 text-sm">
              {scanLogs.length === 0 ? (
                <p className="text-[#4D574B]">No AI crop scans saved yet.</p>
              ) : (
                scanLogs.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl flex flex-wrap justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-[#1D241C]">
                        {s.cropName}: {s.diagnosisName} ({s.confidencePct}%)
                      </p>
                      <p className="text-xs text-[#4D574B]">{s.treatmentSummary}</p>
                    </div>
                    <span className="text-xs text-[#4D574B]">{s.createdAtLabel}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
