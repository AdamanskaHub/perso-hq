import { useState, type FormEvent } from 'react';
import { useStore } from '../hooks/useStore';
import { uid } from '../lib/util';
import { useConfirm, useToast } from './Feedback';
import { Modal } from './Modal';
import { IconEdit, IconPlus } from './Icons';
import type { SideQuest } from '../types';

export function SideQuests() {
  const { data, update } = useStore();
  const confirm = useConfirm();
  const { notify } = useToast();
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState<SideQuest | null>(null);

  const open = data.sideQuests.filter((q) => !q.completedAt);
  const done = data.sideQuests.filter((q) => q.completedAt).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const add = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    update((d) => ({
      ...d,
      sideQuests: [{ id: uid(), title: t, description: '', createdAt: new Date().toISOString(), completedAt: null }, ...d.sideQuests],
    }));
    setTitle('');
  };

  const setCompleted = (id: string, completed: boolean) =>
    update((d) => ({
      ...d,
      sideQuests: d.sideQuests.map((q) => (q.id === id ? { ...q, completedAt: completed ? new Date().toISOString() : null } : q)),
    }));

  const remove = async (q: SideQuest) => {
    const ok = await confirm({
      title: 'Delete side quest?',
      message: (
        <p>
          “{q.title}” will be removed permanently. If you only finished it, mark it completed instead.
        </p>
      ),
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    update((d) => ({ ...d, sideQuests: d.sideQuests.filter((x) => x.id !== q.id) }));
    setEditing(null);
    notify('Side quest deleted.');
  };

  return (
    <section className="card" aria-labelledby="side-h">
      <div className="card__head">
        <p className="eyebrow eyebrow--teal">Small experiments</p>
        <h2 id="side-h" className="card__title">
          Side quests
        </h2>
      </div>

      <form className="add-row" onSubmit={add}>
        <label className="sr-only" htmlFor="side-add">
          New side quest
        </label>
        <input id="side-add" className="input" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Something small to try…" />
        <button type="submit" className="btn btn--primary" disabled={!title.trim()}>
          <IconPlus /> Add
        </button>
      </form>

      {open.length === 0 ? (
        <p className="empty-note">No side quests yet. A sketch, a melody, a weird little idea: add one above and see where it goes.</p>
      ) : (
        <ul className="rows">
          {open.map((q) => (
            <li key={q.id} className="row">
              <input type="checkbox" className="check" id={`sq-${q.id}`} checked={false} onChange={() => setCompleted(q.id, true)} />
              <label htmlFor={`sq-${q.id}`} className="row__main">
                <span className="row__title">{q.title}</span>
                {q.description && <span className="row__desc">{q.description}</span>}
              </label>
              <button type="button" className="icon-btn" aria-label={`Edit ${q.title}`} onClick={() => setEditing(q)}>
                <IconEdit />
              </button>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <details className="collapsible">
          <summary>Completed ({done.length})</summary>
          <ul className="rows rows--done">
            {done.map((q) => (
              <li key={q.id} className="row">
                <input type="checkbox" className="check" id={`sq-${q.id}`} checked onChange={() => setCompleted(q.id, false)} />
                <label htmlFor={`sq-${q.id}`} className="row__main">
                  <span className="row__title">{q.title}</span>
                  {q.description && <span className="row__desc">{q.description}</span>}
                </label>
                <button type="button" className="icon-btn" aria-label={`Edit ${q.title}`} onClick={() => setEditing(q)}>
                  <IconEdit />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit side quest">
        {editing && (
          <SideQuestForm
            quest={editing}
            onCancel={() => setEditing(null)}
            onDelete={() => remove(editing)}
            onSave={(patch) => {
              update((d) => ({ ...d, sideQuests: d.sideQuests.map((q) => (q.id === editing.id ? { ...q, ...patch } : q)) }));
              setEditing(null);
            }}
          />
        )}
      </Modal>
    </section>
  );
}

function SideQuestForm({
  quest,
  onSave,
  onCancel,
  onDelete,
}: {
  quest: SideQuest;
  onSave: (p: { title: string; description: string }) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(quest.title);
  const [description, setDescription] = useState(quest.description);
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) onSave({ title: title.trim(), description: description.trim() });
      }}
    >
      <label className="field">
        <span className="field__label">Title</span>
        <input className="input" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span className="field__label">Short description (optional)</span>
        <textarea className="input" rows={3} value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="form-actions form-actions--split">
        <button type="button" className="btn btn--danger-ghost" onClick={onDelete}>
          Delete
        </button>
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
