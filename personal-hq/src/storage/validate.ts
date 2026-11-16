import {
  APP_ID,
  SCHEMA_VERSION,
  type ActionStep,
  type AdminTask,
  type AppData,
  type CharacterArea,
  type ExportFile,
  type Reflection,
  type Resource,
  type SideQuest,
  type Trophy,
  type Win,
} from '../types';
import { isValidUrlOrEmpty, normaliseUrl } from '../lib/util';
import { migrate } from './migrate';

export const MAX_IMPORT_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_DATA_URL_CHARS = 900_000;
const IMAGE_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);

class Ctx {
  errors: string[] = [];
  err(path: string, msg: string) {
    if (this.errors.length < 12) this.errors.push(`${path}: ${msg}`);
    else if (this.errors.length === 12) this.errors.push('…and more');
  }
}

function str(c: Ctx, o: Rec, key: string, path: string, opts: { required?: boolean; max?: number } = {}): string {
  const v = o[key];
  if (v === undefined || v === null) {
    if (opts.required) c.err(`${path}.${key}`, 'is required');
    return '';
  }
  if (typeof v !== 'string') {
    c.err(`${path}.${key}`, 'must be text');
    return '';
  }
  if (v.length > (opts.max ?? 10_000)) {
    c.err(`${path}.${key}`, 'is too long');
    return '';
  }
  if (opts.required && v.trim() === '') c.err(`${path}.${key}`, 'must not be empty');
  return v;
}

function bool(c: Ctx, o: Rec, key: string, path: string, fallback = false): boolean {
  const v = o[key];
  if (v === undefined) return fallback;
  if (typeof v !== 'boolean') {
    c.err(`${path}.${key}`, 'must be true or false');
    return fallback;
  }
  return v;
}

function url(c: Ctx, o: Rec, key: string, path: string): string {
  const v = str(c, o, key, path, { max: 2000 });
  if (!isValidUrlOrEmpty(v)) {
    c.err(`${path}.${key}`, 'is not a valid http(s) link');
    return '';
  }
  return v ? normaliseUrl(v) : '';
}

function dateStr(c: Ctx, o: Rec, key: string, path: string, required = false): string {
  const v = str(c, o, key, path, { required, max: 40 });
  if (v && Number.isNaN(new Date(v).getTime())) {
    c.err(`${path}.${key}`, 'is not a valid date');
    return '';
  }
  return v;
}

function arr(c: Ctx, o: Rec, key: string, path: string, required = true): unknown[] {
  const v = o[key];
  if (v === undefined) {
    if (required) c.err(`${path}.${key}`, 'is missing');
    return [];
  }
  if (!Array.isArray(v)) {
    c.err(`${path}.${key}`, 'must be a list');
    return [];
  }
  return v;
}

function each<T>(c: Ctx, list: unknown[], path: string, fn: (o: Rec, p: string) => T): T[] {
  const out: T[] = [];
  list.forEach((item, i) => {
    const p = `${path}[${i}]`;
    if (!isRec(item)) {
      c.err(p, 'must be an object');
      return;
    }
    out.push(fn(item, p));
  });
  return out;
}

/** Validates and rebuilds AppData, keeping only known fields. Never mutates its input. */
export function sanitiseAppData(raw: unknown): { data: AppData | null; errors: string[] } {
  const c = new Ctx();
  if (!isRec(raw)) return { data: null, errors: ['data: must be an object'] };

  const s = isRec(raw.settings) ? raw.settings : (c.err('settings', 'is missing'), {} as Rec);
  const settings = {
    kanbanUrl: url(c, s, 'kanbanUrl', 'settings'),
    timerUrl: url(c, s, 'timerUrl', 'settings'),
    hideCompletedAdmin: bool(c, s, 'hideCompletedAdmin', 'settings'),
    lastExportedAt: s.lastExportedAt == null ? null : dateStr(c, s, 'lastExportedAt', 'settings') || null,
  };

  const m = isRec(raw.mainQuest) ? raw.mainQuest : (c.err('mainQuest', 'is missing'), {} as Rec);
  const mainQuest = {
    projectTitle: str(c, m, 'projectTitle', 'mainQuest', { max: 200 }),
    nextAction: str(c, m, 'nextAction', 'mainQuest', { max: 1000 }),
    context: str(c, m, 'context', 'mainQuest', { max: 2000 }),
  };

  const wins = each<Win>(c, arr(c, raw, 'wins', 'data'), 'wins', (o, p) => ({
    id: str(c, o, 'id', p, { required: true, max: 100 }),
    text: str(c, o, 'text', p, { required: true, max: 1000 }),
    projectTitle: str(c, o, 'projectTitle', p, { max: 200 }),
    completedAt: dateStr(c, o, 'completedAt', p, true),
  }));

  const sideQuests = each<SideQuest>(c, arr(c, raw, 'sideQuests', 'data'), 'sideQuests', (o, p) => ({
    id: str(c, o, 'id', p, { required: true, max: 100 }),
    title: str(c, o, 'title', p, { required: true, max: 200 }),
    description: str(c, o, 'description', p, { max: 2000 }),
    createdAt: dateStr(c, o, 'createdAt', p) || new Date().toISOString(),
    completedAt: o.completedAt == null ? null : dateStr(c, o, 'completedAt', p) || null,
  }));

  const trophies = each<Trophy>(c, arr(c, raw, 'trophies', 'data'), 'trophies', (o, p) => {
    let image: string | null = null;
    if (o.image != null) {
      if (typeof o.image !== 'string' || !IMAGE_RE.test(o.image)) {
        c.err(`${p}.image`, 'is not a supported embedded image');
      } else if (o.image.length > MAX_IMAGE_DATA_URL_CHARS) {
        c.err(`${p}.image`, 'is too large');
      } else image = o.image;
    }
    return {
      id: str(c, o, 'id', p, { required: true, max: 100 }),
      title: str(c, o, 'title', p, { required: true, max: 200 }),
      date: dateStr(c, o, 'date', p),
      description: str(c, o, 'description', p, { max: 2000 }),
      image,
      link: url(c, o, 'link', p),
    };
  });

  const characterAreas = each<CharacterArea>(c, arr(c, raw, 'characterAreas', 'data'), 'characterAreas', (o, p) => {
    const status = o.status === 'archived' ? 'archived' : o.status === 'active' ? 'active' : null;
    if (!status) c.err(`${p}.status`, 'must be "active" or "archived"');
    return {
      id: str(c, o, 'id', p, { required: true, max: 100 }),
      title: str(c, o, 'title', p, { required: true, max: 200 }),
      objective: str(c, o, 'objective', p, { max: 1000 }),
      status: status ?? 'archived',
      actions: each<ActionStep>(c, arr(c, o, 'actions', p), `${p}.actions`, (a, ap) => ({
        id: str(c, a, 'id', ap, { required: true, max: 100 }),
        text: str(c, a, 'text', ap, { required: true, max: 1000 }),
        done: bool(c, a, 'done', ap),
      })),
      reflections: each<Reflection>(c, arr(c, o, 'reflections', p), `${p}.reflections`, (r, rp) => ({
        id: str(c, r, 'id', rp, { required: true, max: 100 }),
        text: str(c, r, 'text', rp, { required: true, max: 5000 }),
        date: dateStr(c, r, 'date', rp),
      })),
      resources: each<Resource>(c, arr(c, o, 'resources', p), `${p}.resources`, (r, rp) => ({
        id: str(c, r, 'id', rp, { required: true, max: 100 }),
        title: str(c, r, 'title', rp, { required: true, max: 300 }),
        url: url(c, r, 'url', rp),
      })),
    };
  });

  const adminTasks = each<AdminTask>(c, arr(c, raw, 'adminTasks', 'data'), 'adminTasks', (o, p) => ({
    id: str(c, o, 'id', p, { required: true, max: 100 }),
    text: str(c, o, 'text', p, { required: true, max: 1000 }),
    done: bool(c, o, 'done', p),
  }));

  // Duplicate ids would break React keys and edits.
  const dupes = (label: string, ids: string[]) => {
    if (new Set(ids).size !== ids.length) c.err(label, 'contains duplicate ids');
  };
  dupes('wins', wins.map((x) => x.id));
  dupes('sideQuests', sideQuests.map((x) => x.id));
  dupes('trophies', trophies.map((x) => x.id));
  dupes('characterAreas', characterAreas.map((x) => x.id));
  dupes('adminTasks', adminTasks.map((x) => x.id));

  if (c.errors.length) return { data: null, errors: c.errors };
  return {
    data: { settings, mainQuest, wins, sideQuests, trophies, characterAreas, adminTasks },
    errors: [],
  };
}

export type ParseResult = { ok: true; data: AppData; exportedAt: string } | { ok: false; errors: string[] };

/** Parse and validate the text of an export file. Nothing is applied here. */
export function parseImport(text: string): ParseResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, errors: ['The file is too large to be a Personal HQ export.'] };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['This file is not valid JSON.'] };
  }
  if (!isRec(json) || json.app !== APP_ID) {
    return { ok: false, errors: ['This does not look like a Personal HQ export (missing app marker).'] };
  }
  const v = json.schemaVersion;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
    return { ok: false, errors: ['The export has no valid schema version.'] };
  }
  if (v > SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [`This export was made by a newer version of Personal HQ (schema ${v}; this version understands up to ${SCHEMA_VERSION}).`],
    };
  }
  let migrated: unknown;
  try {
    migrated = migrate(json.data, v);
  } catch {
    return { ok: false, errors: ['The export could not be upgraded to the current format.'] };
  }
  const { data, errors } = sanitiseAppData(migrated);
  if (!data) return { ok: false, errors };
  return { ok: true, data, exportedAt: typeof json.exportedAt === 'string' ? json.exportedAt : '' };
}

export function buildExport(data: AppData): ExportFile {
  return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data };
}
