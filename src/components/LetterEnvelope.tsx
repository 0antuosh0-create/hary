import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { Mail } from 'lucide-react';
import { envelopeImg, envelopeMeta } from '../assets/art';
import { PlaqueFace } from './Craft';

type Props = {
  reducedMotion: boolean;
  /** Fired the instant the wax seal cracks (x/y are viewport coordinates of the seal). */
  onCrack: (x: number, y: number) => void;
  /** Fired once the cracking animation has finished and the letter should open. */
  onOpen: () => void;
};

export function LetterEnvelope({ reducedMotion, onCrack, onOpen }: Props) {
  const tilt = useRef<HTMLSpanElement>(null);
  const seal = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const follow = (event: PointerEvent<HTMLButtonElement>) => {
    const element = tilt.current;
    if (!element || event.pointerType === 'touch' || reducedMotion) return;
    const box = element.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    element.style.setProperty('--ry', `${(x * 16).toFixed(2)}deg`);
    element.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
  };

  const rest = () => {
    tilt.current?.style.setProperty('--ry', '0deg');
    tilt.current?.style.setProperty('--rx', '0deg');
  };

  const open = () => {
    if (opening) return;
    const box = seal.current?.getBoundingClientRect();
    onCrack(box ? box.x + box.width / 2 : window.innerWidth / 2, box ? box.y + box.height / 2 : window.innerHeight / 2);
    if (reducedMotion) {
      onOpen();
      return;
    }
    setOpening(true);
    timer.current = setTimeout(() => {
      setOpening(false);
      onOpen();
    }, 650);
  };

  const sealStyle: CSSProperties = {
    left: `${envelopeMeta.sealX * 100}%`,
    top: `${envelopeMeta.sealY * 100}%`,
    width: `${envelopeMeta.sealR * 2 * 190}%`,
  };

  return (
    <button
      className={`open-letter ${opening ? 'is-opening' : ''}`}
      onClick={open}
      onPointerMove={follow}
      onPointerLeave={rest}
      aria-label="Open your birthday letter"
    >
      <span className="envelope-float" aria-hidden="true">
        <span className="envelope-tilt" ref={tilt}>
          <img
            className="envelope-photo"
            src={envelopeImg}
            width={envelopeMeta.width}
            height={envelopeMeta.height}
            alt=""
            draggable={false}
          />
          <span className="envelope-sheen" style={{ WebkitMaskImage: `url(${envelopeImg})`, maskImage: `url(${envelopeImg})` }} />
          <span className="envelope-ink"><span>For you.</span><span>Always.</span></span>
          <span className="seal-glow" ref={seal} style={sealStyle} />
        </span>
        <span className="envelope-spark envelope-spark-one" />
        <span className="envelope-spark envelope-spark-two" />
      </span>
      <span className="brass-plaque">
        <PlaqueFace><Mail size={16} strokeWidth={1.8} />Open your letter</PlaqueFace>
      </span>
    </button>
  );
}
