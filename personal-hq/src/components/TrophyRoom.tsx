import { useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { formatDate, isValidUrlOrEmpty, localDateKey, normaliseUrl, uid } from '../lib/util';
import { ImageError, resizeImage } from '../storage/images';
import { useConfirm, useToast } from './Feedback';
import { Modal } from './Modal';
import { ExtLink } from './ExtLink';
import { IconEdit, IconImage, IconPlus, IconTrophy } from './Icons';
import type { Trophy } from '../types';

export function TrophyRoom() {
  const { data, update } = useStore();
  const confirm = useConfirm();
  const { notify } = useToast();
  const [editing, setEditing] = useState<Trophy | 'new' | null>(null);

  const sorted = [...data.trophies].sort((a, b) => b.date.localeCompare(a.date));

  const save = (t: Trophy) => {
    update((d) => {
      const exists = d.trophies.some((x) => x.id === t.id);
      return { ...d, trophies: exists ? d.trophies.map((x) => (x.id === t.id ? t : x)) : [t, ...d.trophies] };
    });
    setEditing(null);
  };

  const remove = async (t: Trophy) => {
    const ok = await confirm({
      title: 'Remove trophy?',
      message: <p>“{t.title}” and its image will be removed from this browser. Export first if you want to keep a copy.</p>,
      confirmLabel: 'Remove',
      danger: true,
    });
    if (!ok) return;
    update((d) => ({ ...d, trophies: d.trophies.filter((x) => x.id !== t.id) }));
    setEditing(null);
    notify('Trophy removed.');
  };

  return (
    <section className="card" aria-labelledby="trophy-h">
      <div className="card__head">
        <p className="eyebrow eyebrow--coral">Things you finished</p>
        <h2 id="trophy-h" className="card__title">
          Trophy room
        </h2>
        <button type="button" className="btn btn--outline btn--small card__head-action" onClick={() => setEditing('new')}>
          <IconPlus /> Add trophy
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-note empty-note--big">
          <IconTrophy />
          <p>Nothing here yet. When you finish something real, however small, put it here.</p>
        </div>
      ) : (
        <ul className="trophy-grid">
          {sorted.map((t) => (
            <li key={t.id} className="trophy">
              <div className={`trophy__media ${t.image ? '' : 'trophy__media--empty'}`}>
                {t.image ? <img src={t.image} alt={`Image for ${t.title}`} loading="lazy" /> : <IconTrophy />}
              </div>
              <div className="trophy__body">
                <h3 className="trophy__title">{t.title}</h3>
                <time className="trophy__date" dateTime={t.date}>
                  {t.date ? formatDate(t.date) : 'No date'}
                </time>
                {t.description && <p className="trophy__desc">{t.description}</p>}
                <div className="trophy__actions">
                  {t.link && (
                    <ExtLink href={t.link} className="link-chip">
                      View the work
                    </ExtLink>
                  )}
                  <button type="button" className="icon-btn" aria-label={`Edit ${t.title}`} onClick={() => setEditing(t)}>
                    <IconEdit />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add trophy' : 'Edit trophy'}>
        {editing && (
          <TrophyForm
            trophy={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSave={save}
            onDelete={editing === 'new' ? undefined : () => remove(editing)}
          />
        )}
      </Modal>
    </section>
  );
}

function TrophyForm({
  trophy,
  onSave,
  onCancel,
  onDelete,
}: {
  trophy: Trophy | null;
  onSave: (t: Trophy) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(trophy?.title ?? '');
  const [date, setDate] = useState(trophy?.date ?? localDateKey());
  const [description, setDescription] = useState(trophy?.description ?? '');
  const [link, setLink] = useState(trophy?.link ?? '');
  const [image, setImage] = useState<string | null>(trophy?.image ?? null);
  const [imageError, setImageError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const linkOk = isValidUrlOrEmpty(link);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setImageError('');
    setBusy(true);
    try {
      setImage(await resizeImage(file));
    } catch (e) {
      setImageError(e instanceof ImageError ? e.message : 'That image could not be processed.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !linkOk || busy) return;
        onSave({ id: trophy?.id ?? uid(), title: title.trim(), date, description: description.trim(), image, link: normaliseUrl(link) });
      }}
    >
      <label className="field">
        <span className="field__label">Title</span>
        <input className="input" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span className="field__label">Date</span>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Short description (optional)</span>
        <textarea className="input" rows={3} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Link to the finished work (optional)</span>
        <input className="input" inputMode="url" value={link} maxLength={2000} onChange={(e) => setLink(e.target.value)} placeholder="https://…" aria-invalid={!linkOk} />
        {!linkOk && <span className="field__error">Please enter a valid http or https link.</span>}
      </label>

      <div className="field">
        <span className="field__label">Image (optional)</span>
        <div className="image-field">
          {image ? <img src={image} alt="Trophy preview" className="image-field__preview" /> : <div className="image-field__preview image-field__preview--empty"><IconImage /></div>}
          <div className="image-field__controls">
            <input ref={fileRef} id="trophy-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            <label htmlFor="trophy-file" className="btn btn--outline btn--small">
              {busy ? 'Processing…' : image ? 'Replace image' : 'Choose image'}
            </label>
            {image && (
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setImage(null)}>
                Remove image
              </button>
            )}
          </div>
        </div>
        <span className="field__hint">PNG, JPEG, WebP or GIF up to 10 MB. It is resized and stored in this browser only (and included in exports). GIFs become still images.</span>
        {imageError && (
          <span className="field__error" role="alert">
            {imageError}
          </span>
        )}
      </div>

      <div className="form-actions form-actions--split">
        {onDelete && (
          <button type="button" className="btn btn--danger-ghost" onClick={onDelete}>
            Remove
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={!title.trim() || !linkOk || busy}>
          Save
        </button>
      </div>
    </form>
  );
}
