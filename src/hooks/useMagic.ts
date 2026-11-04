import { useCallback, useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  confetti: boolean;
  angle: number;
};

export function useMagic(reducedMotion: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);

  const burst = useCallback((x?: number, y?: number, celebration = false) => {
    if (reducedMotion) return;
    const colors = celebration
      ? ['#f3d27a', '#e2b65a', '#fff0c2', '#c99a3e', '#ffe7a3']
      : ['#e7c882', '#d0a35a', '#fff1ca'];
    const count = celebration ? 95 : 28;
    const centerX = x ?? window.innerWidth / 2;
    const centerY = y ?? window.innerHeight * 0.42;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (celebration ? 2.4 : 1.1) + Math.random() * 4;
      const life = celebration ? 130 + Math.random() * 90 : 35 + Math.random() * 35;
      particles.current.push({
        x: centerX, y: centerY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - (celebration ? 3.5 : 0),
        size: celebration ? 3 + Math.random() * 4 : 1 + Math.random() * 2,
        life, maxLife: life,
        color: colors[i % colors.length],
        confetti: celebration, angle,
      });
    }
    particles.current = particles.current.slice(-220);
  }, [reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || reducedMotion) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let frame = 0;
    let lastTime = 0;
    let lastTrail = 0;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const stars = Array.from({ length: width < 600 ? 17 : 33 }, () => ({
      x: Math.random(), y: Math.random(), radius: Math.random() * 1.1 + 0.35,
      phase: Math.random() * Math.PI * 2, speed: 0.25 + Math.random() * 0.75,
    }));

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const pointer = (event: PointerEvent) => {
      if (!finePointer || event.pointerType === 'touch' || performance.now() - lastTrail < 42) return;
      lastTrail = performance.now();
      particles.current.push({
        x: event.clientX, y: event.clientY, vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3, size: Math.random() + 0.5, life: 28, maxLife: 28,
        color: '#e7c882', confetti: false, angle: 0,
      });
    };
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden || time - lastTime < 32) return;
      const delta = Math.min((time - lastTime) / 16.67, 3);
      lastTime = time;
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        ctx.globalAlpha = 0.12 + (Math.sin(time * 0.00065 + star.phase) + 1) * 0.19;
        ctx.fillStyle = '#ebd39c';
        ctx.beginPath();
        ctx.arc((star.x * width + Math.sin(time * 0.00012 + star.phase) * 12),
          (star.y * height - time * 0.003 * star.speed) % height + (star.y * height - time * 0.003 * star.speed < 0 ? height : 0), star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      particles.current = particles.current.filter(particle => particle.life > 0);
      for (const particle of particles.current) {
        particle.life -= delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        if (particle.confetti) particle.vy += 0.045 * delta;
        ctx.globalAlpha = Math.max(0, Math.min(1, particle.life / particle.maxLife * 1.8));
        ctx.fillStyle = particle.color;
        if (particle.confetti) {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.angle + time * 0.001);
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.45);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', pointer, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
      ctx.clearRect(0, 0, width, height);
    };
  }, [reducedMotion]);

  return { canvasRef, burst };
}