import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { ArrowUp, Copy, RefreshCw } from 'lucide-react';
import { apiConfigured, askAssistant, getReportStatus, languageOptions } from '../../lib/chatApi';
import type { ChatMode, Citation, ReportStatus } from '../../lib/chatApi';
import ChatWorkspace from './ChatWorkspace';
import { VoiceControls } from '../experience/VoiceControls';
type Message = {id:string; role:'user'|'assistant'; text:string; citations?:Citation[]; language?:string};
const emptyMessages: Message[] = [];
export default function AuditWorkspace(props:ComponentProps<typeof ChatWorkspace>) {
  const [mode,setMode]=useState<ChatMode|'demo'>(apiConfigured?'report':'demo');
  const [language,setLanguage]=useState('auto');
  const [conversations,setConversations]=useState<Record<ChatMode,Message[]>>({report:[],electrical:[]});
  const [input,setInput]=useState('');const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const [last,setLast]=useState('');
  const [report,setReport]=useState<ReportStatus|null>(null);const [reportError,setReportError]=useState('');const [checking,setChecking]=useState(apiConfigured);const [reload,setReload]=useState(0);
  const pending=useRef<AbortController|null>(null);const lock=useRef(false);const stream=useRef<HTMLDivElement>(null);const nearBottom=useRef(true);const [unread,setUnread]=useState(false);
  const messages=mode==='demo'?emptyMessages:conversations[mode];
  useEffect(()=>{
    if(mode!=='report'||!apiConfigured)return;
    const controller=new AbortController();let active=true;
    const timeout=setTimeout(()=>controller.abort(),90000);
    getReportStatus(controller.signal).then(r=>{if(active)setReport(r);}).catch(e=>{if(active)setReportError(controller.signal.aborted?'Report connection timed out. Retry below.':e.message);}).finally(()=>{clearTimeout(timeout);if(active)setChecking(false);});
    return()=>{active=false;clearTimeout(timeout);controller.abort();};
  },[mode,reload]);
  useEffect(()=>()=>pending.current?.abort(),[]);
  useEffect(()=>{const el=stream.current;if(!el)return;if(nearBottom.current){el.scrollTop=el.scrollHeight;setUnread(false);}else setUnread(true);},[messages,busy]);
  const send=async(question=input)=>{
    if(mode==='demo'||!question.trim()||lock.current)return;
    const activeMode=mode;lock.current=true;setBusy(true);props.onThinking(true);setNotice('');setLast(question);setInput('');
    const history=conversations[activeMode].slice(-6).map(({role,text})=>({role,text}));
    const user:Message={id:crypto.randomUUID(),role:'user',text:question.trim()};
    setConversations(c=>({...c,[activeMode]:[...c[activeMode],user]}));
    const controller=new AbortController();pending.current=controller;const timeout=setTimeout(()=>controller.abort(),110000);
    try{const result=await askAssistant({question:user.text,mode:activeMode,language,history},controller.signal);setConversations(c=>({...c,[activeMode]:[...c[activeMode],{id:crypto.randomUUID(),role:'assistant',text:result.answer,citations:result.citations,language:result.language}]}));props.onAnswer();}
    catch(e){setNotice(controller.signal.aborted?'Request cancelled or timed out. You can retry.':e instanceof Error?e.message:'Request failed. Please retry.');}
    finally{clearTimeout(timeout);pending.current=null;lock.current=false;setBusy(false);props.onThinking(false);}
  };
  return <div className="audit-workspace"><div className="audit-mode-tabs" aria-label="Conversation mode">{([['report','Audit report'],['electrical','Electrical Q&A'],['demo','Microgrid demo']] as const).map(([value,label])=><button key={value} aria-pressed={mode===value} disabled={busy} onClick={()=>{if(value==='report'){setChecking(apiConfigured);setReportError('');}setMode(value);setNotice('');setInput('');nearBottom.current=true;}}>{label}</button>)}</div>
  {mode==='demo'?<ChatWorkspace {...props}/>:<section className="chat-workspace" id="conversation" aria-labelledby="audit-chat-title"><div className="section-heading"><div><span className="eyebrow">02 / CONVERSATION</span><h2 id="audit-chat-title">{mode==='report'?'Your audit.':'Your questions.'} <em>Understood.</em></h2></div></div>
    <div className="chat-shell"><div className="chat-toolbar"><span><span className="electra-mark">ϟ</span> Electra <small>/ {mode==='report'?'Audit report':'Electrical knowledge'}</small></span><VoiceControls onTranscript={setInput} reply={props.muted?'':messages.filter(m=>m.role==='assistant').at(-1)?.text||''} onNotice={setNotice} languageCode={language==='auto'?messages.filter(m=>m.language).at(-1)?.language||'en-IN':language}/></div>
    <div className="audit-context"><label>Reply language <select aria-label="Reply language" value={language} disabled={busy} onChange={e=>setLanguage(e.target.value)}>{languageOptions.map(([code,label])=><option value={code} key={code}>{label}</option>)}</select></label>
    {mode==='report'&&<div className="report-status" role="status"><div>{!apiConfigured?'Report service awaiting connection':checking?'Connecting to the audit library…':reportError|| (report?`${report.filename} · ${report.pageCount} pages · ${report.ready&&report.modelConfigured?'Ready for questions':'Service setup incomplete'}`:'Awaiting report')}{!!report?.imageHeavyPages.length&&<small>{report.imageHeavyPages.length} image-heavy pages may need manual review.</small>}</div>{apiConfigured&&<button className="icon-button" aria-label="Retry report connection" disabled={checking} onClick={()=>{setChecking(true);setReportError('');setReload(v=>v+1);}}><RefreshCw size={14}/></button>}</div>}
    </div>
    <div className="message-stream" ref={stream} role="log" aria-live="polite" aria-label="Audit and electrical conversation" onScroll={()=>{const el=stream.current;if(el){nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<60;if(nearBottom.current)setUnread(false);}}}>
      <article className="message bot"><div className="message-label">ELECTRA</div><p>{mode==='report'?'Explore your connected energy audit. Answers include source quotations and PDF page references when available. Scanned pages and charts may require manual review.':'Ask about circuits, machines, power systems, or energy efficiency. These are general AI explanations; use Audit report for questions about your PDF.'}</p></article>
      {messages.map(m=><article className={`message ${m.role==='user'?'user':'bot'}`} key={m.id}><div className="message-label">{m.role==='user'?'YOU':'ELECTRA'}</div><p dir="auto">{m.text}</p>{m.citations?.map((c,i)=><details className="audit-citation" key={`${c.page}-${i}`}><summary>PDF page {c.page}{c.printedPage?` · printed ${c.printedPage}`:''}</summary><blockquote>{c.quote}</blockquote><small>{c.filename}</small></details>)}{m.role==='assistant'&&<button className="copy-button" onClick={async()=>{try{await navigator.clipboard.writeText(m.text);setNotice('Response copied.');}catch{setNotice('Clipboard unavailable. Select the response to copy it.');}}}><Copy size={12}/>Copy response</button>}</article>)}
      {busy&&<div className="processing" role="status"><span/>{mode==='report'?'Reading relevant report pages…':'Preparing your answer…'}</div>}
    </div>{unread&&<button className="new-messages" onClick={()=>{nearBottom.current=true;if(stream.current)stream.current.scrollTop=stream.current.scrollHeight;setUnread(false);}}>↓ New messages</button>}
    <div className="prompt-row">{(mode==='report'?(report?.ready?['Summarize this energy audit.','Which improvements should we prioritize?']:[]):['Explain power factor.','What is the difference between kW and kWh?']).map(q=><button disabled={busy} key={q} onClick={()=>void send(q)}>{q}</button>)}</div>
    {notice&&<div className="inline-error" role="status">{notice} {last&&<button disabled={busy} onClick={()=>void send(last)}>Retry last question</button>}</div>}
    <form className="composer" onSubmit={e=>{e.preventDefault();void send();}}><input aria-label="Ask Electra AI" placeholder={mode==='report'?'Ask about your energy audit…':'Ask an electrical question…'} value={input} maxLength={2000} onChange={e=>setInput(e.target.value)}/><button className="send-button" aria-label="Send AI question" disabled={busy||!input.trim()}><ArrowUp size={20}/></button></form>
    <div className="chat-footnote"><span>{mode==='report'?'Report evidence · Separate from simulated telemetry':'General AI knowledge · Verify before practical use'}</span>{busy&&<button onClick={()=>pending.current?.abort()}>Cancel request</button>}</div></div>
  </section>}</div>;
}
