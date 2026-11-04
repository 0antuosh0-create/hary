import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { copy } from '../content';
import { catStill, catVideo, newsprintTex } from '../assets/art';
import { WizardHat } from './MagicalArtwork';

type Props = {
  disguised: boolean;
  reducedMotion: boolean;
  onTalk: (x: number, y: number) => void;
};

export function Newspaper({ disguised, reducedMotion, onTalk }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(media.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // The moving photo is embedded in the page. Turn it into a blob URL on demand (best compatibility
  // with Safari) and only play it while the newspaper is on screen.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;
    let objectUrl = '';
    let cancelled = false;
    let loading: Promise<void> | null = null;

    const load = () => {
      if (!loading) {
        loading = fetch(catVideo)
          .then(response => response.blob())
          .then(blob => {
            if (cancelled) return;
            objectUrl = URL.createObjectURL(blob);
            video.src = objectUrl;
          })
          .catch(() => undefined); // the still photograph simply stays in place
      }
      return loading;
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void load().then(() => video.play().catch(() => undefined));
      else video.pause();
    }, { threshold: 0.1 });
    observer.observe(video);

    return () => {
      cancelled = true;
      observer.disconnect();
      video.pause();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reducedMotion]);

  return (
    <>
      <svg className="np-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="np-torn" x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045 0.06" numOctaves="4" seed="11" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <motion.button
        className="newspaper"
        initial={false}
        animate={{ rotate: isMobile ? -1.5 : -4 }}
        whileHover={isMobile ? undefined : { rotate: -1, y: -5 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        onClick={event => {
          const rect = event.currentTarget.getBoundingClientRect();
          onTalk(rect.x + rect.width / 2, rect.y + rect.height / 2);
        }}
        aria-label="Question the suspicious birthday wizard in the moving portrait"
      >
        <span className="np-sheet" style={{ backgroundImage: `url(${newsprintTex})` }} aria-hidden="true" />
        <span className="np-light" aria-hidden="true" />

        <span className="np-body">
          <span className="np-strip"><span>Vol. CCXXXI · No. 394</span><span>Price: One Knut</span></span>
          <span className="np-masthead">The Daily Purrphet</span>
          <span className="np-edition">★ &nbsp;Special Birthday Edition&nbsp; ★</span>
          <span className="np-headline">WANTED!</span>
          <span className="np-deck">Ministry baffled as notorious wizard turns a year older</span>

          <span className={`np-photo ${disguised ? 'portrait-disguised' : ''}`}>
            <img
              src={catStill}
              alt="The gloriously unimpressed orange birthday cat, now a wanted wizard"
              width="498"
              height="389"
            />
            {!reducedMotion && (
              <video
                ref={videoRef}
                muted
                loop
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                controlsList="nodownload noremoteplayback nofullscreen"
                preload="none"
                aria-hidden="true"
              />
            )}
            <span className="np-vignette" />
            <AnimatePresence>
              {disguised && (
                <motion.span
                  className="wizard-disguise"
                  initial={{ opacity: 0, y: -40, rotate: -14 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                >
                  <WizardHat />
                  <span className="wizard-glasses"><i /><i /></span>
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className="np-caption">
            Exhibit A: the suspect, moments before demanding cake. <em>Do not make eye contact.</em>
          </span>

          <span className="np-columns" lang="en">
            HOGSMEADE — The Ministry of Magic confirmed this morning that a notorious wizard, known for an
            unimpressed stare and an unreasonable appetite for snacks, is now one year older. Witnesses report the
            suspect remained completely unbothered. “Not my first birthday,” the suspect allegedly muttered,
            side-eyeing a cake. Authorities advise bringing candles, kind words and extra cake. Under no
            circumstances should anyone ask for a smile.
          </span>

          <span className="np-notice">
            <span className="np-notice-label">★ Public Notice ★</span>
            <span className="np-notice-fa" lang="fa" dir="rtl">{copy.name} {copy.birthday}</span>
          </span>
          <span className="np-foot"><span>Continued on page 12</span><span>Approach with cake</span></span>
        </span>
      </motion.button>
    </>
  );
}
