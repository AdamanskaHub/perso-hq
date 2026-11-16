import { useState, type FormEvent } from 'react';
import { useStore } from '../hooks/useStore';
import { uid, formatDate } from '../lib/util';
import { starterFor, type Mode } from '../lib/identity';
import { useToast } from './Feedback';
import { Modal } from './Modal';
import { ExtLink, focusSettingsLink } from './ExtLink';
import { IconBoard, IconCheck, IconEdit, IconPlay, IconTimer } from './Icons';
import type { AppData } from '../types';

function useCompleteMission() {
  const { data, update } = useStore();
  const { notify } = useToast();
  return () => {
    const mq = data.mainQuest;
    if (!mq.nextAction.trim()) return;
    const before = data;
    const win = { id: uid(), text: mq.nextAction, projectTitle: mq.projectTitle, completedAt: new Date().toISOString() };
    update((d: AppData) => ({ ...d, wins: [win, ...d.wins], mainQuest: { ...d.mainQuest, nextAction: '', context: '' } }));
    notify('Win recorded. Take a breath. Choose the next action when you are ready.', {
      actionLabel: 'Undo',
      onAction: () =>
        update((d) => ({
          ...d,
          wins: d.wins.filter((w) => w.id !== win.id),
          mainQuest: before.mainQuest,
        })),
    });
  };
}

export function MainQuest() {
  const { data, update } = useStore();
  const { kanbanUrl, timerUrl } = data.settings;
  const mq = data.mainQuest;
  const complete = useCompleteMission();
  const [editing, setEditing] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);

  const hasMission = mq.nextAction.trim() !== '';

  return (
    <section className="card card--quest" aria-labelledby="quest-h">
      <div className="card__head">
        <p className="eyebrow eyebrow--teal">Main quest</p>
        <h2 id="quest-h" className="card__title">
          {mq.projectTitle || 'Untitled project'}
        </h2>
        {!editing && (
          <button type="button" className="btn btn--ghost btn--small card__head-action" onClick={() => setEditing(true)}>
            <IconEdit /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <MissionForm
          initial={mq}
          onCancel={() => setEditing(false)}
          onSave={(next) => {
            update((d) => ({ ...d, mainQuest: next }));
            setEditing(false);
          }}
        />
      ) : hasMission ? (
        <>
          <p className="mission">{mq.nextAction}</p>
          {mq.context && <p className="mission__context">{mq.context}</p>}
          <div className="btn-row">
            <button type="button" className="btn btn--primary btn--large" onClick={() => setFocusOpen(true)}>
              <IconPlay /> Begin mission
            </button>
            <button type="button" className="btn btn--outline btn--large" onClick={complete}>
              <IconCheck /> Completed
            </button>
          </div>
        </>
      ) : (
        <EmptyMission
          onSet={(nextAction, context) => update((d) => ({ ...d, mainQuest: { ...d.mainQuest, nextAction, context } }))}
        />
      )}

      <div className="quest__links">
        {kanbanUrl ? (
          <ExtLink href={kanbanUrl} className="link-chip">
            <IconBoard /> Open Kanban board
          </ExtLink>
        ) : (
          <button type="button" className="link-chip link-chip--unset" onClick={() => focusSettingsLink('kanbanUrl')}>
            <IconBoard /> Add your Kanban board link
          </button>
        )}
      </div>

      {data.wins.length > 0 && (
        <details className="wins">
          <summary>Recent wins ({data.wins.length})</summary>
          <ul className="plain-list">
            {data.wins.slice(0, 5).map((w) => (
              <li key={w.id} className="wins__item">
                <IconCheck /> <span>{w.text}</span> <time dateTime={w.completedAt}>{formatDate(w.completedAt)}</time>
              </li>
            ))}
          </ul>
          {data.wins.length > 5 && <p className="muted small">Showing the latest 5. All wins are included in your export.</p>}
        </details>
      )}

      <Modal open={focusOpen} onClose={() => setFocusOpen(false)} title="Mission focus" variant="focus">
        <div className="focus">
          <p className="eyebrow eyebrow--teal">{mq.projectTitle || 'Main quest'}</p>
          <p className="focus__action">{mq.nextAction}</p>
          {mq.context && <p className="mission__context">{mq.context}</p>}
          <div className="btn-row btn-row--center">
            {timerUrl ? (
              <ExtLink href={timerUrl} className="btn btn--primary btn--large">
                <IconTimer /> Open timer
              </ExtLink>
            ) : (
              <button
                type="button"
                className="btn btn--outline btn--large"
                onClick={() => {
                  setFocusOpen(false);
                  focusSettingsLink('timerUrl');
                }}
              >
                <IconTimer /> Add your timer link
              </button>
            )}
            <button
              type="button"
              className="btn btn--outline btn--large"
              onClick={() => {
                setFocusOpen(false);
                complete();
              }}
            >
              <IconCheck /> Completed
            </button>
          </div>
          <button type="button" className="btn btn--ghost" onClick={() => setFocusOpen(false)}>
            Back to dashboard
          </button>
        </div>
      </Modal>
    </section>
  );
}

function EmptyMission({ onSet }: { onSet: (nextAction: string, context: string) => void }) {
  const [action, setAction] = useState('');
  const [context, setContext] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!action.trim()) return;
    onSet(action.trim(), context.trim());
    setAction('');
    setContext('');
  };
  return (
    <form className="empty empty--quest" onSubmit={submit}>
      <p className="empty__title">No mission right now.</p>
      <p className="muted">When you are ready, choose one next action, small enough to begin without negotiating with yourself.</p>
      <label className="field">
        <span className="field__label">Next action</span>
        <input className="input" value={action} maxLength={1000} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Sketch the harbour map" />
      </label>
      <label className="field">
        <span className="field__label">Context (optional)</span>
        <input className="input" value={context} maxLength={2000} onChange={(e) => setContext(e.target.value)} placeholder="A line to help future-you start" />
      </label>
      <div className="btn-row">
        <button type="submit" className="btn btn--primary" disabled={!action.trim()}>
          Set mission
        </button>
      </div>
    </form>
  );
}

function MissionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AppData['mainQuest'];
  onSave: (v: AppData['mainQuest']) => void;
  onCancel: () => void;
}) {
  const [projectTitle, setTitle] = useState(initial.projectTitle);
  const [nextAction, setAction] = useState(initial.nextAction);
  const [context, setContext] = useState(initial.context);
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ projectTitle: projectTitle.trim(), nextAction: nextAction.trim(), context: context.trim() });
      }}
    >
      <label className="field">
        <span className="field__label">Project title</span>
        <input className="input" value={projectTitle} maxLength={200} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </label>
      <label className="field">
        <span className="field__label">Next action (one only)</span>
        <input className="input" value={nextAction} maxLength={1000} onChange={(e) => setAction(e.target.value)} placeholder="Leave empty for no current mission" />
      </label>
      <label className="field">
        <span className="field__label">Context (optional)</span>
        <textarea className="input" rows={2} value={context} maxLength={2000} onChange={(e) => setContext(e.target.value)} />
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          Save
        </button>
      </div>
    </form>
  );
}

export function LaunchPad({ now, mode }: { now: Date; mode: Mode }) {
  const { data } = useStore();
  const { timerUrl, kanbanUrl } = data.settings;
  return (
    <aside className={`card card--launch ${mode === 'evening' ? 'is-evening' : ''}`} aria-labelledby="launch-h">
      <p className="eyebrow eyebrow--coral">{mode === 'evening' ? 'Evening launch' : 'Launch pad'}</p>
      <h2 id="launch-h" className="card__title card__title--small">
        Make starting easy
      </h2>
      <p className="launch__starter">{starterFor(now)}</p>
      <div className="launch__links">
        {timerUrl ? (
          <ExtLink href={timerUrl} className="btn btn--outline btn--block">
            <IconTimer /> Open timer
          </ExtLink>
        ) : (
          <button type="button" className="btn btn--outline btn--block" onClick={() => focusSettingsLink('timerUrl')}>
            <IconTimer /> Add your timer link
          </button>
        )}
        {kanbanUrl ? (
          <ExtLink href={kanbanUrl} className="btn btn--ghost btn--block">
            <IconBoard /> Open Kanban board
          </ExtLink>
        ) : (
          <button type="button" className="btn btn--ghost btn--block" onClick={() => focusSettingsLink('kanbanUrl')}>
            <IconBoard /> Add your Kanban link
          </button>
        )}
      </div>
    </aside>
  );
}
