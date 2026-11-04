import { useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { cakeImg, cakeMeta, wandImg, wandMeta } from '../assets/art';

/** Engraved antique-brass plaque contents (screws + engraved label). Put it inside a button or a span. */
export function PlaqueFace({ children, screws = true }: { children: ReactNode; screws?: boolean }) {
  return (
    <>
      {screws && <i className="plaque-screw plaque-screw-l" aria-hidden="true" />}
      <span className="plaque-label">{children}</span>
      {screws && <i className="plaque-screw plaque-screw-r" aria-hidden="true" />}
    </>
  );
}

/** Hagrid's slightly lopsided cake (photograph) with a live flame that can be blown out. */
export function RealCake({ wished, onWish }: { wished: boolean; onWish: () => void }) {
  return (
    <div className={`real-cake ${wished ? 'is-out' : ''}`}>
      <span className="cake-floor-shadow" aria-hidden="true" />
      <img
        className="cake-photo"
        src={cakeImg}
        width={cakeMeta.width}
        height={cakeMeta.height}
        alt="A lopsided homemade pink cake with green icing that reads Happee Birthdae"
        draggable={false}
      />
      <span className="cake-candlelight" aria-hidden="true" style={{ left: `${cakeMeta.candleX * 100}%`, top: `${cakeMeta.candleY * 100}%` }} />
      <button
        className="cake-wick"
        style={{ left: `${cakeMeta.candleX * 100}%`, top: `${cakeMeta.candleY * 100}%` }}
        onClick={onWish}
        disabled={wished}
        aria-label="Blow out the birthday candle"
      >
        <span className="wick-thread" />
        {!wished ? (
          <span className="real-flame"><span className="flame-core" /></span>
        ) : (
          <span className="smoke" aria-hidden="true"><i /><i /><i /></span>
        )}
      </button>
    </div>
  );
}

/** A falling shower of gold leaf (pure CSS, deterministic pseudo-random layout). */
export function GoldLeaf({ count = 34 }: { count?: number }) {
  return (
    <div className="gold-leaf" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const random = (seed: number) => {
          const x = Math.sin(index * 127.1 + seed * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        const style = {
          left: `${random(1) * 100}%`,
          width: `${7 + random(2) * 9}px`,
          height: `${5 + random(3) * 8}px`,
          animationDelay: `${random(4) * 1.1}s`,
          animationDuration: `${2.8 + random(5) * 1.8}s`,
          '--sway': `${(random(6) - 0.5) * 120}px`,
          '--spin': `${(random(7) > 0.5 ? 1 : -1) * (360 + random(8) * 540)}deg`,
        } as CSSProperties;
        return <i key={index} className={`leaf-${index % 3}`} style={style} />;
      })}
    </div>
  );
}

type WandProps = {
  spellName: string;
  spellIndex: number;
  lit: boolean;
  reducedMotion: boolean;
  onCast: (x: number, y: number) => void;
};

/** A carved wand you flick to cast the current spell. */
export function WandSpell({ spellName, spellIndex, lit, reducedMotion, onCast }: WandProps) {
  const rig = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);

  const cast = () => {
    const tipBox = tip.current?.getBoundingClientRect();
    const fire = () => {
      const box = tip.current?.getBoundingClientRect() ?? tipBox;
      onCast(box ? box.x + box.width / 2 : window.innerWidth / 2, box ? box.y + box.height / 2 : window.innerHeight / 2);
    };
    if (reducedMotion || !rig.current?.animate) {
      fire();
      return;
    }
    rig.current.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-16deg)', offset: 0.32 },
        { transform: 'rotate(7deg)', offset: 0.58 },
        { transform: 'rotate(-2deg)', offset: 0.8 },
        { transform: 'rotate(0deg)' },
      ],
      { duration: 680, easing: 'cubic-bezier(.3,.7,.3,1)' },
    );
    tip.current?.animate(
      [{ opacity: 0.6, scale: 1 }, { opacity: 1, scale: 3.4, offset: 0.62 }, { opacity: 0.6, scale: 1 }],
      { duration: 900, easing: 'ease-out' },
    );
    window.setTimeout(fire, 390); // the sparks leave the tip at the end of the flick
  };

  return (
    <button className={`wand-spell ${lit ? 'is-lit' : ''}`} onClick={cast} aria-label={`Cast ${spellName}`}>
      <span className="incantation" key={spellName}>{spellName}!</span>
      <span className="wand-stage" aria-hidden="true">
        <span className="wand-float">
          <span className="wand-rig" ref={rig}>
            <img className="wand-photo" src={wandImg} width={wandMeta.width} height={wandMeta.height} alt="" draggable={false} />
            <span className="wand-tip" ref={tip} style={{ top: `${wandMeta.tipY * 100}%` }} />
          </span>
        </span>
      </span>
      <span className="wand-meta" aria-hidden="true">
        <span className="spell-dots">{[0, 1, 2].map(index => <i key={index} className={index === spellIndex ? 'on' : ''} />)}</span>
        Flick the wand · spell {spellIndex + 1} of 3
      </span>
    </button>
  );
}
