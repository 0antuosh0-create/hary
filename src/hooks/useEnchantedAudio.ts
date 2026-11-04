import { useCallback, useEffect, useRef, useState } from 'react';

export function useEnchantedAudio() {
  const [soundOn, setSoundOn] = useState(false);
  const context = useRef<AudioContext | null>(null);

  const tone = useCallback((frequency: number, delay = 0, volume = 0.045) => {
    const audio = context.current;
    if (!audio || audio.state !== 'running') return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const overtone = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    overtone.type = 'sine';
    overtone.frequency.value = frequency * 2.002;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.2);
    oscillator.connect(gain);
    overtone.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    overtone.start(start);
    oscillator.stop(start + 2.3);
    overtone.stop(start + 2.3);
    oscillator.onended = () => { oscillator.disconnect(); overtone.disconnect(); gain.disconnect(); };
  }, []);

  const toggleSound = useCallback(async () => {
    if (!('AudioContext' in window)) return false;
    try {
      if (!context.current) context.current = new AudioContext();
      if (!soundOn) await context.current.resume();
      setSoundOn(!soundOn);
      return true;
    } catch {
      return false;
    }
  }, [soundOn]);

  const chime = useCallback(() => {
    if (!soundOn) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => tone(frequency, index * 0.12, 0.035));
  }, [soundOn, tone]);

  useEffect(() => {
    if (!soundOn) {
      void context.current?.suspend();
      return;
    }
    // An original, sparse music-box melody, synthesized without an audio download.
    const melody = [523.25, 783.99, 622.25, 0, 698.46, 523.25, 392, 0, 466.16, 587.33, 783.99, 0, 698.46, 622.25, 523.25, 0];
    let step = 0;
    const play = () => {
      if (document.hidden) return;
      const note = melody[step++ % melody.length];
      if (note) tone(note);
    };
    play();
    const timer = window.setInterval(play, 920);
    const visibility = () => {
      if (document.hidden) void context.current?.suspend();
      else void context.current?.resume();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [soundOn, tone]);

  useEffect(() => () => { void context.current?.close(); }, []);

  return { soundOn, toggleSound, chime };
}