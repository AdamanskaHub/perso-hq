import { useState, type FormEvent } from 'react';
import { useStore } from '../hooks/useStore';
import { isValidUrlOrEmpty, localDateKey, normaliseUrl, formatDate, uid } from '../lib/util';
import { MAX_ACTIVE_AREAS, type CharacterArea } from '../types';
import { useConfirm, useToast } from './Feedback';
import { EditableText } from './EditableText';
import { ExtLink } from './ExtLink';
import { Modal } from './Modal';
import { IconEdit, IconPlus, IconTrash } from './Icons';

export function CharacterDev() {
  const { data, update } = useStore();
  const confirm = useConfirm();
  const { notify } = useToast();
  const [editing, setEditing] = useState<CharacterArea | 'new' | null>(null);

  const active = data.characterAreas.filter((a) => a.status === 'active');
  const archived = data.characterAreas.filter((a) => a.status === 'archived');
  const full = active.length >= MAX_ACTIVE_AREAS;

  const patchArea = (id: string, fn: (a: CharacterArea) => CharacterArea) =>
    update((d) => ({ ...d, characterAreas: d.characterAreas.map((a) => (a.id === id ? fn(a) : a)) }));

  const saveArea = (a: CharacterArea) => {
    update((d) => {
      const exists = d.characterAreas.some((x) => x.id === a.id);
      return { ...d, characterAreas: exists ? d.characterAreas.map((x) => (x.id === a.id ? a : x)) : [...d.characterAreas, a] };
    });
    setEditing(null);
  };

  const removeArea = async (a: CharacterArea) => {
    const ok = await confirm({
      title: 'Delete this area?',
      message: <p>“{a.title}” and all its actions, reflections and resources will be deleted. To keep them, archive the area instead.</p>,
      confirmLabel: 'Delete area',
      danger: true,
    });
    if (!ok) return;
    update((d) => ({ ...d, characterAreas: d.characterAreas.filter((x) => x.id !== a.id) }));
    setEditing(null);
    notify('Area deleted.');
  };

  return (
    <section className="card card--wide" aria-labelledby="char-h">
      <div className="card__head">
        <p className="eyebrow eyebrow--coral">Becoming</p>
        <h2 id="char-h" className="card__title">
          Character development
        </h2>
        <button type="button" className="btn btn--outline btn--small card__head-action" onClick={() => setEditing('new')}>
          <IconPlus /> Add area
        </button>
      </div>
      <p className="card__lede">Up to three areas in focus. No daily check-ins, just small deliberate steps whenever you want them.</p>

      {active.length === 0 ? (
        <p className="empty-note">No areas in focus. Add one: style, resilience, communication, learning, or anything you want to grow.</p>
      ) : (
        <div className="area-grid">
          {active.map((a) => (
            <AreaCard key={a.id} area={a} onPatch={(fn) => patchArea(a.id, fn)} onEdit={() => setEditing(a)} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <details className="collapsible collapsible--areas">
          <summary>Archived areas ({archived.length})</summary>
          <div className="area-grid area-grid--archived">
            {archived.map((a) => (
              <AreaCard key={a.id} area={a} onPatch={(fn) => patchArea(a.id, fn)} onEdit={() => setEditing(a)} archivedView />
            ))}
          </div>
        </details>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add area' : 'Edit area'}>
        {editing && (
          <AreaForm
            area={editing === 'new' ? null : editing}
            activeCount={active.filter((a) => editing === 'new' || a.id !== editing.id).length}
            onCancel={() => setEditing(null)}
            onSave={saveArea}
            onDelete={editing === 'new' ? undefined : () => removeArea(editing)}
          />
        )}
      </Modal>
      {full && editing === null && <span className="sr-only">Three areas are active. Archive one to bring another into focus.</span>}
    </section>
  );
}

function AreaCard({
  area,
  onPatch,
  onEdit,
  archivedView,
}: {
  area: CharacterArea;
  onPatch: (fn: (a: CharacterArea) => CharacterArea) => void;
  onEdit: () => void;
  archivedView?: boolean;
}) {
  const { notify } = useToast();
  const [action, setAction] = useState('');
  const [reflection, setReflection] = useState('');
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const resUrlOk = isValidUrlOrEmpty(resUrl);

  const undoable = <T extends { id: string }>(key: 'actions' | 'reflections' | 'resources', item: T, label: string) => {
    const list = area[key] as unknown as T[];
    const index = list.findIndex((x) => x.id === item.id);
    onPatch((a) => ({ ...a, [key]: (a[key] as unknown as T[]).filter((x) => x.id !== item.id) }));
    notify(`${label} deleted.`, {
      actionLabel: 'Undo',
      onAction: () =>
        onPatch((a) => {
          const cur = [...(a[key] as unknown as T[])];
          if (cur.some((x) => x.id === item.id)) return a;
          cur.splice(Math.min(index, cur.length), 0, item);
          return { ...a, [key]: cur };
        }),
    });
  };

  const addAction = (e: FormEvent) => {
    e.preventDefault();
    const t = action.trim();
    if (!t) return;
    onPatch((a) => ({ ...a, actions: [...a.actions, { id: uid(), text: t, done: false }] }));
    setAction('');
  };
  const addReflection = (e: FormEvent) => {
    e.preventDefault();
    const t = reflection.trim();
    if (!t) return;
    onPatch((a) => ({ ...a, reflections: [{ id: uid(), text: t, date: localDateKey() }, ...a.reflections] }));
    setReflection('');
  };
  const addResource = (e: FormEvent) => {
    e.preventDefault();
    const t = resTitle.trim();
    if (!t || !resUrlOk) return;
    onPatch((a) => ({ ...a, resources: [...a.resources, { id: uid(), title: t, url: normaliseUrl(resUrl) }] }));
    setResTitle('');
    setResUrl('');
  };

  const openSteps = area.actions.filter((x) => !x.done).length;

  return (
    <article className={`area ${archivedView ? 'area--archived' : ''}`} aria-labelledby={`area-${area.id}`}>
      <header className="area__head">
        <h3 id={`area-${area.id}`} className="area__title">
          {area.title}
        </h3>
        <button type="button" className="icon-btn" aria-label={`Edit area ${area.title}`} onClick={onEdit}>
          <IconEdit />
        </button>
      </header>
      {area.objective && <p className="area__objective">{area.objective}</p>}

      <h4 className="area__sub">
        Actions {area.actions.length > 0 && <span className="muted small">({openSteps} open)</span>}
      </h4>
      {area.actions.length === 0 && <p className="muted small">No actions yet. Add a small step below.</p>}
      <ul className="rows rows--tight">
        {area.actions.map((x) => (
          <li key={x.id} className={`row ${x.done ? 'row--done' : ''}`}>
            <input
              type="checkbox"
              className="check"
              checked={x.done}
              aria-label={`Done: ${x.text}`}
              onChange={() => onPatch((a) => ({ ...a, actions: a.actions.map((y) => (y.id === x.id ? { ...y, done: !y.done } : y)) }))}
            />
            <div className="row__main row__main--edit">
              <EditableText
                value={x.text}
                label={`action "${x.text}"`}
                className="row__title"
                onSave={(v) => onPatch((a) => ({ ...a, actions: a.actions.map((y) => (y.id === x.id ? { ...y, text: v } : y)) }))}
              />
            </div>
            <button type="button" className="icon-btn icon-btn--small" aria-label={`Delete action ${x.text}`} onClick={() => undoable('actions', x, 'Action')}>
              <IconTrash />
            </button>
          </li>
        ))}
      </ul>
      <form className="add-row add-row--compact" onSubmit={addAction}>
        <label className="sr-only" htmlFor={`act-${area.id}`}>
          New action for {area.title}
        </label>
        <input id={`act-${area.id}`} className="input input--small" value={action} maxLength={1000} onChange={(e) => setAction(e.target.value)} placeholder="Add a small step…" />
        <button type="submit" className="btn btn--outline btn--small" disabled={!action.trim()}>
          Add
        </button>
      </form>

      <details className="collapsible collapsible--inner">
        <summary>Reflections ({area.reflections.length})</summary>
        <form className="stack" onSubmit={addReflection}>
          <label className="sr-only" htmlFor={`ref-${area.id}`}>
            New reflection for {area.title}
          </label>
          <textarea id={`ref-${area.id}`} className="input input--small" rows={2} value={reflection} maxLength={5000} onChange={(e) => setReflection(e.target.value)} placeholder="A lesson, an observation… (optional, whenever)" />
          <div className="btn-row btn-row--end">
            <button type="submit" className="btn btn--outline btn--small" disabled={!reflection.trim()}>
              Add reflection
            </button>
          </div>
        </form>
        <ul className="plain-list reflections">
          {area.reflections.map((r) => (
            <li key={r.id} className="reflection">
              <div className="reflection__meta">
                <time dateTime={r.date}>{formatDate(r.date)}</time>
                <button type="button" className="icon-btn icon-btn--small" aria-label="Delete reflection" onClick={() => undoable('reflections', r, 'Reflection')}>
                  <IconTrash />
                </button>
              </div>
              <EditableText
                value={r.text}
                label="reflection"
                multiline
                maxLength={5000}
                onSave={(v) => onPatch((a) => ({ ...a, reflections: a.reflections.map((y) => (y.id === r.id ? { ...y, text: v } : y)) }))}
              />
            </li>
          ))}
        </ul>
      </details>

      <details className="collapsible collapsible--inner">
        <summary>Books and resources ({area.resources.length})</summary>
        <ul className="plain-list resources">
          {area.resources.map((r) => (
            <li key={r.id} className="resource">
              {r.url ? (
                <ExtLink href={r.url} className="resource__link">
                  {r.title}
                </ExtLink>
              ) : (
                <span>{r.title}</span>
              )}
              <button type="button" className="icon-btn icon-btn--small" aria-label={`Delete resource ${r.title}`} onClick={() => undoable('resources', r, 'Resource')}>
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
        <form className="stack" onSubmit={addResource}>
          <label className="sr-only" htmlFor={`rt-${area.id}`}>
            Resource title
          </label>
          <input id={`rt-${area.id}`} className="input input--small" value={resTitle} maxLength={300} onChange={(e) => setResTitle(e.target.value)} placeholder="Book or resource title" />
          <label className="sr-only" htmlFor={`ru-${area.id}`}>
            Resource link (optional)
          </label>
          <input id={`ru-${area.id}`} className="input input--small" inputMode="url" value={resUrl} maxLength={2000} onChange={(e) => setResUrl(e.target.value)} placeholder="Link (optional)" aria-invalid={!resUrlOk} />
          {!resUrlOk && <span className="field__error">Please enter a valid http or https link.</span>}
          <div className="btn-row btn-row--end">
            <button type="submit" className="btn btn--outline btn--small" disabled={!resTitle.trim() || !resUrlOk}>
              Add resource
            </button>
          </div>
        </form>
      </details>
    </article>
  );
}

function AreaForm({
  area,
  activeCount,
  onSave,
  onCancel,
  onDelete,
}: {
  area: CharacterArea | null;
  /** Active areas other than this one. */
  activeCount: number;
  onSave: (a: CharacterArea) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const canBeActive = activeCount < MAX_ACTIVE_AREAS;
  const [title, setTitle] = useState(area?.title ?? '');
  const [objective, setObjective] = useState(area?.objective ?? '');
  const [status, setStatus] = useState<CharacterArea['status']>(area ? area.status : canBeActive ? 'active' : 'archived');
  const effective = status === 'active' && !canBeActive ? 'archived' : status;

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({
          id: area?.id ?? uid(),
          title: title.trim(),
          objective: objective.trim(),
          status: effective,
          actions: area?.actions ?? [],
          reflections: area?.reflections ?? [],
          resources: area?.resources ?? [],
        });
      }}
    >
      <label className="field">
        <span className="field__label">Title</span>
        <input className="input" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span className="field__label">Personal objective</span>
        <textarea className="input" rows={3} value={objective} maxLength={1000} onChange={(e) => setObjective(e.target.value)} placeholder="Who do you want to become in this area?" />
      </label>
      <label className="field">
        <span className="field__label">Status</span>
        <select className="input" value={effective} onChange={(e) => setStatus(e.target.value as CharacterArea['status'])}>
          <option value="active" disabled={!canBeActive}>
            In focus
          </option>
          <option value="archived">Archived</option>
        </select>
        {!canBeActive && <span className="field__hint">Three areas are already in focus. Archive one to bring this one forward.</span>}
      </label>
      <div className="form-actions form-actions--split">
        {onDelete && (
          <button type="button" className="btn btn--danger-ghost" onClick={onDelete}>
            Delete
          </button>
        )}
        <span className="spacer" />
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={!title.trim()}>
          Save
        </button>
      </div>
    </form>
  );
}
