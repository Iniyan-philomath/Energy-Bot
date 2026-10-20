import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUp, ArrowUpRight, Check, Copy, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import type { ChatMessage, EnergyTelemetry } from '../../types/energy';
import { generateEnergyAdvice } from './advice';
type Recognition = { start: () => void; abort: () => void; onresult: ((e: {results: {transcript: string}[][]}) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; lang: string; continuous: boolean; interimResults: boolean };
export default function ChatWorkspace({telemetry, onApply, onThinking, onAnswer, reduced, muted}: {telemetry: EnergyTelemetry; onApply: (id:string)=>void; onThinking:(v:boolean)=>void; onAnswer:()=>void; reduced:boolean; muted:boolean}) {
  const [messages,setMessages] = useState<ChatMessage[]>([{id:'welcome',sender:'bot',timestamp:'Scenario guide',text:'A clearer view of your energy.\nI’m Electra. Explore the simulated microgrid, compare tariff windows, or adjust your device strategy. What would you like to understand?'}]);
  const [input,setInput]=useState(''); const [thinking,setThinking]=useState(false); const [error,setError]=useState(''); const [lastQuery,setLastQuery]=useState('');
  const [copied,setCopied]=useState(''); const [listening,setListening]=useState(false); const [voice,setVoice]=useState(false); const [unread,setUnread]=useState(false);
  const stream=useRef<HTMLDivElement>(null); const nearBottom=useRef(true); const timer=useRef<ReturnType<typeof setTimeout> | null>(null); const recognition=useRef<Recognition | null>(null); const busy=useRef(false);
  const voiceRef=useRef(false); useEffect(()=>{voiceRef.current=voice&&!muted; if (!voice || muted) window.speechSynthesis?.cancel();},[voice,muted]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current); recognition.current?.abort(); window.speechSynthesis?.cancel();},[]);
  useEffect(()=>{const el=stream.current;if(el&&nearBottom.current) {el.scrollTo({top:el.scrollHeight,behavior:'instant'});setUnread(false);}else setUnread(true);},[messages,thinking]);
  const send = (query=input) => {
    const text=query.trim(); if(!text||busy.current)return;
    busy.current=true;setLastQuery(text);setError('');setInput('');setMessages(m=>[...m,{id:crypto.randomUUID(),sender:'user',text,timestamp:'You'}]);setThinking(true);onThinking(true);
    timer.current=setTimeout(()=>{
      try { const reply=generateEnergyAdvice(text,telemetry);setMessages(m=>[...m,reply]);onAnswer(); if(voiceRef.current&&'speechSynthesis'in window){const utterance=new SpeechSynthesisUtterance(reply.text);utterance.volume=.5;window.speechSynthesis.speak(utterance);} }
      catch {setError('The local response could not be prepared. Your message is safe; try again.');}
      finally {busy.current=false;setThinking(false);onThinking(false);}
    },600);
  };
  const listen=()=>{
    if(listening){recognition.current?.abort();setListening(false);return;}
    const browser=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition}; const Speech=browser.SpeechRecognition??browser.webkitSpeechRecognition;
    if(!Speech){setError('Voice input is unavailable in this browser. You can still type below.');return;}
    try {const rec=new Speech();recognition.current=rec;rec.lang='en-US';rec.continuous=false;rec.interimResults=false;rec.onresult=e=>{setInput(e.results[0][0].transcript);setListening(false);};rec.onerror=()=>{setListening(false);setError('Microphone access was unavailable. Check browser permissions or type your question.');};rec.onend=()=>setListening(false);rec.start();setListening(true);setError('');}catch{setError('Voice input could not start. Please type your question.');}
  };
  return <section className="chat-workspace" id="conversation" aria-labelledby="chat-title">
    <div className="section-heading"><div><span className="eyebrow">02 / CONVERSATION</span><h2 id="chat-title">Ask better. <em>Use less.</em></h2></div><span className="small-note">Local scenario assistant</span></div>
    <div className="chat-shell">
      <div className="chat-toolbar"><span><span className="electra-mark">ϟ</span> Electra <small> / Energy intelligence</small></span><button className="icon-button" aria-label={voice?'Disable spoken responses':'Enable spoken responses'} aria-pressed={voice} onClick={()=>setVoice(!voice)} title={muted?'Unmute sound in the top bar to hear responses':'Spoken responses'}>{voice&&!muted?<Volume2 size={16}/>:<VolumeX size={16}/>}</button></div>
      <div className="message-stream" ref={stream} role="log" aria-label="Conversation with Electra" aria-live="polite" onScroll={()=>{const el=stream.current;if(el){nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<60;if(nearBottom.current)setUnread(false);}}}>
        {messages.map(msg=><motion.article className={`message ${msg.sender}`} key={msg.id} initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.2}}>
          <div className="message-label">{msg.sender==='bot'?'ELECTRA':'YOU'}<span>{msg.sender==='bot'?'SIMULATION CONTEXT':''}</span></div><p>{msg.text}</p>
          {msg.metrics&&<dl className="message-metrics">{msg.metrics.map(m=><div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}</dl>}
          {msg.actions?.map(action=><button className="response-action" key={action.id} disabled={action.done} onClick={()=>{onApply(action.id);setMessages(ms=>ms.map(m=>m.id===msg.id?{...m,actions:m.actions?.map(a=>a.id===action.id?{...a,done:true}:a)}:m));}}>{action.done?<Check size={14}/>:<ArrowUpRight size={14}/>} {action.label}<small>{action.done?'Applied':'Simulate'}</small></button>)}
          {msg.sender==='bot'&&<button className="copy-button" aria-label="Copy response" onClick={async()=>{try{await navigator.clipboard.writeText(msg.text);setCopied(msg.id);}catch{setError('Clipboard access is unavailable. Select the response text to copy it.');}}}>{copied===msg.id?<Check size={12}/>:<Copy size={12}/>} {copied===msg.id?'Copied':'Copy'}</button>}
        </motion.article>)}
        {thinking&&<div className="processing" role="status"><span/> Reading the scenario…</div>}
      </div>
      {unread&&<button className="new-messages" onClick={()=>{nearBottom.current=true;stream.current?.scrollTo({top:stream.current.scrollHeight,behavior:'instant'});setUnread(false);}}>↓ New messages</button>}
      <div className="prompt-row">{['Analyze peak tariff spike','Optimize EV night charging','Maximize solar self-consumption'].map((p,i)=><button key={p} disabled={thinking} onClick={()=>send(p)}><span>0{i+1}</span>{p}<ArrowUpRight size={13}/></button>)}</div>
      {error&&<div className="inline-error" role="alert">{error} {lastQuery&&<button onClick={()=>send(lastQuery)}>Retry last question</button>}<button aria-label="Dismiss message" onClick={()=>setError('')}>Dismiss</button></div>}
      <form className="composer" onSubmit={e=>{e.preventDefault();send();}}><button type="button" className="icon-button" aria-label={listening?'Stop listening':'Use voice input'} aria-pressed={listening} onClick={listen}>{listening?<MicOff size={18}/>:<Mic size={18}/>}</button><input aria-label="Message Electra" value={input} onChange={e=>setInput(e.target.value)} placeholder={listening?'Listening…':'Ask about your energy scenario…'} maxLength={4000}/><button className="send-button" aria-label="Send message" disabled={!input.trim()||thinking}><ArrowUp size={20}/></button></form>
      <div className="chat-footnote"><span>Rule-based advice · No external AI connection</span><span>Verify before applying to real equipment</span></div>
    </div>
  </section>;
}
