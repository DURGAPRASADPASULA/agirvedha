import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  AlertCircle,
  Bot,
  ExternalLink,
  Globe,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import { LANGUAGE_OPTIONS, UI_COPY } from '../i18n/translations';
import type { GroundingSource, Language } from '../types/agri';

export interface AgriChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
}

export interface AgriChatContext {
  activeSection: string;
  locationName?: string;
  weatherSummary?: string;
  focusedProblem?: string | null;
}

interface AgriChatbotProps {
  language: Language;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  context: AgriChatContext;
  onClearFocusedProblem: () => void;
  queuedPrompt: { id: number; text: string } | null;
  onConsumeQueuedPrompt: () => void;
}

export function AgriChatbot({
  language,
  isOpen,
  onOpenChange,
  context,
  onClearFocusedProblem,
  queuedPrompt,
  onConsumeQueuedPrompt,
}: AgriChatbotProps) {
  const [messages, setMessages] = useState<AgriChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const copy = UI_COPY[language];
  const langOption = LANGUAGE_OPTIONS.find((l) => l.code === language);
  const languageLabel = langOption
    ? `${langOption.englishName} (${langOption.nativeName})`
    : 'English';

  useEffect(() => {
    if (isOpen) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    }
  }, [isOpen]);

  const sendMessage = async (rawText: string, replacePreviousFailure = false) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    setErrorMsg(null);
    setLastFailedInput(null);

    const userMsg: AgriChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextHistory = replacePreviousFailure ? messages : [...messages, userMsg];
    if (!replacePreviousFailure) {
      setMessages(nextHistory);
      setInput('');
    }
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          languageName: languageLabel,
          useSearchGrounding,
          context: {
            activeSection: context.activeSection,
            locationName: context.locationName,
            weatherSummary: context.weatherSummary,
            focusedProblem: context.focusedProblem || undefined,
          },
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        sources?: GroundingSource[];
        error?: string;
      };

      if (!response.ok || !data.reply) {
        throw new Error(
          data.error || 'Unable to reach AgriVeda AI Sahayak right now.'
        );
      }

      const botMsg: AgriChatMessage = {
        id: `m_${Date.now()}`,
        role: 'model',
        text: data.reply,
        sources: Array.isArray(data.sources) ? data.sources : undefined,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to reach AgriVeda AI Sahayak right now.'
      );
      setLastFailedInput(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!queuedPrompt) return;
    const textToSend = queuedPrompt.text;
    onConsumeQueuedPrompt();
    onOpenChange(true);
    void sendMessage(textToSend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queuedPrompt]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setErrorMsg(null);
    setLastFailedInput(null);
    onClearFocusedProblem();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        data-testid="ai-chatbot-launcher"
        onClick={() => onOpenChange(true)}
        aria-label={copy.chatbot.title}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 min-h-[48px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-full shadow-lg cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E3A]"
      >
        <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{copy.chatbot.launcherLabel}</span>
      </button>
    );
  }

  return (
    <aside
      aria-label={copy.chatbot.title}
      data-testid="ai-chatbot-panel"
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[540px] max-h-[82vh] bg-[#FFFFFF] border border-[#DFDDD4] rounded-2xl shadow-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-[#1B5E3A] text-white px-4 py-3.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">{copy.chatbot.title}</h2>
            <p className="text-[11px] text-white/85 truncate">
              {copy.chatbot.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleResetChat}
              title={copy.chatbot.newChatBtn}
              aria-label={copy.chatbot.newChatBtn}
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/15 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={copy.chatbot.closeAria}
            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/15 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Focused Context & Search Grounding Bar */}
      <div className="bg-[#F1EFE8] border-b border-[#DFDDD4] px-4 py-2 flex items-center justify-between gap-2 text-xs text-[#4D574B] shrink-0">
        <div className="min-w-0 flex items-center gap-2">
          {(context.focusedProblem || context.locationName) && (
            <span className="truncate">
              <span className="font-semibold text-[#1D241C]">
                {copy.chatbot.contextPrefix}:
              </span>{' '}
              {context.focusedProblem || context.locationName}
            </span>
          )}
          {context.focusedProblem && (
            <button
              type="button"
              onClick={onClearFocusedProblem}
              className="text-[#1B5E3A] font-semibold hover:underline shrink-0 cursor-pointer"
            >
              {copy.chatbot.clearContext}
            </button>
          )}
        </div>

        <button
          type="button"
          data-testid="toggle-search-grounding"
          aria-pressed={useSearchGrounding}
          onClick={() => setUseSearchGrounding((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
            useSearchGrounding
              ? 'bg-[#ECFDF5] border-[#1B5E3A] text-[#1B5E3A]'
              : 'bg-[#FFFFFF] border-[#DFDDD4] text-[#4D574B]'
          }`}
        >
          <Globe className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span>{copy.chatbot.searchGroundingLabel}</span>
        </button>
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F7F3]">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-[#1B5E3A] font-semibold text-sm">
                <Bot className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{copy.chatbot.welcomeTitle}</span>
              </div>
              <p className="text-xs text-[#4D574B] leading-relaxed">
                {copy.chatbot.welcomeDesc}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#4D574B]">
                {copy.chatbot.quickPromptsHeading}
              </p>
              <div className="space-y-2">
                {copy.chatbot.quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="w-full text-left px-3.5 py-2.5 bg-[#FFFFFF] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded-xl text-xs font-medium text-[#1D241C] transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser
                      ? 'bg-[#1B5E3A] text-white'
                      : 'bg-[#FFFFFF] border border-[#DFDDD4] text-[#1B5E3A]'
                  }`}
                >
                  {isUser ? (
                    <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </div>

                <div className="max-w-[82%] space-y-1.5">
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#1B5E3A] text-white'
                        : 'bg-[#FFFFFF] border border-[#DFDDD4] text-[#1D241C]'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {!isUser && msg.sources && msg.sources.length > 0 && (
                    <div className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl px-3 py-2 space-y-1">
                      <p className="text-[11px] font-semibold text-[#4D574B] flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#1B5E3A]" aria-hidden="true" />
                        <span>{copy.chatbot.sourcesHeading}</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src) => (
                          <a
                            key={src.uri}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F8F7F3] hover:bg-[#F1EFE8] border border-[#DFDDD4] rounded text-[11px] font-medium text-[#1B5E3A] max-w-full truncate"
                          >
                            <span className="truncate max-w-[180px]">{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFFFFF] border border-[#DFDDD4] text-[#1B5E3A] flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div className="bg-[#FFFFFF] border border-[#DFDDD4] rounded-xl px-3.5 py-2.5 text-xs text-[#4D574B]">
              {copy.chatbot.sendingLabel}
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 text-xs text-[#991B1B] space-y-2"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
            {lastFailedInput && (
              <button
                type="button"
                onClick={() => void sendMessage(lastFailedInput, true)}
                className="px-3 py-1 bg-[#FFFFFF] border border-[#FECACA] rounded-lg font-semibold text-[#991B1B] hover:bg-[#FEE2E2] cursor-pointer"
              >
                {copy.chatbot.retryBtn}
              </button>
            )}
          </div>
        )}

        <div ref={listEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-[#FFFFFF] border-t border-[#DFDDD4] flex items-end gap-2 shrink-0"
      >
        <textarea
          ref={inputRef}
          rows={2}
          data-testid="ai-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={copy.chatbot.inputPlaceholder}
          className="flex-1 resize-none px-3 py-2 bg-[#F8F7F3] border border-[#DFDDD4] rounded-xl text-sm text-[#1D241C] placeholder:text-[#4D574B]/70 focus-visible:outline-2 focus-visible:outline-[#1B5E3A]"
        />
        <button
          type="submit"
          data-testid="ai-chat-send"
          disabled={isSending || !input.trim()}
          aria-label={copy.chatbot.sendBtn}
          className="inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] text-sm font-semibold text-white bg-[#1B5E3A] hover:bg-[#14492C] rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{copy.chatbot.sendBtn}</span>
        </button>
      </form>
    </aside>
  );
}
