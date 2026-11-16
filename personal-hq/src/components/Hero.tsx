import { useEffect, useState } from 'react';
import { heroContent, resolveMode, type ModeOverride } from '../lib/identity';
import { exportAll } from '../lib/exportData';
import { useStore } from '../hooks/useStore';
import { useToast } from './Feedback';
import { HeroScene } from './HeroScene';
import { IconDownload } from './Icons';

interface Props {
  now: Date;
  override: ModeOverride;
  onOverride: (m: ModeOverride) => void;
}

/** Optional local artwork. Drop a file at public/hero.jpg and it replaces the built-in scene. */
const HERO_IMAGE = `${import.meta.env.BASE_URL}hero.jpg`;

function useHeroImage(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setOk(img.naturalWidth > 0);
    img.onerror = () => setOk(false);
    img.src = HERO_IMAGE;
  }, []);
  return ok;
}

export function Hero({ now, override, onOverride }: Props) {
  const { data, update } = useStore();
  const { notify } = useToast();
  const hasImage = useHeroImage();
  const mode = resolveMode(override, now);
  const content = heroContent(override, now);
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  const onExport = () => {
    const at = exportAll(data);
    update((d) => ({ ...d, settings: { ...d.settings, lastExportedAt: at } }));
    notify('Export downloaded. Keep it somewhere safe.');
  };

  return (
    <header className="hero" data-mode={mode}>
      {hasImage ? <img className="hero__image" src={HERO_IMAGE} alt="" /> : <HeroScene />}
      <div className="hero__shade" />

      <div className="hero__inner">
        <div className="hero__bar">
          <div className="brand">
            <span className="brand__mark" aria-hidden="true" />
            <span className="brand__name">Personal HQ</span>
          </div>
          <div className="hero__tools">
            <div className="segmented" role="group" aria-label="Time of day">
              {(['auto', 'morning', 'evening'] as const).map((m) => (
                <button key={m} type="button" className="segmented__btn" aria-pressed={override === m} onClick={() => onOverride(m)}>
                  {m === 'auto' ? 'Auto' : m === 'morning' ? 'Morning' : 'Evening'}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn--glass" onClick={onExport}>
              <IconDownload /> <span className="btn-label">Export data</span>
            </button>
          </div>
        </div>

        <div className="hero__identity">
          {content.kind === 'doctrine' ? (
            <>
              <p className="eyebrow">
                {mode === 'morning' ? 'Morning doctrine' : 'Tonight’s doctrine'} <span aria-hidden="true">·</span> {dateLabel}
              </p>
              <h1 className="doctrine__title">{content.doctrine.title}</h1>
              <p className="doctrine__body">“{content.doctrine.body}”</p>
            </>
          ) : (
            <>
              <p className="eyebrow">
                Evening question <span aria-hidden="true">·</span> {dateLabel}
              </p>
              <h1 className="challenge__question">{content.question}</h1>
              <p className="challenge__aside">
                No answer needed. Rest is a valid choice. It just deserves to be chosen.
                <span className="challenge__doctrine">
                  Today’s doctrine: <strong>{content.doctrine.title}</strong>
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
