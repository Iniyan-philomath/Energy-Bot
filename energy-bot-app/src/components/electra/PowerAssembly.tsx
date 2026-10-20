import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Line } from '@react-three/drei';
import { Group, MathUtils, PointLight } from 'three';
import type { IntroPhase } from './experience';
export interface AssemblyProps { theme: string; phase: IntroPhase; reduced: boolean; thinking: boolean; answer: number; active: boolean; progress: React.RefObject<number>; pointer: React.RefObject<{x: number; y: number}>; onReady: () => void }
function Assembly({ theme, phase, reduced, thinking, answer, progress, pointer }: AssemblyProps) {
  const group = useRef<Group>(null); const rotor = useRef<Group>(null); const flash = useRef<PointLight>(null);
  const response = useRef(0); const lastAnswer = useRef(answer);
  const dark = theme === 'dark';
  useFrame((state, delta) => {
    const dt = Math.min(delta, .05);
    if (lastAnswer.current !== answer) { response.current = 1; lastAnswer.current = answer; }
    response.current = Math.max(0, response.current - dt);
    if (group.current) {
      const travel = phase === 'ready' ? progress.current : 0;
      group.current.rotation.y = MathUtils.damp(group.current.rotation.y, -.35 + (reduced ? 0 : pointer.current.x * .15 + travel * .45), 4, dt);
      group.current.position.y = MathUtils.damp(group.current.position.y, reduced ? 0 : -travel * .18, 3, dt);
    }
    if (rotor.current && !reduced) rotor.current.rotation.y += dt * (thinking ? .65 : phase === 'energizing' ? 1.1 : .025) + response.current * dt * .35;
    if (flash.current) flash.current.intensity = MathUtils.damp(flash.current.intensity, phase === 'strike' ? 45 : 0, phase === 'strike' ? 35 : 8, dt);
    const z = phase === 'anticipation' ? 7.5 : phase === 'strike' ? 7.35 : phase === 'energizing' ? 7.8 : 9;
    state.camera.position.z = MathUtils.damp(state.camera.position.z, z, 3, dt);
    state.camera.position.x = MathUtils.damp(state.camera.position.x, reduced ? 5.4 : 5.4 + pointer.current.x * .3, 3, dt);
    state.camera.position.y = MathUtils.damp(state.camera.position.y, reduced ? 4.6 : 4.6 + pointer.current.y * .15, 3, dt);
    state.camera.lookAt(0, .1, 0);
  });
  const metal = { color: dark ? '#a5aaa8' : '#aeb3b1', metalness: .82, roughness: .29 };
  const ceramic = { color: dark ? '#d4cec0' : '#f1ebdd', metalness: .06, roughness: .24 };
  const copper = { color: '#a36946', metalness: .78, roughness: .3 };
  return <>
    <ambientLight intensity={dark ? .8 : 1.4} />
    <hemisphereLight args={['#f6ead6', '#555951', 2]} />
    <directionalLight position={[3, 7, 4]} intensity={dark ? 4 : 3} color="#fff4e1" />
    <directionalLight position={[-4, 2, -4]} intensity={3} color="#c5d2db" />
    <pointLight ref={flash} position={[0, 3.2, 0]} color="#ffffff" intensity={0} decay={2} />
    <group ref={group}>
      <mesh position={[0, -1.6, 0]}><cylinderGeometry args={[1.9, 2, .24, 64]} /><meshStandardMaterial {...metal} /></mesh>
      <mesh position={[0, -1.43, 0]}><cylinderGeometry args={[1.65, 1.65, .14, 64]} /><meshStandardMaterial color="#333733" roughness={.6} metalness={.5} /></mesh>
      <mesh position={[0, -.05, 0]}><cylinderGeometry args={[.38, .45, 2.7, 48]} /><meshStandardMaterial {...ceramic} /></mesh>
      {Array.from({length: 9}, (_, i) => <mesh key={i} position={[0, -1.12 + i * .25, 0]}><cylinderGeometry args={[.65, .4, .12, 48]} /><meshStandardMaterial {...ceramic} /></mesh>)}
      <mesh position={[0, 1.38, 0]}><cylinderGeometry args={[.27, .37, .55, 48]} /><meshStandardMaterial {...metal} /></mesh>
      <mesh position={[0, 1.68, 0]}><sphereGeometry args={[.28, 24, 16]} /><meshStandardMaterial {...metal} /></mesh>
      <group ref={rotor}>
        {[-.88, .94].map(y => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[1.14, .095, 12, 80]} /><meshStandardMaterial {...metal} /></mesh>)}
        {[0, 1, 2, 3].map(i => {const a = i * Math.PI / 2; return <group key={i} position={[Math.cos(a)*1.14, 0, Math.sin(a)*1.14]}>
          <mesh><cylinderGeometry args={[.055, .055, 2.1, 12]} /><meshStandardMaterial {...metal} /></mesh>
          <mesh position={[0, -.94, 0]}><cylinderGeometry args={[.13,.13,.18,6]} /><meshStandardMaterial {...copper} /></mesh>
          <mesh position={[0, .98, 0]}><cylinderGeometry args={[.11,.11,.16,6]} /><meshStandardMaterial {...metal} /></mesh>
        </group>; })}
        {Array.from({length: 16}, (_, i) => <mesh key={i} position={[0, -.65 + i * .082, 0]} rotation={[Math.PI/2, 0, 0]}><torusGeometry args={[.83, .032, 8, 64]} /><meshStandardMaterial {...copper} /></mesh>)}
      </group>
      {[-1,1].map(side => <group key={side}>
        <mesh position={[side*1.36, -1.15, .58]}><boxGeometry args={[.18,.55,.22]} /><meshStandardMaterial {...copper} /></mesh>
        <mesh position={[side*1.12, -.9, .58]}><boxGeometry args={[.65,.1,.22]} /><meshStandardMaterial {...copper} /></mesh>
      </group>)}
      {Array.from({length: 24}, (_, i) => { const a = i / 24 * Math.PI * 2; return <mesh key={i} position={[Math.cos(a)*1.8,-1.472,Math.sin(a)*1.8]} rotation={[0,-a,0]}><boxGeometry args={[i%3===0?.11:.05,.008,.018]} /><meshStandardMaterial color="#424640" /></mesh>; })}
    </group>
    {phase === 'strike' && !reduced && <group>
      <Line points={[[.4,5,0],[-.2,4,0],[.25,3.5,0],[-.15,2.7,0],[0,1.95,0]]} color="white" lineWidth={3} />
      <Line points={[[-.2,4,0],[-.8,3.7,.05],[-1.1,3.1,.08]]} color="#ebe9e2" lineWidth={1} />
    </group>}
    <ContactShadows position={[0,-1.75,0]} opacity={dark ? .65 : .35} scale={12} blur={2.8} far={4} resolution={256} frames={1} color="#171813" />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.77,0]}><circleGeometry args={[15,64]} /><meshStandardMaterial color={dark ? '#242622' : '#e5e3db'} roughness={.95} /></mesh>
  </>;
}
export default function PowerAssembly(props: AssemblyProps) {
  return <Canvas dpr={matchMedia('(max-width:600px)').matches ? 1 : [1, 1.5]} camera={{ position: [5.4,4.6,9], fov: 36 }} frameloop={props.active ? 'always' : 'never'} gl={{antialias: true, powerPreference:'low-power'}} onCreated={({gl}) => { props.onReady(); gl.domElement.setAttribute('aria-label', 'Interactive ceramic, copper and silver electrical assembly'); gl.domElement.setAttribute('role', 'img'); }}>
    <Assembly {...props} />
  </Canvas>;
}
