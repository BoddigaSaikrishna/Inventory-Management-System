import { LanguageOption, LanguageCode } from "@/types/inventory";

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "hi-IN", label: "Hindi / Hinglish", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "en-IN", label: "Indian English", nativeLabel: "English", flag: "🇮🇳" },
  { code: "te-IN", label: "Telugu", nativeLabel: "తెలుగు", flag: "🇮🇳" },
  { code: "ta-IN", label: "Tamil", nativeLabel: "தமிழ்", flag: "🇮🇳" },
  { code: "mr-IN", label: "Marathi", nativeLabel: "मराठी", flag: "🇮🇳" },
  { code: "kn-IN", label: "Kannada", nativeLabel: "ಕನ್ನಡ", flag: "🇮🇳" },
];

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// Global window extensions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Check if Web Speech Recognition is supported in the browser
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Speech Recognition Manager
 */
export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  public startListening(
    langCode: LanguageCode,
    callbacks: SpeechRecognitionCallbacks
  ) {
    if (!this.recognition) {
      callbacks.onError?.("Speech recognition is not supported in this browser.");
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.lang = langCode;

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        callbacks.onResult?.(finalTranscript, true);
      } else if (interimTranscript) {
        callbacks.onResult?.(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      callbacks.onError?.(event.error || "Speech recognition error.");
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (err: any) {
      this.isListening = false;
      callbacks.onError?.(err.message || "Failed to start microphone.");
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  public getListeningState(): boolean {
    return this.isListening;
  }
}

/**
 * Text-to-Speech (TTS) synthesis helper for regional spoken feedback
 */
export function speakText(text: string, langCode: LanguageCode = "hi-IN") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95; // Slightly calmer speaking speed for store owners
    utterance.pitch = 1.0;

    // Try to find matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((v) => v.lang.startsWith(langCode.split("-")[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis failed:", err);
  }
}

export const speechService = new SpeechService();
