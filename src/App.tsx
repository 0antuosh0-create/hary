import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, Feather, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { copy } from './content';
import { brassTex, heroBg } from './assets/art';
import { WandSpell } from './components/Craft';
import { Crest, Snitch } from './components/MagicalArtwork';
import { LetterEnvelope } from './components/LetterEnvelope';
import { Newspaper } from './components/Newspaper';
import { MagicDialog } from './components/MagicDialog';
import { useEnchantedAudio } from './hooks/useEnchantedAudio';
import { useMagic } from './hooks/useMagic';

const candlePositions = [
  { left: '9%', top: '29%', height: 53, delay: -2, scale: 0.85 },
  { left: '22%', top: '18%', height: 39, delay: -5, scale: 0.7 },
  { left: '5%', top: '58%', height: 44, delay: -1, scale: 0.62 },
  { left: '78%', top: '22%', height: 57, delay: -3, scale: 0.85 },
  { left: '92%', top: '38%', height: 63, delay: -6, scale: 1 },
  { left: '84%', top: '65%', height: 38, delay: -4, scale: 0.62 },
];

const portraitQuotes = [
  '"I solemnly swear... I ate the cake."',
  '"The Sorting Hat said: definitely a menace."',
  '"It\'s not a side-eye. It\'s advanced Legilimency."',
  '"A birthday without snacks? Straight to Azkaban."',
];

function App() {
  const reducedMotion = useReducedMotion() ?? false;
  const { canvasRef, burst } = useMagic(reducedMotion);
  const { soundOn, toggleSound, chime } = useEnchantedAudio();
  const [modal, setModal] = useState<'letter' | 'cake' | null>(null);
  const [wished, setWished] = useState(false);
  const [luminous, setLuminous] = useState(false);
  const [disguised, setDisguised] = useState(false);
  const [spellIndex, setSpellIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(-1);
  const [snuffedCandles, setSnuffedCandles] = useState<number[]>([]);
  const [toast, setToast] = useState('');
  const [snitchCaught, setSnitchCaught] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const openLetter = () => {
    chime();
    burst();
    setModal('letter');
  };

  const makeWish = () => {
    if (wished) return;
    setWished(true);
    burst(undefined, undefined, true);
    chime();
  };

  const castSpell = (x: number, y: number) => {
    chime();
    burst(x, y, true);
    if (spellIndex === 0) {
      setLuminous(!luminous);
      setSnuffedCandles([]);
      notify(luminous ? 'Nox. A little moonlight is all we need.' : 'Lumos! A bright year ahead looks good on you.');
    } else if (spellIndex === 1) {
      setDisguised(!disguised);
      setQuoteIndex(1);
      notify(disguised ? 'Riddikulus! The disguise has vanished. The attitude remains.' : 'Riddikulus! A perfectly respectable wizard. Obviously.');
    } else {
      setModal('cake');
    }
    setSpellIndex((spellIndex + 1) % 3);
  };

  const spellName = [luminous ? 'Nox' : 'Lumos', 'Riddikulus', 'Accio cake'][spellIndex];
  const spellHint = ['A little light goes a long way.', 'The Ministry recommends a disguise.', 'This is a very important summoning.'][spellIndex];

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: reducedMotion ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className={`birthday-world ${luminous ? 'is-luminous' : ''}`} style={{ '--brass': `url(${brassTex})` } as CSSProperties}>
        <a className="skip-link" href="#birthday">Skip to the birthday magic</a>
        <canvas ref={canvasRef} className="magic-canvas" aria-hidden="true" />

        <main>
          <section className="hero" id="home" aria-labelledby="birthday">
            <div className="hero-scenery" style={{ backgroundImage: `url(${heroBg})` }} aria-hidden="true" />
            <div className="hero-shade" aria-hidden="true" />
            <div className="lumos-light" aria-hidden="true" />

            <header className="site-header">
              <a className="wordmark" href="#home" aria-label="Hogwarts Birthday Owl Post, back to top">
                <Crest className="header-crest" />
                <span><span className="wordmark-name">Hogwarts</span><span className="wordmark-detail">BIRTHDAY OWL POST</span></span>
              </a>
              <nav className="header-nav" aria-label="Main navigation">
                <button onClick={openLetter}>Your letter</button>
                <a href="#mischief">A little mischief <span className="nav-star" aria-hidden="true">+</span></a>
              </nav>
              <button
                className={`sound-toggle ${soundOn ? 'sound-is-on' : ''}`}
                onClick={async () => { if (!(await toggleSound())) notify('This browser cannot play our music-box magic. The rest is all yours.'); }}
                aria-pressed={soundOn}
                aria-label={soundOn ? 'Turn enchanted sound off' : 'Turn enchanted sound on'}
                title={soundOn ? 'Turn sound off' : 'Turn sound on'}
              >
                {soundOn ? <Volume2 size={15} strokeWidth={1.5} /> : <VolumeX size={15} strokeWidth={1.5} />}
                <span>Sound {soundOn ? 'on' : 'off'}</span>
              </button>
            </header>

            <div className="floating-candles">
              {candlePositions.map((candle, index) => (
                <button
                  key={index}
                  className={`floating-candle candle-${index} ${snuffedCandles.includes(index) ? 'is-snuffed' : ''}`}
                  style={{ left: candle.left, top: candle.top, '--candle-height': `${candle.height}px`, '--float-delay': `${candle.delay}s`, '--candle-scale': candle.scale } as CSSProperties}
                  aria-label={`${snuffedCandles.includes(index) ? 'Relight' : 'Blow out'} floating candle ${index + 1}`}
                  onClick={event => {
                    const wasSnuffed = snuffedCandles.includes(index);
                    setSnuffedCandles(previous => wasSnuffed ? previous.filter(item => item !== index) : [...previous, index]);
                    const rect = event.currentTarget.getBoundingClientRect();
                    burst(rect.x + rect.width / 2, rect.y);
                    chime();
                  }}
                >
                  <span className="candle-halo" />
                  <span className="candle-flame" />
                  <span className="candle-wick" />
                  <span className="candle-wax"><span /></span>
                </button>
              ))}
            </div>

            <div className="hero-content">
              <motion.div className="hero-eyebrow" {...reveal(0.1)}>
                <span className="eyebrow-rule" /><Sparkles size={14} strokeWidth={1} /><span>A MOST MAGICAL BIRTHDAY</span><span className="eyebrow-rule" />
              </motion.div>
              <motion.h1 id="birthday" className="persian" lang="fa" dir="rtl" tabIndex={-1} aria-label={copy.greeting} {...reveal(0.25)}>
                <span className="birthday-name">{copy.name}</span>{' '}
                <span className="birthday-phrase">{copy.birthday}{' '}<span className="birthday-wand">{'\u{1FA84}'}</span></span>
              </motion.h1>
              <motion.p className="hero-subtitle persian" lang="fa" dir="rtl" {...reveal(0.4)}>{copy.heroLine}</motion.p>
              <motion.p className="hero-english" {...reveal(0.48)}>Some people are simply born a little more magical.</motion.p>

              <motion.div className="letter-invitation" {...reveal(0.65)}>
                <LetterEnvelope
                  reducedMotion={reducedMotion}
                  onCrack={(x, y) => { chime(); burst(x, y, true); }}
                  onOpen={() => setModal('letter')}
                />
                <p className="letter-invitation-note">An owl came a long way for this.</p>
              </motion.div>
            </div>

            <motion.a className="scroll-cue" href="#mischief" {...reveal(1.1)}>
              <span>A LITTLE MISCHIEF AWAITS</span><ChevronDown size={16} strokeWidth={1} />
            </motion.a>
          </section>

          <section className="mischief-section" id="mischief" aria-labelledby="mischief-title">
            <div className="section-ornament">
              <span />
              <button
                className={`snitch-button ${snitchCaught ? 'snitch-caught' : ''}`}
                aria-label={snitchCaught ? 'Release the golden snitch' : 'Catch the golden snitch'}
                title={snitchCaught ? 'A little more mischief?' : 'Catch me if you can'}
                onClick={event => {
                  setSnitchCaught(!snitchCaught);
                  const rect = event.currentTarget.getBoundingClientRect();
                  burst(rect.x + rect.width / 2, rect.y + rect.height / 2, true);
                  chime();
                  notify(snitchCaught ? 'And the Snitch is off! Some magic cannot be kept.' : 'Caught it! 150 points to the birthday legend.');
                }}
              ><Snitch /></button>
              <span />
            </div>

            <div className="mischief-layout">
              <motion.div className="newspaper-area" initial={{ opacity: 0, y: reducedMotion ? 0 : 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.8 }}>
                <Newspaper
                  disguised={disguised}
                  reducedMotion={reducedMotion}
                  onTalk={(x, y) => {
                    setQuoteIndex((quoteIndex + 1) % portraitQuotes.length);
                    burst(x, y);
                    chime();
                  }}
                />
                <p className={`portrait-remark ${quoteIndex >= 0 ? 'has-quote' : ''}`} aria-live="polite">{quoteIndex < 0 ? <><span className="tap-star" aria-hidden="true">+</span> Psst. Tap the portrait. It talks back.</> : portraitQuotes[quoteIndex]}</p>
              </motion.div>

              <motion.div className="mischief-copy" initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, delay: 0.1 }}>
                <p className="eyebrow"><Feather size={15} strokeWidth={1} /> THE WIZARDING WORLD IS TALKING</p>
                <h2 id="mischief-title">A little older.<br />A lot more <em>magical.</em></h2>
                <p className="mischief-description">Hogwarts has a new legend. The Ministry has a few questions. And that face? Definitely up to something.</p>
                <div className="spell-area">
                  <p className="spell-intro">Shall we make a little mischief?</p>
                  <WandSpell spellName={spellName} spellIndex={spellIndex} lit={luminous} reducedMotion={reducedMotion} onCast={castSpell} />
                  <p className="spell-hint" aria-live="polite">{spellHint}</p>
                </div>
                <p className="wand-disclaimer">NO WAND REQUIRED. JUST A LITTLE CURIOSITY.</p>
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <a className="footer-mark" href="#home" aria-label="Back to the birthday greeting"><Crest /></a>
          <p>Made with a little magic <span>&</span> a lot of love.</p>
          <button onClick={() => { burst(undefined, undefined, true); chime(); notify('Mischief managed. Birthday magic? That stays with you.'); }}>Mischief managed. <Sparkles size={12} strokeWidth={1} /></button>
        </footer>

        <div className="toast-region" role="status" aria-live="polite">
          <AnimatePresence>{toast && <motion.div className="magic-toast" key="magic-toast" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}><Sparkles size={17} strokeWidth={1.3} /><span>{toast}</span></motion.div>}</AnimatePresence>
        </div>

        {modal && <MagicDialog kind={modal} wished={wished} onClose={() => setModal(null)} onCake={() => { chime(); setModal('cake'); }} onWish={makeWish} onReset={() => setWished(false)} />}
      </div>
    </MotionConfig>
  );
}

export default App;
