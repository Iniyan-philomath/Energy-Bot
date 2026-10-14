import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface EnergyCoreCanvasProps {
  className?: string;
  intensity?: number;
}

export const EnergyCoreCanvas: React.FC<EnergyCoreCanvasProps> = ({ 
  className = '',
  intensity = 1.0 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold everything
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 1. Central Core Sphere (Points)
    const sphereGeo = new THREE.IcosahedronGeometry(1.2, 4);
    const sphereMat = new THREE.PointsMaterial({
      color: 0x34d399, // Emerald
      size: 0.028,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const spherePoints = new THREE.Points(sphereGeo, sphereMat);
    coreGroup.add(spherePoints);

    // 2. Inner Glowing Core (Wireframe)
    const innerGeo = new THREE.IcosahedronGeometry(0.85, 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Warm Amber
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerMesh);

    // 3. Orbital Ring 1
    const ring1Geo = new THREE.TorusGeometry(1.7, 0.012, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.6,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    coreGroup.add(ring1);

    // 4. Orbital Ring 2 (Tilted)
    const ring2Geo = new THREE.TorusGeometry(1.95, 0.009, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.45,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    // 5. Swirling Particle Cloud
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorEmerald = new THREE.Color(0x34d399);
    const colorAmber = new THREE.Color(0xf59e0b);
    const colorWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.3 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const chosenColor = Math.random() > 0.6 ? colorEmerald : (Math.random() > 0.3 ? colorAmber : colorWhite);
      particleColors[i * 3] = chosenColor.r;
      particleColors[i * 3 + 1] = chosenColor.g;
      particleColors[i * 3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    coreGroup.add(particles);

    // Mouse Tracking
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 1.2;
      targetY = (y / rect.height) * 1.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime() * intensity;

      // Smooth mouse follow
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      coreGroup.rotation.y = elapsedTime * 0.3 + mouseX;
      coreGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.15 - mouseY * 0.6;

      // Pulse inner sphere
      const scale = 0.85 + Math.sin(elapsedTime * 2.2) * 0.04;
      innerMesh.scale.set(scale, scale, scale);

      // Rotate orbital rings
      ring1.rotation.z = elapsedTime * 0.4;
      ring2.rotation.z = -elapsedTime * 0.35;
      particles.rotation.y = -elapsedTime * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [intensity]);

  return (
    <div 
      ref={mountRef} 
      className={`relative w-full h-full min-h-[360px] pointer-events-none select-none flex items-center justify-center ${className}`}
    />
  );
};
