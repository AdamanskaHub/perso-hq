import { useState, type FormEvent } from 'react';
import { useStore } from '../hooks/useStore';
import { uid } from '../lib/util';
import { useToast } from './Feedback';
import { EditableText } from './EditableText';
import { IconPlus, IconTrash } from './Icons';
import type { AdminTask } from '../types';

export function LifeAdmin() {
  const { data, update } = useStore();
  const { notify } = useToast();
  const [text, setText] = useState('');
  const hide = data.settings.hideCompletedAdmin;

  const tasks = data.adminTasks;
  const doneCount = tasks.filter((t) => t.done).length;
  const visible = hide ? tasks.filter((t) => !t.done) : tasks;

  const add = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    update((d) => ({ ...d, adminTasks: [{ id: uid(), text: t, done: false }, ...d.adminTasks] }));
    setText('');
  };

  const toggle = (id: string) => update((d) => ({ ...d, adminTasks: d.adminTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));

  const remove = (task: AdminTask) => {
    const index = tasks.findIndex((t) => t.id === task.id);
    update((d) => ({ ...d, adminTasks: d.adminTasks.filter((t) => t.id !== task.id) }));
    notify('Task deleted.', {
      actionLabel: 'Undo',
      onAction: () =>
        update((d) => {
          if (d.adminTasks.some((t) => t.id === task.id)) return d;
          const next = [...d.adminTasks];
          next.splice(Math.min(index, next.length), 0, task);
          return { ...d, adminTasks: next };
        }),
    });
  };

  return (
    <section className="card" aria-labelledby="admin-h">
      <div className="card__head">
        <p className="eyebrow eyebrow--teal">The everyday stuff</p>
        <h2 id="admin-h" className="card__title">
          Life admin
        </h2>
        {doneCount > 0 && (
          <label className="switch card__head-action">
            <input type="checkbox" checked={hide} onChange={(e) => update((d) => ({ ...d, settings: { ...d.settings, hideCompletedAdmin: e.target.checked } }))} />
            <span>Hide completed ({doneCount})</span>
          </label>
        )}
      </div>

      <form className="add-row" onSubmit={add}>
        <label className="sr-only" htmlFor="admin-add">
          New task
        </label>
        <input id="admin-add" className="input" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Add a task…" />
        <button type="submit" className="btn btn--primary" disabled={!text.trim()}>
          <IconPlus /> Add
        </button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty-note">Nothing to do. Enjoy it. Add a task whenever something nags at you.</p>
      ) : visible.length === 0 ? (
        <p className="empty-note">Everything is done. Completed tasks are hidden.</p>
      ) : (
        <ul className="rows">
          {visible.map((t) => (
            <li key={t.id} className={`row ${t.done ? 'row--done' : ''}`}>
              <input type="checkbox" className="check" checked={t.done} onChange={() => toggle(t.id)} aria-label={`Done: ${t.text}`} />
              <div className="row__main row__main--edit">
                <EditableText
                  value={t.text}
                  label={`task "${t.text}"`}
                  onSave={(v) => update((d) => ({ ...d, adminTasks: d.adminTasks.map((x) => (x.id === t.id ? { ...x, text: v } : x)) }))}
                  className="row__title"
                />
              </div>
              <button type="button" className="icon-btn" aria-label={`Delete ${t.text}`} onClick={() => remove(t)}>
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
