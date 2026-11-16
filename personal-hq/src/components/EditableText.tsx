import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconEdit } from './Icons';

interface Props {
  value: string;
  onSave: (v: string) => void;
  /** Accessible name, e.g. "task" → "Edit task". */
  label: string;
  multiline?: boolean;
  /** Whether an empty value is allowed. If false, an empty save is ignored. */
  allowEmpty?: boolean;
  maxLength?: number;
  className?: string;
  render?: (value: string) => ReactNode;
}

/** Text with a small edit button. Enter saves, Esc cancels (Shift+Enter adds a line when multiline). */
export function EditableText({ value, onSave, label, multiline, allowEmpty, maxLength = 1000, className, render }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const editBtn = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (editing) {
      fieldRef.current?.focus();
      fieldRef.current?.select();
    } else if (wasEditing.current) {
      editBtn.current?.focus();
    }
    wasEditing.current = editing;
  }, [editing]);

  const commit = () => {
    const v = draft.trim();
    if (!v && !allowEmpty) {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (v !== value) onSave(v);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    const common = {
      ref: fieldRef,
      value: draft,
      maxLength,
      'aria-label': `Edit ${label}`,
      className: 'input input--inline',
      onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        } else if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
          e.preventDefault();
          commit();
        }
      },
    };
    return multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />;
  }

  return (
    <span className={`editable ${className ?? ''}`}>
      <span className="editable__text">{render ? render(value) : value}</span>
      <button
        ref={editBtn}
        type="button"
        className="icon-btn icon-btn--small"
        aria-label={`Edit ${label}`}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        <IconEdit />
      </button>
    </span>
  );
}
