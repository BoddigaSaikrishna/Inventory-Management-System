import { useState } from "react";
import { Mic, MicOff, Globe, Sparkles, WifiOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LanguageCode } from "@/types/inventory";
import { SUPPORTED_LANGUAGES, speechService, isSpeechRecognitionSupported } from "@/lib/speech";

interface PersistentVoiceAssistantProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isOnline: boolean;
  onProcessTranscript: (text: string) => void;
  lastFeedbackMessage?: string;
  onSpeakText?: (text: string) => void;
}

export const PersistentVoiceAssistant = ({
  currentLanguage,
  onLanguageChange,
  isOnline,
  onProcessTranscript,
  lastFeedbackMessage,
  onSpeakText,
}: PersistentVoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isSupported = isSpeechRecognitionSupported();
  const micEnabled = isOnline && isSupported;

  const handleToggleListening = () => {
    if (!micEnabled) return;

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setErrorMessage("");
      setInterimText("");
      speechService.startListening(currentLanguage, {
        onStart: () => setIsListening(true),
        onResult: (text, isFinal) => {
          setInterimText(text);
          if (isFinal) {
            setIsListening(false);
            onProcessTranscript(text);
          }
        },
        onError: (err) => {
          setIsListening(false);
          let userMsg = err;
          if (err === "not-allowed") {
            userMsg = "Microphone access blocked. Please allow mic permissions.";
          } else if (err === "no-speech") {
            userMsg = "No speech heard. Please speak closer to microphone.";
          }
          setErrorMessage(userMsg);
        },
        onEnd: () => setIsListening(false),
      });
    }
  };

  const selectedLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const quickTriggers = [
    { label: "➕ Add 50 bags rice", text: "Add 50 bags of rice" },
    { label: "➖ Sold 5 kg sugar", text: "Sold 5 kg sugar" },
    { label: "➖ Sold 5 dozens eggs", text: "Sold 5 dozens eggs" },
    { label: "📊 How much sugar sold today?", text: "How much sugar did I sell today?" },
    { label: "🔍 Rice kitna bacha hai?", text: "Rice kitna bacha hai?" },
    { label: "⚠️ What is running low?", text: "What is running low?" },
    { label: "⚙️ Set rice reorder 20 bags", text: "Set rice reorder level to 20 bags" },
  ];

  return (
    <aside aria-label="Voice Assistant Controls" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-emerald-500/30 shadow-2xl px-3 py-2 sm:p-4">
      <div className="mx-auto max-w-5xl space-y-2">
        {/* Quick Prompts Carousel/Scroll Strip: Visible on BOTH Mobile & Desktop */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-emerald-400 shrink-0 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Sparkles className="h-3 w-3" /> Quick Speak:
          </span>
          {quickTriggers.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onProcessTranscript(q.text)}
              className="shrink-0 bg-slate-900/90 hover:bg-slate-800 active:bg-emerald-950 border border-emerald-500/30 px-2.5 py-1 rounded-full text-slate-200 text-[11px] font-medium transition-all active:scale-95 whitespace-nowrap"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Main Mic Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Floating Voice Mic Button */}
          <div className="relative shrink-0">
            {isListening && (
              <>
                <span className="absolute -inset-2.5 rounded-full bg-emerald-500/30 animate-ping opacity-75" />
                <span className="absolute -inset-5 rounded-full bg-emerald-500/15 animate-pulse opacity-50" />
              </>
            )}

            <Button
              onClick={handleToggleListening}
              disabled={!micEnabled}
              size="icon"
              className={`h-13 w-13 sm:h-16 sm:w-16 rounded-full shadow-2xl transition-all transform active:scale-95 ${
                !micEnabled
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : isListening
                  ? "bg-gradient-to-br from-rose-500 to-red-600 text-white ring-4 ring-rose-400/40 animate-pulse"
                  : "bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 ring-4 ring-emerald-400/30 hover:scale-105"
              }`}
              title={
                !micEnabled
                  ? "Speech not available"
                  : isListening
                  ? "Tap to stop listening"
                  : "Tap and speak inventory command"
              }
            >
              {!micEnabled ? (
                <WifiOff className="h-6 w-6 sm:h-7 sm:w-7" />
              ) : isListening ? (
                <MicOff className="h-6 w-6 sm:h-7 sm:w-7 animate-bounce text-white" />
              ) : (
                <Mic className="h-7 w-7 sm:h-8 sm:w-8 text-slate-950 font-black" />
              )}
            </Button>
          </div>

          {/* Center: Live Status & Feedback message */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                {isListening ? (
                  <span className="text-emerald-400 animate-pulse flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    Listening ({selectedLang.nativeLabel})...
                  </span>
                ) : (
                  <span className="text-emerald-400">Voice Assistant Ready</span>
                )}
              </span>

              {/* Language Switcher Pill */}
              <div className="relative inline-flex items-center gap-1 bg-slate-900 border border-border px-1.5 py-0.5 rounded-full text-[10px] shrink-0">
                <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                <select
                  value={currentLanguage}
                  onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                  className="bg-transparent text-foreground outline-none cursor-pointer text-[10px] font-semibold"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                      {lang.flag} {lang.nativeLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-300 truncate mt-0.5 font-medium">
              {isListening
                ? interimText || "Speak e.g., 'Sold 5 kg sugar' or 'Rice kitna bacha hai?'"
                : lastFeedbackMessage || "Tap mic to speak. Zero typing required."}
            </p>
          </div>

          {/* Right: Repeat Audio Button */}
          {lastFeedbackMessage && onSpeakText && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSpeakText(lastFeedbackMessage)}
              className="text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 h-8 px-2 sm:px-3 shrink-0"
              title="Repeat audio feedback"
            >
              <Volume2 className="h-3.5 w-3.5 sm:mr-1 text-emerald-400" />
              <span className="hidden sm:inline">Repeat</span>
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="text-center text-xs text-rose-400 mt-1">{errorMessage}</p>
      )}
    </aside>
  );
};

export default PersistentVoiceAssistant;
