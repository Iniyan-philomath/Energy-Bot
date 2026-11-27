/**
 * VoiceControls.tsx
 * Kept for backward-compatibility (App.tsx demo panel).
 * The primary chat voice controls are now inline in ConnectedCopilot.
 */
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
  const [speaking,  setSpeaking]  = useState(() => {
    try { return localStorage.getItem("energy-bot-voice-enabled") !== "false"; }
    catch { return true; }
  });
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    if (!speaking || !reply || !("speechSynthesis" in window)) return;
    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(reply);
    utterance.lang = languageCode;
    let cancelled = false;
    let spoken = false;
    const speak = () => {
      if (cancelled || spoken) return;
      const voices = synthesis.getVoices();
      const voice = voices.find(v => v.lang.toLowerCase() === languageCode.toLowerCase())
        ?? voices.find(v => v.lang.split("-")[0].toLowerCase() === languageCode.split("-")[0].toLowerCase());
      if (voice) utterance.voice = voice;
      utterance.rate = 1;
      synthesis.speak(utterance);
      spoken = true;
    };
    synthesis.cancel();
    if (synthesis.getVoices().length) speak();
    else {
      synthesis.addEventListener("voiceschanged", speak, { once: true });
      window.setTimeout(speak, 500);
    }
    return () => {
      cancelled = true;
      synthesis.removeEventListener("voiceschanged", speak);
      synthesis.cancel();
    };
  }, [reply, speaking, languageCode]);

  useEffect(() => {
    try { localStorage.setItem("energy-bot-voice-enabled", String(speaking)); } catch { /* optional preference */ }
  }, [speaking]);

  useEffect(
    () => () => {
      recognition.current?.abort();
    },
    [],
  );

  const listen = () => {
    if (listening) { recognition.current?.stop(); setListening(false); return; }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const api = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const SR = api.SpeechRecognition || api.webkitSpeechRecognition;
    if (!SR) { onNotice("Voice input is unavailable. Please type your question."); return; }
    const inst = new SR();
    recognition.current = inst;
    inst.lang = languageCode === "auto" ? (navigator.language || "en-IN") : languageCode;
    inst.continuous = false;
    inst.interimResults = false;
    inst.onresult = e => { onTranscript(e.results[0][0].transcript); setListening(false); };
    inst.onerror  = () => { setListening(false); onNotice("Microphone unavailable. Please type your question."); };
    inst.onend    = () => setListening(false);
    try { inst.start(); setListening(true); }
    catch { setListening(false); onNotice("Microphone unavailable."); }
  };

  return (
    <div className="voice-controls">
      <button
        className={`icon-button${listening ? " mic-active" : ""}`}
        onClick={listen}
        aria-label={listening ? "Stop listening" : "Dictate a question"}
      >
        {listening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      <button
        className="icon-button"
        onClick={() => setSpeaking(s => !s)}
        aria-label={speaking ? "Mute voice replies" : "Enable voice replies"}
      >
        {speaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
    </div>
  );
}
