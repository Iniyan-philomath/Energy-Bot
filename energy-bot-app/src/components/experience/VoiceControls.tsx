import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
export function VoiceControls({
  onTranscript,
  reply,
  onNotice,
  languageCode = "en-IN",
}: {
  onTranscript: (text: string) => void;
  reply: string;
  onNotice: (message: string) => void;
  languageCode?: string;
}) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  useEffect(() => {
    if (!speaking || !reply || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = languageCode;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.split("-")[0] === languageCode.split("-")[0]);
    if (voice) utterance.voice = voice;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [reply, speaking, languageCode]);
  useEffect(
    () => () => {
      if (recognition.current) {
        recognition.current.onresult = null;
        recognition.current.onend = null;
        recognition.current.onerror = null;
        recognition.current.abort();
      }
    },
    [],
  );
  const listen = () => {
    if (listening) {
      recognition.current?.stop();
      setListening(false);
      return;
    }
    const api = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const SpeechRecognition =
      api.SpeechRecognition || api.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onNotice(
        "Voice input is unavailable in this browser. You can type your question below.",
      );
      return;
    }
    const instance = new SpeechRecognition();
    recognition.current = instance;
    instance.lang = languageCode;
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (e) => {
      onTranscript(e.results[0][0].transcript);
      setListening(false);
    };
    instance.onerror = () => {
      setListening(false);
      onNotice(
        "Voice input could not start. Check microphone access, or type your question.",
      );
    };
    instance.onend = () => setListening(false);
    try {
      instance.start();
      setListening(true);
    } catch {
      setListening(false);
      onNotice("Microphone unavailable. Please type your question.");
    }
  };
  return (
    <div className="voice-controls">
      <button
        className={`icon-button ${listening ? "mic-active" : ""}`}
        onClick={listen}
        aria-label={listening ? "Stop listening" : "Dictate a question"}
        aria-pressed={listening}
      >
        {listening ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
      <button
        className="icon-button"
        aria-label={speaking ? "Mute spoken replies" : "Read replies aloud"}
        aria-pressed={speaking}
        onClick={() => {
          if (!("speechSynthesis" in window)) {
            onNotice("Spoken replies are unavailable in this browser.");
            return;
          }
          setSpeaking((s) => !s);
        }}
      >
        {speaking ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
    </div>
  );
}
