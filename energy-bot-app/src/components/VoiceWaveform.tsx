import React, { useEffect, useRef } from 'react';

interface VoiceWaveformProps {
  isActive?: boolean;
  className?: string;
  color?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isActive = false,
  className = '',
  color = '#34d399'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      phase += isActive ? 0.08 : 0.02;
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw 3 layered waves for Apple Intelligence fluid effect
      const waves = [
        { amplitude: isActive ? 22 : 6, wavelength: 0.025, speed: phase, alpha: 0.85, stroke: color },
        { amplitude: isActive ? 16 : 4, wavelength: 0.035, speed: -phase * 1.2, alpha: 0.5, stroke: '#fbbf24' },
        { amplitude: isActive ? 28 : 8, wavelength: 0.018, speed: phase * 0.7, alpha: 0.4, stroke: '#ffffff' },
      ];

      waves.forEach(w => {
        ctx.beginPath();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = w.stroke;
        ctx.globalAlpha = w.alpha;

        for (let x = 0; x < width; x++) {
          // Windowing function to taper edges at start and end
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * w.wavelength + w.speed) * w.amplitude * envelope;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={70}
      className={`w-full max-w-[280px] h-[60px] pointer-events-none select-none ${className}`}
    />
  );
};
