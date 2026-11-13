import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  CalendarPlus,
  Camera,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Leaf,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { tText, UI_COPY } from '../i18n/translations';
import { searchCropDiseases } from '../utils/agriLogic';
import { analyzeCropImage } from '../services/agriApi';
import { saveCropScanToFirestore } from '../services/firebase';
import { createCalendarEvent, uploadTextReportToDrive } from '../services/workspaceApi';
import type {
  CropDiseaseEntry,
  CropScanDiagnosis,
  Language,
  SymptomCategory,
} from '../types/agri';
import type { PendingConfirmation } from './ConfirmActionModal';

interface CropDoctorViewProps {
  language: Language;
  diseases: CropDiseaseEntry[];
  user: User | null;
  accessToken: string | null;
  onRequestSignIn: () => void;
  onRequestConfirm: (pending: PendingConfirmation) => void;
  onNotify: (msg: string) => void;
  onAskAi: (topicLabel: string, promptText: string) => void;
}

export function CropDoctorView({
  language,
  diseases,
  user,
  accessToken,
  onRequestSignIn,
  onRequestConfirm,
  onNotify,
  onAskAi,
}: CropDoctorViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('all');
  const [symptomFilter, setSymptomFilter] = useState<SymptomCategory | 'all'>('all');

  // AI Camera Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [symptomHint, setSymptomHint] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<CropScanDiagnosis | null>(null);
  const [scanSaved, setScanSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const copy = UI_COPY[language];

  const stopCameraStream = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleStartCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        language === 'en'
          ? 'Live camera is unavailable in this browser. Please upload a leaf photo below.'
          : 'इस ब्राउज़र में लाइव कैमरा उपलब्ध नहीं है। कृपया नीचे से पत्ती की फोटो अपलोड करें।'
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setCameraError(
        language === 'en'
          ? 'Camera permission denied or no camera found. You can upload a leaf photo or use a sample below.'
          : 'कैमरा अनुमति नहीं मिली। आप नीचे से पत्ती की फोटो अपलोड कर सकते हैं या नमूना परख सकते हैं।'
      );
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreviewImageUrl(dataUrl);
    }
    stopCameraStream();
  };

  const handleUploadLeaf = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImageUrl(String(reader.result));
      setDiagnosis(null);
      setScanSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const runDiagnosis = async (hintOverride?: string, imageOverride?: string) => {
    const effectiveHint = hintOverride ?? symptomHint;
    const effectiveImg =
      imageOverride ??
      previewImageUrl ??
      '/src/assets/images/crop_doctor_leaf_1794548773496.jpg';

    setIsAnalyzing(true);
    setScanSaved(false);
    try {
      const result = await analyzeCropImage(effectiveImg, effectiveHint);
      setDiagnosis(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveScan = async () => {
    if (!diagnosis) return;
    if (!user) {
      onRequestSignIn();
      return;
    }
    try {
      await saveCropScanToFirestore(
        tText(diagnosis.detectedCrop, language),
        tText(diagnosis.conditionName, language),
        diagnosis.confidencePct,
        tText(diagnosis.recommendedRemedy, language)
      );
      setScanSaved(true);
      onNotify(
        language === 'en'
          ? 'Crop scan saved to your Firestore history.'
          : 'फसल जांच रिपोर्ट क्लाउड लॉग में सहेजी गई।'
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save scan log.');
    }
  };

  const handleSaveToDrive = () => {
    if (!diagnosis) return;
    if (!accessToken) {
      onRequestSignIn();
      return;
    }
    const fileName = `AgriVeda_Diagnosis_${diagnosis.detectedCrop.en.replace(/\s+/g, '_')}.txt`;
    const body = [
      `AgriVeda AI Crop Diagnosis Report`,
      `Crop: ${tText(diagnosis.detectedCrop, language)}`,
      `Diagnosis: ${tText(diagnosis.conditionName, language)} (${diagnosis.confidencePct}% confidence)`,
      `Severity: ${diagnosis.severity}`,
      `Recommended Remedy: ${tText(diagnosis.recommendedRemedy, language)}`,
      `Dosage: ${tText(diagnosis.dosage, language)}`,
      `Organic Alternative: ${tText(diagnosis.organicOption, language)}`,
      `Immediate Steps:`,
      ...diagnosis.instantSteps.map((s, idx) => `${idx + 1}. ${tText(s, language)}`),
    ].join('\n');

    onRequestConfirm({
      title:
        language === 'en'
          ? 'Save Diagnosis Report to Google Drive?'
          : 'क्या रिपोर्ट Google Drive में सहेजें?',
      description: `Creates text report "${fileName}" in your Google Drive.`,
      details: [`File: ${fileName}`, `Condition: ${tText(diagnosis.conditionName, language)}`],
      onConfirm: async () => {
        await uploadTextReportToDrive(accessToken, fileName, body);
        onNotify(
          language === 'en'
            ? `Saved "${fileName}" to Google Drive.`
            : `"${fileName}" Google Drive में सहेजी गई।`
        );
      },
    });
  };

  const handleScheduleSpray = () => {
    if (!diagnosis) return;
    if (!accessToken) {
      onRequestSignIn();
      return;
    }
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const summary = `AgriVeda Spray: ${tText(diagnosis.detectedCrop, language)} (${tText(diagnosis.conditionName, language)})`;
    onRequestConfirm({
      title:
        language === 'en'
          ? 'Schedule Spray Reminder in Google Calendar?'
          : 'Google Calendar में छिड़काव रिमाइंडर जोड़ें?',
      description: `Adds a 08:00 AM IST farm task on ${tomorrow}.`,
      details: [`Event: ${summary}`, `Dosage: ${tText(diagnosis.dosage, language)}`],
      onConfirm: async () => {
        await createCalendarEvent(
          accessToken,
          summary,
          `${tText(diagnosis.recommendedRemedy, language)} | ${tText(diagnosis.dosage, language)}`,
          tomorrow
        );
        onNotify(
          language === 'en'
            ? `Spray reminder scheduled on ${tomorrow} in Google Calendar.`
            : `${tomorrow} के लिए Google Calendar में छिड़काव रिमाइंडर जोड़ा गया।`
        );
      },
    });
  };

  const cropOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of diseases) {
      map.set(d.cropName.en, tText(d.cropName, language));
    }
    return Array.from(map.entries());
  }, [diseases, language]);

  const filteredDiseases = useMemo(
    () => searchCropDiseases(diseases, cropFilter, symptomFilter, searchQuery),
    [diseases, cropFilter, symptomFilter, searchQuery]
  );

  const symptomTabs: (SymptomCategory | 'all')[] = [
    'all',
    'yellow_leaves',
    'pests',
    'fungal_spots',
    'root_rot',
  ];

  const clearFilters = () => {
    setSearchQuery('');
    setCropFilter('all');
    setSymptomFilter('all');
  };

  return (
    <div className="space-y-8">
      {/* Page Heading & Prominent AI Camera CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1D241C] tracking-tight">
            {copy.doctor.heading}
          </h1>
          <p className="text-base text-[#4D574B] mt-2 leading-relaxed">
            {copy.doctor.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[48px] text-base font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
          >
            <Camera className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{copy.doctor.scanBtnLabel}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onAskAi(
                copy.nav.doctor,
                language === 'en'
                  ? 'I have a crop disease or pest problem on my farm. What symptoms should I check first?'
                  : 'मेरे खेत में फसल रोग या कीट की समस्या है। मुझे सबसे पहले क्या लक्षण जांचने चाहिए?'
              )
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] text-base font-semibold text-[#1B5E3A] bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#1B5E3A] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
          >
            <MessageSquare className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{copy.doctor.askAiBtn}</span>
          </button>
        </div>
      </div>

      {/* Prominent Inline AI Camera Scanner Modal / Panel */}
      {scannerOpen && (
        <section
          aria-labelledby="ai-scanner-heading"
          className="bg-[#FFFFFF] border-2 border-[#1B5E3A] rounded-2xl p-6 space-y-6"
        >
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#DFDDD4]">
            <div>
              <p className="text-xs font-semibold text-[#1B5E3A] inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>AI Vision Plant Diagnostics</span>
              </p>
              <h2 id="ai-scanner-heading" className="text-2xl font-bold text-[#1D241C] mt-1">
                {copy.doctor.scannerTitle}
              </h2>
              <p className="text-sm text-[#4D574B] mt-1">
                {copy.doctor.scannerSubtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setScannerOpen(false);
              }}
              aria-label="Close scanner"
              className="p-2 rounded-lg text-[#4D574B] hover:bg-[#F8F7F3] cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Capture Controls */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
                  >
                    <Camera className="w-4 h-4" aria-hidden="true" />
                    <span>{copy.doctor.startCameraBtn}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCaptureFrame}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
                    >
                      <Camera className="w-4 h-4" aria-hidden="true" />
                      <span>{copy.doctor.captureFrameBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl cursor-pointer"
                    >
                      {copy.doctor.stopCameraBtn}
                    </button>
                  </>
                )}

                <label className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#1D241C] bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl cursor-pointer">
                  <Upload className="w-4 h-4 text-[#1B5E3A]" aria-hidden="true" />
                  <span>{copy.doctor.uploadImageLabel}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLeaf}
                    className="sr-only"
                  />
                </label>
              </div>

              {cameraError && (
                <p className="text-xs text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3">
                  {cameraError}
                </p>
              )}

              {cameraActive && (
                <div className="rounded-xl overflow-hidden border border-[#DFDDD4] bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-56 object-cover"
                  />
                </div>
              )}

              {previewImageUrl && !cameraActive && (
                <div className="rounded-xl overflow-hidden border border-[#DFDDD4] bg-[#F8F7F3] h-48">
                  <img
                    src={previewImageUrl}
                    alt="Selected crop leaf preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="ai-symptom-hint"
                  className="block text-sm font-semibold text-[#1D241C] mb-1.5"
                >
                  {copy.doctor.symptomHintLabel}
                </label>
                <input
                  id="ai-symptom-hint"
                  type="text"
                  value={symptomHint}
                  onChange={(e) => setSymptomHint(e.target.value)}
                  placeholder={copy.doctor.symptomHintPlaceholder}
                  className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#4D574B]">
                  {copy.doctor.sampleTriggerHeading}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: language === 'en' ? 'Tomato Blight Leaf' : 'टमाटर झुलसा पत्ती',
                      hint: 'tomato blight spot',
                    },
                    {
                      label: language === 'en' ? 'Mustard Aphids' : 'सरसों माहू कीट',
                      hint: 'mustard aphid pest',
                    },
                    {
                      label: language === 'en' ? 'Wheat Yellow Rust' : 'गेहूँ पीला रतुआ',
                      hint: 'wheat yellow rust',
                    },
                  ].map((sample) => (
                    <button
                      key={sample.hint}
                      type="button"
                      onClick={() => {
                        setSymptomHint(sample.hint);
                        setPreviewImageUrl('/src/assets/images/crop_doctor_leaf_1794548773496.jpg');
                        void runDiagnosis(
                          sample.hint,
                          '/src/assets/images/crop_doctor_leaf_1794548773496.jpg'
                        );
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-[#F1EFE8] hover:bg-[#E5E2D8] text-[#1D241C] border border-[#DFDDD4] rounded-lg cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => void runDiagnosis()}
                className="w-full py-3 min-h-[48px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer disabled:opacity-60"
              >
                {isAnalyzing ? copy.doctor.analyzingLabel : copy.doctor.runDiagnosisBtn}
              </button>
            </div>

            {/* Right Diagnosis Result */}
            <div className="lg:col-span-6">
              {diagnosis ? (
                <div className="bg-[#F8F7F3] border border-[#DFDDD4] rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#DFDDD4]">
                    <div>
                      <p className="text-xs font-semibold text-[#6B4423]">
                        {copy.doctor.diagnosisHeading} · {tText(diagnosis.detectedCrop, language)}
                      </p>
                      <h3 className="text-xl font-bold text-[#1D241C] mt-0.5">
                        {tText(diagnosis.conditionName, language)}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#4D574B]">{copy.doctor.confidenceLabel}</p>
                      <p className="text-2xl font-bold text-[#1B5E3A] tabular-nums">
                        {diagnosis.confidencePct}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#1D241C] mb-1.5">
                      {copy.doctor.instantStepsLabel}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-[#4D574B]">
                      {diagnosis.instantSteps.map((step, idx) => (
                        <li key={idx}>{tText(step, language)}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="pt-2 border-t border-[#DFDDD4] space-y-2 text-sm">
                    <p>
                      <span className="font-semibold text-[#1D241C]">
                        {copy.doctor.chemicalControl}:
                      </span>{' '}
                      <span className="text-[#4D574B]">
                        {tText(diagnosis.recommendedRemedy, language)}
                      </span>
                    </p>
                    <p className="text-xs font-mono bg-[#FFFFFF] p-2 rounded-lg border border-[#DFDDD4]">
                      {copy.doctor.dosage}: {tText(diagnosis.dosage, language)}
                    </p>
                    <p>
                      <span className="font-semibold text-[#1D241C]">
                        {copy.doctor.organicOption}:
                      </span>{' '}
                      <span className="text-[#4D574B]">
                        {tText(diagnosis.organicOption, language)}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-[#DFDDD4]">
                    <button
                      type="button"
                      onClick={() => void handleSaveScan()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-lg cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {scanSaved
                          ? language === 'en'
                            ? 'Saved to Cloud'
                            : 'क्लाउड में सहेजा गया'
                          : copy.doctor.saveScanBtn}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveToDrive}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#1D241C] bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-lg cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#1B5E3A]" aria-hidden="true" />
                      <span>{copy.doctor.exportDriveBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleScheduleSpray}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#1D241C] bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-lg cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-[#6B4423]" aria-hidden="true" />
                      <span>{copy.doctor.scheduleSprayBtn}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const crop = tText(diagnosis.detectedCrop, language);
                        const cond = tText(diagnosis.conditionName, language);
                        onAskAi(
                          `${crop} — ${cond}`,
                          language === 'en'
                            ? `My ${crop} crop was diagnosed with ${cond}. How should I apply ${tText(diagnosis.recommendedRemedy, language)} safely and prevent spread to nearby plants?`
                            : `मेरी ${crop} की फसल में ${cond} की समस्या मिली है। सुरक्षित छिड़काव और बचाव के लिए मुझे क्या कदम उठाने चाहिए?`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#1B5E3A] bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#1B5E3A] rounded-lg cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{copy.doctor.askAiAboutThisBtn}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[240px] bg-[#F8F7F3] border border-dashed border-[#DFDDD4] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                  <Camera className="w-8 h-8 text-[#1B5E3A]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-[#1D241C]">
                    {language === 'en'
                      ? 'Ready to inspect leaf symptoms'
                      : 'पत्ती के लक्षण जांचने के लिए तैयार'}
                  </p>
                  <p className="text-xs text-[#4D574B] max-w-xs">
                    {language === 'en'
                      ? 'Upload a photo, capture from camera, or pick a sample leaf on the left.'
                      : 'बाएं से फोटो अपलोड करें, कैमरे से लें, या नमूना चुनें।'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Directory Search & Symptom Filters */}
      <section className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7">
            <label
              htmlFor="doctor-search"
              className="block text-sm font-semibold text-[#1D241C] mb-1.5"
            >
              {copy.doctor.searchLabel}
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#4D574B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="doctor-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={copy.doctor.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-base text-[#1D241C] placeholder:text-[#4D574B]/70 focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
              />
            </div>
          </div>

          <div className="md:col-span-5">
            <label
              htmlFor="doctor-crop-select"
              className="block text-sm font-semibold text-[#1D241C] mb-1.5"
            >
              {copy.doctor.cropLabel}
            </label>
            <select
              id="doctor-crop-select"
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-base text-[#1D241C] focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
            >
              <option value="all">{copy.doctor.allCrops}</option>
              {cropOptions.map(([enVal, label]) => (
                <option key={enVal} value={enVal}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[#1D241C] mb-2">
            {copy.doctor.symptomLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {symptomTabs.map((sym) => {
              const isActive = symptomFilter === sym;
              const label =
                sym === 'all' ? copy.doctor.allSymptoms : copy.doctor.symptoms[sym];
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setSymptomFilter(sym)}
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
        </div>
      </section>

      {/* Disease Cards / Empty State */}
      {filteredDiseases.length === 0 ? (
        <div className="p-8 bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl text-center space-y-4">
          <h2 className="text-xl font-bold text-[#1D241C]">
            {copy.doctor.noResultsTitle}
          </h2>
          <p className="text-base text-[#4D574B] max-w-md mx-auto">
            {copy.doctor.noResultsDesc}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer"
          >
            {copy.doctor.clearFilters}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDiseases.map((entry) => {
            const isHigh = entry.severity === 'High';
            return (
              <article
                key={entry.id}
                className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl p-6 space-y-5"
              >
                <div className="pb-4 border-b border-[#DFDDD4]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium mb-1.5">
                    <span className="text-[#6B4423]">
                      {tText(entry.cropName, language)} · {copy.doctor.symptoms[entry.symptomCategory]} ·{' '}
                      {entry.treatmentType}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isHigh ? 'text-[#B91C1C]' : 'text-[#A16207]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {isHigh ? copy.doctor.severityHigh : copy.doctor.severityModerate}
                      </span>
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-[#1D241C]">
                    {tText(entry.diseaseName, language)}
                  </h2>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#4D574B] mb-1">
                    {copy.doctor.symptomsObserved}
                  </p>
                  <p className="text-[15px] text-[#1D241C] leading-relaxed">
                    {tText(entry.symptomsDescription, language)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-3 border-t border-[#DFDDD4] text-sm">
                  <div className="flex items-start gap-3">
                    <FlaskConical
                      className="w-4 h-4 text-[#6B4423] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold text-[#1D241C]">
                        {copy.doctor.chemicalControl}
                      </p>
                      <p className="text-[#4D574B] mt-0.5 leading-relaxed">
                        {tText(entry.recommendedTreatment, language)}
                      </p>
                      <p className="text-xs font-mono text-[#1D241C] mt-1 bg-[#F8F7F3] px-2.5 py-1.5 rounded-lg border border-[#DFDDD4]">
                        {copy.doctor.dosage}: {tText(entry.dosagePerLitre, language)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Leaf
                      className="w-4 h-4 text-[#1B5E3A] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold text-[#1D241C]">
                        {copy.doctor.organicOption}
                      </p>
                      <p className="text-[#4D574B] mt-0.5 leading-relaxed">
                        {tText(entry.organicAlternative, language)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock
                      className="w-4 h-4 text-[#4D574B] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold text-[#1D241C]">
                        {copy.doctor.timing}
                      </p>
                      <p className="text-[#4D574B] mt-0.5 leading-relaxed">
                        {tText(entry.applicationTiming, language)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl flex items-start gap-3 text-sm">
                  <ShieldCheck
                    className="w-5 h-5 text-[#1B5E3A] mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-[#1D241C]">
                      {copy.doctor.safetyPrecautions}
                    </p>
                    <p className="text-[#4D574B] mt-0.5 leading-relaxed">
                      {tText(entry.safetyPrecautions, language)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DFDDD4] flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const crop = tText(entry.cropName, language);
                      const dis = tText(entry.diseaseName, language);
                      onAskAi(
                        `${crop} — ${dis}`,
                        language === 'en'
                          ? `How do I treat ${dis} on ${crop}, what organic spray works best, and how soon can I harvest after treatment?`
                          : `${crop} में ${dis} का इलाज कैसे करें, सबसे अच्छा जैविक उपाय क्या है और छिड़काव के कितने दिन बाद कटाई करें?`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#1B5E3A] hover:text-[#14492C] bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-lg cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{copy.doctor.askAiAboutThisBtn}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Floating Quick-Scan Button stacked cleanly above AI Chatbot launcher */}
      {!scannerOpen && (
        <button
          type="button"
          onClick={() => {
            setScannerOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label={copy.doctor.scanBtnLabel}
          className="fixed bottom-20 right-5 z-30 inline-flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-[#1D241C] bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-full shadow-lg cursor-pointer"
        >
          <Camera className="w-4 h-4 text-[#1B5E3A] shrink-0" aria-hidden="true" />
          <span>{copy.doctor.floatingScanLabel}</span>
        </button>
      )}
    </div>
  );
}
