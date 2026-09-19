import { useState } from "react";
import { Mic, MicOff, Globe, Sparkles, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageCode } from "@/types/inventory";
import { SUPPORTED_LANGUAGES, speechService, isSpeechRecognitionSupported } from "@/lib/speech";

interface VoiceMicButtonProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onTranscriptReceived: (transcript: string, isFinal: boolean) => void;
  onListeningStateChange?: (isListening: boolean) => void;
  /** Pass false when device is offline to disable the mic and show offline message */
  isOnline?: boolean;
}

const VoiceMicButton = ({
  currentLanguage,
  onLanguageChange,
  onTranscriptReceived,
  onListeningStateChange,
  isOnline = true,
}: VoiceMicButtonProps) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isSupported = isSpeechRecognitionSupported();
  // Mic is only usable when online AND speech API is supported
  const micEnabled = isOnline && isSupported;

  const handleToggleListening = () => {
    if (!micEnabled) return;  // Guard: do nothing when offline
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      onListeningStateChange?.(false);
    } else {
      setErrorMessage("");
      setInterimText("");
      speechService.startListening(currentLanguage, {
        onStart: () => {
          setIsListening(true);
          onListeningStateChange?.(true);
        },
        onResult: (text, isFinal) => {
          setInterimText(text);
          onTranscriptReceived(text, isFinal);
          if (isFinal) {
            setIsListening(false);
            onListeningStateChange?.(false);
          }
        },
        onError: (err) => {
          setIsListening(false);
          onListeningStateChange?.(false);
          let userMsg = err;
          if (err === "not-allowed") {
            userMsg = "🎙️ Microphone permission blocked by browser. Please click the Lock icon (🔒) in your address bar and Allow Microphone access.";
          } else if (err === "no-speech") {
            userMsg = "No speech detected. Try speaking closer to mic.";
          } else if (err === "audio-capture") {
            userMsg = "No microphone hardware found on your device.";
          }
          setErrorMessage(userMsg);
        },
        onEnd: () => {
          setIsListening(false);
          onListeningStateChange?.(false);
        },
      });
    }
  };

  const selectedLangConfig = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-xl">
      {/* Top Bar: Language Picker Pill & Status */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
            Voice Assistant
          </span>
        </div>

        {/* Language dropdown pill */}
        <div className="relative flex items-center gap-1.5 bg-secondary/80 border border-border px-3 py-1 rounded-full text-xs hover:border-primary/50 transition-colors">
          <Globe className="h-3.5 w-3.5 text-emerald-400" />
          <select
            value={currentLanguage}
            onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
            className="bg-transparent text-foreground font-medium outline-none cursor-pointer text-xs"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-foreground">
                {lang.flag} {lang.nativeLabel} ({lang.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Microphone Button with Pulsing Wave Rings */}
      <div className="relative my-2">
        {isListening && (
          <>
            <span className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
            <span className="absolute -inset-8 rounded-full bg-emerald-500/10 animate-pulse opacity-50" />
          </>
        )}

        <Button
          onClick={handleToggleListening}
          disabled={!micEnabled}
          size="icon"
          className={`h-20 w-20 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
            !micEnabled
              ? "bg-slate-700/60 text-slate-500 cursor-not-allowed ring-4 ring-slate-600/20"
              : isListening
              ? "bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white ring-4 ring-rose-400/40"
              : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 ring-4 ring-emerald-500/30"
          }`}
          title={!micEnabled ? (isOnline ? "Speech not supported in this browser" : "Voice recognition requires internet") : isListening ? "Stop listening" : "Tap to speak in regional language"}
        >
          {!micEnabled ? (
            <WifiOff className="h-9 w-9" />
          ) : isListening ? (
            <MicOff className="h-9 w-9 animate-bounce text-white" />
          ) : (
            <Mic className="h-9 w-9 text-slate-950" />
          )}
        </Button>
      </div>

      {/* Guidance Text or Live Hearing Text */}
      <div className="mt-3 text-center px-4 max-w-md">
        {/* Offline notice overrides everything else */}
        {!isOnline ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-semibold">
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              Voice recognition offline
            </div>
            <p className="text-xs text-muted-foreground">
              नेटवर्क वापस आने पर माइक काम करेगा।{" "}
              <span className="text-slate-500">నెట్‌వర్క్ వస్తే మాట్లాడవచ్చు.</span>
            </p>
            <p className="text-xs text-emerald-400/80 font-medium">
              ✅ Use the text command bar below to add stock while offline.
            </p>
          </div>
        ) : isListening ? (
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Listening ({selectedLangConfig.nativeLabel})...
            </div>
            <p className="text-sm font-medium text-foreground italic mt-2 min-h-[24px]">
              {interimText ? `"${interimText}"` : "Speak e.g., 'Add 5 cartons of Rice' or '5 borii chawal becha'"}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-foreground">
              Tap Microphone to Speak Stock Actions
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supports: "Add 5 bags rice", "Sold 2 dozen eggs", "Chawal kitna bacha hai?"
            </p>
          </div>
        )}

        {isOnline && errorMessage && (
          <p className="text-xs font-medium text-destructive mt-2 bg-destructive/10 px-3 py-1 rounded-lg">
            {errorMessage}
          </p>
        )}
      </div>

      {isOnline && !isSupported && (
        <div className="mt-3 text-xs text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg text-center">
          ⚠️ Speech API not supported in your browser. You can type voice queries manually in the command bar below.
        </div>
      )}
    </div>
  );
};

export default VoiceMicButton;
