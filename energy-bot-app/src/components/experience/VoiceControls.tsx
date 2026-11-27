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
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export function VoiceControls({
  onTranscript,
  onSubmitTranscript,
  reply,
  onNotice,
  languageCode = "en-IN",
}: {
  onTranscript: (text: string) => void;
  onSubmitTranscript?: (text: string) => void;
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
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcript = useRef("");
  const finished = useRef(false);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!speaking || !reply || !("speechSynthesis" in window)) return;
    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(reply);
    const safeLanguage = languageCode === "auto" ? navigator.language || "en-IN" : languageCode;
    utterance.lang = safeLanguage;
    let cancelled = false;
    let spoken = false;
    const speak = () => {
      if (cancelled || spoken) return;
      const voices = synthesis.getVoices();
      const voice = voices.find(v => v.lang.toLowerCase() === safeLanguage.toLowerCase())
        ?? voices.find(v => v.lang.split("-")[0].toLowerCase() === safeLanguage.split("-")[0].toLowerCase());
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
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    },
    [],
  );

  const listen = () => {
    if (listening) { finishRef.current(); return; }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const api = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const SR = api.SpeechRecognition || api.webkitSpeechRecognition;
    if (!SR) { onNotice("Voice input is unavailable. Please type your question."); return; }
    const inst = new SR();
    recognition.current = inst;
    transcript.current = "";
    finished.current = false;
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      setListening(false);
      inst.stop();
      const text = transcript.current.trim();
      if (text) {
        onTranscript(text);
        onSubmitTranscript?.(text);
        onNotice("");
      } else {
        onNotice("No speech detected. Please try again.");
      }
    };
    finishRef.current = finish;
    const restartSilenceTimer = () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      silenceTimer.current = setTimeout(finish, 3000);
    };
    inst.lang = languageCode === "auto" ? (navigator.language || "en-IN") : languageCode;
    inst.continuous = true;
    inst.interimResults = true;
    inst.onresult = e => {
      transcript.current = Array.from(
        { length: e.results.length },
        (_, index) => e.results[index][0].transcript,
      ).join(" ").trim();
      if (transcript.current) restartSilenceTimer();
    };
    inst.onerror = e => {
      finished.current = true;
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      setListening(false);
      onNotice(e.error === "no-speech" ? "No speech detected. Please try again." : "Microphone unavailable. Please type your question.");
    };
    inst.onend = () => {
      if (!finished.current) finish();
      setListening(false);
    };
    try { inst.start(); setListening(true); restartSilenceTimer(); }
    catch {
      finished.current = true;
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      setListening(false);
      onNotice("Microphone unavailable.");
    }
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
