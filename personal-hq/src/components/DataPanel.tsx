import { useEffect, useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { repository } from '../storage';
import { parseImport } from '../storage/validate';
import { createSeedData } from '../data/seed';
import { downloadText, exportAll } from '../lib/exportData';
import { formatBytes, formatDate, isValidUrlOrEmpty, normaliseUrl } from '../lib/util';
import { useConfirm, useToast } from './Feedback';
import { IconDownload, IconUpload } from './Icons';

const BROWSER_QUOTA_HINT = 5 * 1024 * 1024; // typical localStorage budget

export function DataPanel() {
  const { data, update, replaceAll } = useStore();
  const confirm = useConfirm();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const [kanban, setKanban] = useState(data.settings.kanbanUrl);
  const [timer, setTimer] = useState(data.settings.timerUrl);
  // Keep fields in step if data is replaced by an import/reset.
  useEffect(() => setKanban(data.settings.kanbanUrl), [data.settings.kanbanUrl]);
  useEffect(() => setTimer(data.settings.timerUrl), [data.settings.timerUrl]);

  const kOk = isValidUrlOrEmpty(kanban);
  const tOk = isValidUrlOrEmpty(timer);
  const dirty = normaliseUrl(kanban) !== data.settings.kanbanUrl || normaliseUrl(timer) !== data.settings.timerUrl;

  const saveLinks = () => {
    if (!kOk || !tOk) return;
    update((d) => ({ ...d, settings: { ...d.settings, kanbanUrl: normaliseUrl(kanban), timerUrl: normaliseUrl(timer) } }));
    notify('Links saved.');
  };

  const onExport = () => {
    const at = exportAll(data);
    update((d) => ({ ...d, settings: { ...d.settings, lastExportedAt: at } }));
    notify('Export downloaded. Keep it somewhere safe.');
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file) return;
    setImportErrors([]);
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportErrors(['That file could not be read.']);
      return;
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
    const result = parseImport(text);
    if (!result.ok) {
      setImportErrors(result.errors);
      return;
    }
    const d = result.data;
    const images = d.trophies.filter((t) => t.image).length;
    const ok = await confirm({
      title: 'Replace everything with this import?',
      message: (
        <>
          <p>
            This will <strong>replace all data currently in this browser</strong>. It cannot be undone, so export first if you want a copy of what is here now.
          </p>
          <ul className="plain-list import-summary">
            <li>
              Project: {d.mainQuest.projectTitle || 'Untitled'}
              {result.exportedAt ? <> (exported {formatDate(result.exportedAt)})</> : null}
            </li>
            <li>{d.sideQuests.length} side quests · {d.trophies.length} trophies ({images} with images)</li>
            <li>{d.characterAreas.length} character areas · {d.adminTasks.length} admin tasks · {d.wins.length} wins</li>
          </ul>
        </>
      ),
      confirmLabel: 'Replace my data',
      danger: true,
    });
    if (!ok) return;
    replaceAll(d);
    notify('Import complete. Your data has been replaced.');
  };

  const onReset = async () => {
    const ok = await confirm({
      title: 'Reset to example content?',
      message: <p>All your own content in this browser will be replaced by the original examples. Export first if you might want it back.</p>,
      confirmLabel: 'Reset everything',
      danger: true,
    });
    if (!ok) return;
    replaceAll(createSeedData());
    notify('Reset to example content.');
  };

  const usage = repository.usageBytes();
  const pct = usage ? Math.min(100, Math.round((usage / BROWSER_QUOTA_HINT) * 100)) : 0;

  return (
    <section className="card" id="settings" aria-labelledby="data-h">
      <div className="card__head">
        <p className="eyebrow">Settings</p>
        <h2 id="data-h" className="card__title">
          Data and links
        </h2>
      </div>

      <div className="callout" role="note">
        <strong>Your data lives in this browser, on this device only.</strong> It does not sync to your phone, other browsers or other computers. To move it, export a file here and import it there. Clearing browser data erases it, so export now and then.
        <div className="callout__meta">{data.settings.lastExportedAt ? <>Last export from this browser: {formatDate(data.settings.lastExportedAt)}.</> : <>You have not exported from this browser yet.</>}</div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={onExport}>
          <IconDownload /> Export all data
        </button>
        <input ref={fileRef} id="import-file" type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onImportFile(e.target.files?.[0])} />
        <label htmlFor="import-file" className="btn btn--outline">
          <IconUpload /> Import data…
        </label>
      </div>
      {importErrors.length > 0 && (
        <div className="notice notice--error" role="alert">
          <strong>Import failed. Nothing was changed.</strong>
          <ul>
            {importErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="form form--links"
        onSubmit={(e) => {
          e.preventDefault();
          saveLinks();
        }}
      >
        <h3 className="subhead">External links</h3>
        <label className="field">
          <span className="field__label">Kanban board link</span>
          <input id="setting-kanbanUrl" className="input" inputMode="url" value={kanban} onChange={(e) => setKanban(e.target.value)} placeholder="https://your-board.example.com" aria-invalid={!kOk} maxLength={2000} />
          {!kOk && <span className="field__error">Please enter a valid http or https link.</span>}
        </label>
        <label className="field">
          <span className="field__label">Pomodoro timer link</span>
          <input id="setting-timerUrl" className="input" inputMode="url" value={timer} onChange={(e) => setTimer(e.target.value)} placeholder="https://your-timer.example.com" aria-invalid={!tOk} maxLength={2000} />
          {!tOk && <span className="field__error">Please enter a valid http or https link.</span>}
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--outline" disabled={!dirty || !kOk || !tOk}>
            Save links
          </button>
        </div>
      </form>

      <div className="storage">
        <div className="storage__label">
          <span>Browser storage used</span>
          <span>{usage == null ? 'n/a' : `${formatBytes(usage)} of roughly 5 MB`}</span>
        </div>
        <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Browser storage used">
          <div className="meter__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="muted small">Trophy images are the main use of space. If storage fills up, Personal HQ will tell you and keep your last saved state.</p>
      </div>

      <details className="collapsible">
        <summary>Danger zone</summary>
        <p className="muted small">Replaces everything with the original example content.</p>
        <button type="button" className="btn btn--danger-ghost" onClick={onReset}>
          Reset to example content
        </button>
      </details>
    </section>
  );
}

export function StorageBanners() {
  const { loadIssue, saveError, startFresh, unreadableRaw } = useStore();
  const confirm = useConfirm();
  const { notify } = useToast();
  return (
    <>
      {loadIssue && (
        <div className="banner banner--error" role="alert">
          <div>
            <strong>Your saved data could not be read, so saving is paused.</strong> {loadIssue} A copy of the unreadable data was kept. You can download it, import an export file (in Data and links), or start fresh.
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--outline btn--small"
              onClick={() => {
                const raw = unreadableRaw();
                if (raw) downloadText('personal-hq-unreadable-data.txt', raw, 'text/plain');
                else notify('There is no unreadable data to download.');
              }}
            >
              Download unreadable data
            </button>
            <button
              type="button"
              className="btn btn--danger btn--small"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Start fresh?',
                  message: <p>Example content will replace what you see now and saving will resume. The unreadable original stays in a backup slot in this browser.</p>,
                  confirmLabel: 'Start fresh',
                  danger: true,
                });
                if (ok) startFresh();
              }}
            >
              Start fresh
            </button>
          </div>
        </div>
      )}
      {saveError && (
        <div className="banner banner--error" role="alert">
          <div>
            <strong>Not saved.</strong> {saveError}
          </div>
        </div>
      )}
    </>
  );
}
