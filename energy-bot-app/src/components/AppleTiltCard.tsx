import React, { useRef, useState } from 'react';

interface AppleTiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngle?: number;
  glowColor?: string;
}

export const AppleTiltCard: React.FC<AppleTiltCardProps> = ({
  children,
  className = '',
  tiltMaxAngle = 7,
  glowColor = 'rgba(255, 255, 255, 0.08)'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');
  const [spotlightPos, setSpotlightPos] = useState({ x: -100, y: -100, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -tiltMaxAngle;
    const rotateY = ((x - centerX) / centerX) * tiltMaxAngle;

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`);
    setSpotlightPos({ x, y, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setSpotlightPos(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`relative rounded-3xl overflow-hidden apple-glass apple-card-hover ${className}`}
    >
      {/* Spotlight layer */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: spotlightPos.opacity,
          background: `radial-gradient(450px circle at ${spotlightPos.x}px ${spotlightPos.y}px, ${glowColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
};
