import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import type { AssemblyProps } from './PowerAssembly';
const PowerAssembly=lazy(()=>import('./PowerAssembly'));
function StaticAssembly(){return <div className="static-assembly" role="img" aria-label="Schematic fallback of the electrical assembly"><svg viewBox="0 0 300 300"><ellipse cx="150" cy="250" rx="100" ry="20"/><path d="M65 240V90M235 240V90M150 60V235M110 230V100M190 230V100"/>{Array.from({length:9},(_,i)=><ellipse key={i} cx="150" cy={105+i*14} rx="46" ry="8"/>)}<ellipse cx="150" cy="90" rx="88" ry="22"/><ellipse cx="150" cy="225" rx="88" ry="22"/><circle cx="150" cy="60" r="12"/></svg><span>Assembly schematic · 3D unavailable</span></div>;}
class SceneBoundary extends Component<{children:ReactNode;onFail:()=>void},{failed:boolean}> {
  state={failed:false}; static getDerivedStateFromError(){return {failed:true};} componentDidCatch(){this.props.onFail();}
  render(){return this.state.failed?<StaticAssembly/>:this.props.children;}
}
export default function SceneStage(props: Omit<AssemblyProps,'active'|'pointer'> & {onFail:()=>void}){
  const onFail=props.onFail;
  const host=useRef<HTMLDivElement>(null);const frame=useRef<HTMLDivElement>(null);const pointer=useRef({x:0,y:0});
  const [visible,setVisible]=useState(true);const [hidden,setHidden]=useState(document.hidden);const [failed,setFailed]=useState(false);
  useEffect(()=>{const el=host.current;if(!el)return;const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:'100px'});observer.observe(el);const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',change);};},[]);
  useEffect(()=>{
    if(!frame.current||!host.current)return;
    if(props.phase==='reveal'){
      const rect=host.current.getBoundingClientRect();
      const tween=gsap.fromTo(frame.current,{position:'fixed',top:0,left:0,width:innerWidth,height:innerHeight,zIndex:35},{top:rect.top,left:rect.left,width:rect.width,height:rect.height,duration:1.25,ease:'power3.inOut'});return()=>{tween.kill();};
    }
    if(props.phase==='ready')gsap.set(frame.current,{clearProps:'all'});
  },[props.phase]);
  useEffect(()=>{const el=frame.current;if(!el)return;const lost=(e:Event)=>{e.preventDefault();setFailed(true);onFail();};el.addEventListener('webglcontextlost',lost,true);return()=>el.removeEventListener('webglcontextlost',lost,true);},[onFail]);
  return <div className="scene-host" ref={host} onPointerMove={e=>{if(props.reduced||!matchMedia('(pointer:fine)').matches)return;const r=e.currentTarget.getBoundingClientRect();pointer.current={x:(e.clientX-r.left)/r.width*2-1,y:(e.clientY-r.top)/r.height*2-1};e.currentTarget.style.setProperty('--px',`${e.clientX-r.left}px`);e.currentTarget.style.setProperty('--py',`${e.clientY-r.top}px`);}} onPointerLeave={()=>{pointer.current={x:0,y:0};}}>
    <div ref={frame} className={`scene-frame ${props.phase!=='ready'?'cinematic':''}`}>
      {failed?<StaticAssembly/>:<SceneBoundary onFail={props.onFail}><Suspense fallback={<div className="scene-loading"><StaticAssembly/><span>Loading the interactive instrument…</span></div>}><PowerAssembly {...props} pointer={pointer} active={!hidden&&(visible||props.phase!=='ready')}/></Suspense></SceneBoundary>}
    </div>
    <div className="instrument-label"><span>FIG. 01</span> ELECTRICAL ASSEMBLY <span>Cu / Al / Ceramic</span></div>
    <div className="pointer-detail" aria-hidden="true">+</div>
    <span className="scene-note">{props.thinking?'Processing scenario': 'Interactive study'} / not a physical meter</span>
  </div>;
}
