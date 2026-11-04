import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, RotateCcw, Sparkles, X } from 'lucide-react';
import { copy } from '../content';
import { parchmentTex, sealImg } from '../assets/art';
import { Crest } from './MagicalArtwork';
import { GoldLeaf, PlaqueFace, RealCake } from './Craft';

type MagicDialogProps = {
  kind: 'letter' | 'cake';
  wished: boolean;
  onClose: () => void;
  onCake: () => void;
  onWish: () => void;
  onReset: () => void;
};

export function MagicDialog({ kind, wished, onClose, onCake, onWish, onReset }: MagicDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const firstKind = useRef(kind);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const activeElement = document.activeElement as HTMLElement | null;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      activeElement?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="magic-dialog"
      style={{ '--parchment': `url(${parchmentTex})` } as CSSProperties}
      aria-labelledby="dialog-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <motion.div
        className={`modal-paper paper-texture ${kind === 'cake' ? 'cake-paper' : ''}`}
        style={{ transformPerspective: 1100, transformOrigin: '50% 0%' }}
        /* The letter unfolds out of the envelope; the cake simply drifts in. */
        initial={firstKind.current === 'letter'
          ? { opacity: 0, y: 46, rotateX: -62, scale: 0.96 }
          : { opacity: 0, y: 30, rotate: -2, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, rotate: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: firstKind.current === 'letter' ? 0.8 : 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <button className="close-dialog" onClick={onClose} aria-label="Close the magical surprise" autoFocus><X size={20} /></button>
        <AnimatePresence mode="wait" initial={false}>
          {kind === 'letter' ? (
            <motion.div key="letter" className="letter-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Crest className="letter-crest" />
              <p className="letter-letterhead">HOGWARTS</p>
              <p className="letter-department">Department of Very Important Birthdays</p>
              <div className="letter-rule"><span /></div>
              <div className="persian letter-body" lang="fa" dir="rtl">
                <h2 id="dialog-title" className="letter-dear">{copy.dear}</h2>
                <p>{copy.letterBody}</p>
                <p>{copy.letterWish}</p>
                <p className="letter-last-line">{copy.letterEnd}</p>
                <div className="letter-signoff">
                  <p className="letter-signature">{copy.letterSign}</p>
                  <img className="letter-seal" src={sealImg} alt="" width={78} height={78} draggable={false} />
                </div>
              </div>
              <button className="brass-plaque brass-sm" onClick={onCake}><PlaqueFace screws={false}>One more little surprise <ArrowRight size={15} strokeWidth={2} /></PlaqueFace></button>
              <p className="letter-postscript">P.S. The cat has been put in charge of the cake. Sorry.</p>
            </motion.div>
          ) : (
            <motion.div key="cake" className="cake-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {wished && <GoldLeaf />}
              <Sparkles className="cake-top-star" size={25} strokeWidth={1} />
              <p className="eyebrow">A LITTLE BIRTHDAY WISHCRAFT</p>
              <div aria-live="polite">
                <h2 id="dialog-title">{wished ? 'Wish, officially delivered.' : <>Hagrid made you<br />something.</>}</h2>
                <p className="cake-subtitle">{wished ? 'The stars will take it from here.' : 'It survived the journey. Mostly.'}</p>
              </div>
              <RealCake wished={wished} onWish={onWish} />
              <p className="persian cake-persian" lang="fa" dir="rtl">{wished ? copy.wishDone : copy.cakeWish}</p>
              {!wished ? (
                <button className="brass-plaque brass-sm" onClick={onWish}><PlaqueFace screws={false}>Make a wish & blow <Sparkles size={15} strokeWidth={1.8} /></PlaqueFace></button>
              ) : (
                <button className="brass-plaque brass-sm" onClick={onClose}><PlaqueFace screws={false}>Keep the magic <ArrowRight size={15} strokeWidth={2} /></PlaqueFace></button>
              )}
              {wished ? <button className="wish-again" onClick={onReset}><RotateCcw size={12} /> One more wish? We won't tell.</button> : <p className="cake-hint">Or tap the candle. No actual blowing required.</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </dialog>
  );
}
