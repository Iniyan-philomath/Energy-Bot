import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, 
  CheckCircle2, RefreshCw, Zap, Cpu, ArrowRight, ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VoiceWaveform } from './VoiceWaveform';
import type { EnergyTelemetry, ChatMessage } from '../types/energy';

interface EnergyBotChatProps {
  telemetry: EnergyTelemetry;
  onApplyOptimization: (actionId: string) => void;
  chatSectionRef?: React.RefObject<HTMLDivElement | null>;
}

export const EnergyBotChat: React.FC<EnergyBotChatProps> = ({ 
  telemetry, 
  onApplyOptimization, 
  chatSectionRef 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      timestamp: 'Just now',
      text: "Hello. I am VOLT-IQ, your Autonomous Energy Copilot. I'm actively balancing your 4.8 kW solar generation, 13.5 kWh battery storage, and dynamic grid pricing in real time. What would you like to optimize?",
      metrics: [
        { label: 'Solar Flux', value: `${telemetry.solarGenerationKw.toFixed(1)} kW` },
        { label: 'Spot Price', value: `$${telemetry.currentTariffPerKwh.toFixed(2)}/kWh` },
        { label: 'Clean Energy', value: `${telemetry.cleanEnergyPct}%` }
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingEnabled, setIsSpeakingEnabled] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string>('Voice Ready');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // TTS Helper using Browser SpeechSynthesis
  const speakText = (text: string) => {
    if (!isSpeakingEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const clean = text
      .replace(/[⚡☀️🔋🚗💡✅🚨]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\[.*?\]/g, '');

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.name.includes('Natural') || v.name.includes('Google') || v.lang.startsWith('en'));
    if (naturalVoice) utterance.voice = naturalVoice;

    window.speechSynthesis.speak(utterance);
  };

  // Web Speech Recognition Handler
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
                              (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      setSpeechStatus('Mic paused');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechStatus('Listening...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
        setSpeechStatus('Captured');
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setSpeechStatus('Mic error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechStatus('Mic init error');
    }
  };

  // Intelligent Energy Advice Engine
  const generateEnergyAdvice = (query: string): ChatMessage => {
    const q = query.toLowerCase();

    if (q.includes('tariff') || q.includes('peak') || q.includes('price') || q.includes('cost')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        timestamp: 'Just now',
        text: `Dynamic Tariff Prediction:\nPeak tariff of $${telemetry.peakTariffPerKwh.toFixed(2)}/kWh begins in 2 hours. Your battery storage is currently at ${telemetry.batterySocPct}% State of Charge. I recommend discharging 3.2 kW from storage during the peak window to eliminate grid charges.`,
        metrics: [
          { label: 'Avoided Peak Cost', value: '$4.85 / cycle' },
          { label: 'Grid Shaving', value: '88% Reduction' }
        ],
        actions: [
          {
            id: 'act-peak-shave',
            label: 'Activate Peak Shaving Discharge',
            type: 'apply'
          }
        ]
      };
    }

    if (q.includes('ev') || q.includes('car') || q.includes('tesla') || q.includes('charge')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        timestamp: 'Just now',
        text: `EV Autonomous Charging Window:\nYour Wallbox charger is connected. Immediate charging draws 7.2 kW at $${telemetry.currentTariffPerKwh.toFixed(2)}/kWh. If we defer charging to the off-peak overnight slot (02:00 - 06:00 at $0.08/kWh), charging cost decreases by 64% while maintaining departure readiness by 07:00 AM.`,
        metrics: [
          { label: 'Overnight Savings', value: '$8.40 per charge' },
          { label: 'Readiness Target', value: '07:00 AM (100%)' }
        ],
        actions: [
          {
            id: 'act-delay-ev',
            label: 'Schedule Nighttime EV Charge',
            type: 'apply'
          }
        ]
      };
    }

    if (q.includes('solar') || q.includes('panel') || q.includes('weather') || q.includes('sun')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        timestamp: 'Just now',
        text: `Solar Microgrid Balance:\nSolar generation is operating at +${telemetry.solarGenerationKw.toFixed(1)} kW with 840 W/m² irradiance. Generation exceeds active home draw by +${telemetry.gridExportKw.toFixed(1)} kW. We can divert surplus generation into your heat pump water heater to store thermal energy.`,
        metrics: [
          { label: 'Self-Consumption', value: '94.2%' },
          { label: 'CO2 Offset Today', value: `${telemetry.carbonOffsetKg.toFixed(1)} kg` }
        ],
        actions: [
          {
            id: 'act-divert-solar',
            label: 'Divert Surplus to Thermal Storage',
            type: 'apply'
          }
        ]
      };
    }

    if (q.includes('battery') || q.includes('bess') || q.includes('backup') || q.includes('outage')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        timestamp: 'Just now',
        text: `BESS Resilience & Islanding:\nYour 13.5 kWh solid-state BESS is at ${telemetry.batterySocPct}% capacity. In the event of a utility grid disconnection, the inverter islands in <16ms. With critical circuits prioritized, you have 9.4 hours of uninterrupted autonomy.`,
        metrics: [
          { label: 'Resilience Reserve', value: '9.4 Hours' },
          { label: 'Essential Load', value: '1.2 kW' }
        ],
        actions: [
          {
            id: 'act-test-island',
            label: 'Simulate Microgrid Islanding Isolation',
            type: 'simulate'
          }
        ]
      };
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'bot',
      timestamp: 'Just now',
      text: `Energy Copilot Telemetry Audit:\nSystem metrics cross-referenced: Home consumption is ${telemetry.homeConsumptionKw.toFixed(1)} kW, Solar generation is +${telemetry.solarGenerationKw.toFixed(1)} kW, and Battery SoC is ${telemetry.batterySocPct}%. Overall microgrid efficiency is 98.4%.`,
      metrics: [
        { label: 'Operating State', value: 'Net Exporter' },
        { label: 'Projected Savings', value: '$34.20/wk' }
      ],
      actions: [
        {
          id: 'act-full-audit',
          label: 'Run 24-Hour Predictive Forecasting',
          type: 'apply'
        }
      ]
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsThinking(true);

    setTimeout(() => {
      const botResponse = generateEnergyAdvice(text);
      setMessages(prev => [...prev, botResponse]);
      setIsThinking(false);
      speakText(botResponse.text);
    }, 600);
  };

  const handleExecuteAction = (actionId: string, messageId: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#34d399', '#fbbf24', '#ffffff']
    });

    onApplyOptimization(actionId);

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.actions) {
        return {
          ...msg,
          actions: msg.actions.map(act => act.id === actionId ? { ...act, done: true } : act)
        };
      }
      return msg;
    }));
  };

  return (
    <section ref={chatSectionRef} id="copilot-section" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400 mb-3">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Neural Microgrid Copilot</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Conversational Intelligence.
          </h2>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => setIsSpeakingEnabled(!isSpeakingEnabled)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            isSpeakingEnabled 
              ? 'bg-white/[0.08] border-white/20 text-white' 
              : 'bg-black/60 border-white/5 text-neutral-500'
          }`}
          title="Toggle Voice Speech Output"
        >
          {isSpeakingEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{isSpeakingEnabled ? 'Voice Synthesis: On' : 'Voice Synthesis: Muted'}</span>
        </button>
      </div>

      {/* Apple Pro Copilot Frame */}
      <div className="apple-glass rounded-3xl overflow-hidden border border-white/[0.08] flex flex-col md:flex-row h-[700px] shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
        
        {/* Left Side: Apple Siri / Intelligence Ambient Orb */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-white/[0.08] bg-black/40 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-semibold">
                Neural Reactor
              </span>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isListening 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' 
                  : isThinking 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isListening ? 'Listening' : isThinking ? 'Computing' : 'Synced'}
              </span>
            </div>

            {/* Siri-style Apple Intelligence glowing orb */}
            <div className="relative my-8 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Chromatic ambient glow */}
                <div className={`absolute inset-0 rounded-full blur-[35px] transition-all duration-700 ${
                  isListening 
                    ? 'bg-gradient-to-tr from-amber-500/40 via-rose-500/40 to-yellow-400/40' 
                    : isThinking 
                    ? 'bg-gradient-to-tr from-purple-600/40 via-indigo-500/40 to-emerald-400/30' 
                    : 'bg-gradient-to-tr from-emerald-500/30 via-teal-500/20 to-amber-500/20'
                }`} />

                {/* Inner glass orb */}
                <div className="relative w-28 h-28 rounded-full bg-neutral-900/90 border border-white/20 backdrop-blur-2xl flex flex-col items-center justify-center shadow-2xl">
                  <Zap className={`w-8 h-8 transition-colors duration-500 ${
                    isListening ? 'text-amber-400' : isThinking ? 'text-purple-400 animate-spin-slow' : 'text-emerald-400'
                  }`} />
                  <span className="text-[10px] font-mono font-medium tracking-widest text-neutral-300 mt-1">
                    VOLT-IQ
                  </span>
                </div>
              </div>

              {/* Dynamic Sound Waveform Canvas */}
              <div className="mt-4 w-full flex justify-center">
                <VoiceWaveform isActive={isListening || isThinking} color={isListening ? '#fbbf24' : '#34d399'} />
              </div>
            </div>

            {/* Context Telemetry Summary */}
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-neutral-400">Solar Generation</span>
                <span className="text-amber-400 font-medium">+{telemetry.solarGenerationKw.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-neutral-400">Home Demand</span>
                <span className="text-white font-medium">{telemetry.homeConsumptionKw.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-neutral-400">Battery SoC</span>
                <span className="text-emerald-400 font-medium">{telemetry.batterySocPct}%</span>
              </div>
            </div>
          </div>

          {/* Quick Prompt Pills */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-2 font-semibold">
              Suggested Prompts
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                "Analyze peak tariff spike",
                "Optimize EV night charging",
                "Check battery backup duration",
                "Maximize solar self-consumption"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="text-left text-xs px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{chip}</span>
                  <ArrowRight className="w-3 h-3 text-neutral-500 flex-shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Message Stream & Apple-style Prompt Bar */}
        <div className="flex-1 flex flex-col justify-between bg-black/20 backdrop-blur-xl">
          
          {/* Messages Stream */}
          <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0 text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 sm:p-5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-neutral-800 text-white rounded-br-sm shadow-lg'
                      : 'bg-white/[0.03] border border-white/[0.08] text-neutral-200 rounded-bl-sm shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-line text-sm sm:text-[15px] font-normal leading-relaxed">{msg.text}</p>

                  {/* Metrics Grid */}
                  {msg.metrics && msg.metrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06] font-mono text-xs">
                      {msg.metrics.map((metric, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/[0.05]">
                          <p className="text-neutral-500 text-[10px] uppercase tracking-wider">{metric.label}</p>
                          <p className="text-emerald-400 font-semibold text-xs mt-0.5">{metric.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Execution Button */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {msg.actions.map(act => (
                        <button
                          key={act.id}
                          disabled={act.done}
                          onClick={() => handleExecuteAction(act.id, msg.id)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            act.done
                              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 cursor-default'
                              : 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] font-semibold'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {act.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4 text-black" />}
                            {act.label}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-wider">
                            {act.done ? 'Applied' : 'Execute'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="block text-[10px] text-neutral-500 text-right mt-2 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-3 items-center text-sm">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-400 animate-spin">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-neutral-400 text-xs font-mono flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Synthesizing smart meter telemetry &amp; tariff matrix...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar Area */}
          <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-black/60">
            {isListening && (
              <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono text-amber-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  {speechStatus}
                </span>
                <button 
                  onClick={toggleSpeechRecognition}
                  className="text-amber-200 hover:text-white underline text-[11px] cursor-pointer"
                >
                  Stop listening
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2.5"
            >
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-3 rounded-full border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-neutral-300 hover:text-white'
                }`}
                title={isListening ? "Stop Listening" : "Tap to Speak with Copilot"}
              >
                {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask VOLT-IQ: 'How to cut 20% on next bill?' or 'Isolate microgrid'..."
                className="flex-1 bg-white/[0.03] border border-white/10 focus:border-white/30 rounded-full px-5 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all font-sans"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim()}
                className="p-3 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2.5 font-mono px-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Local Telemetry Enclave
              </span>
              <span>Autonomous Copilot v4.2</span>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
