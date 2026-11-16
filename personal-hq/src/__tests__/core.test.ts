import { beforeEach, describe, expect, it } from 'vitest';
import { challengeFor, doctrineFor, hasChallengeToday, heroContent, autoMode } from '../lib/identity';
import { DOCTRINES } from '../data/doctrines';
import { CHALLENGES } from '../data/challenges';
import { createSeedData } from '../data/seed';
import { buildExport, parseImport } from '../storage/validate';
import { createLocalStorageRepository, STORAGE_KEY } from '../storage/repository';
import { normaliseUrl } from '../lib/util';

describe('content', () => {
  it('has 30 doctrines and 15 challenges, all unique', () => {
    expect(DOCTRINES).toHaveLength(30);
    expect(CHALLENGES).toHaveLength(15);
    expect(new Set(DOCTRINES.map((d) => d.title)).size).toBe(30);
    expect(new Set(CHALLENGES).size).toBe(15);
  });
});

describe('identity engine', () => {
  it('is deterministic per local date and independent of time of day', () => {
    const a = doctrineFor(new Date(2026, 5, 1, 0, 1));
    const b = doctrineFor(new Date(2026, 5, 1, 23, 59));
    expect(a).toBe(b);
    expect(doctrineFor(new Date(2026, 5, 2, 9))).not.toBe(a);
  });
  it('cycles through all doctrines over 30 days', () => {
    const titles = new Set(Array.from({ length: 30 }, (_, i) => doctrineFor(new Date(2026, 0, 1 + i)).title));
    expect(titles.size).toBe(30);
  });
  it('shows challenges on some but not all evenings', () => {
    const n = Array.from({ length: 120 }, (_, i) => hasChallengeToday(new Date(2026, 0, 1 + i))).filter(Boolean).length;
    expect(n).toBeGreaterThan(25);
    expect(n).toBeLessThan(80);
    expect(CHALLENGES).toContain(challengeFor(new Date(2026, 0, 1)));
  });
  it('auto mode and overrides', () => {
    expect(autoMode(new Date(2026, 0, 1, 9))).toBe('morning');
    expect(autoMode(new Date(2026, 0, 1, 20))).toBe('evening');
    expect(autoMode(new Date(2026, 0, 1, 2))).toBe('evening');
    expect(heroContent('evening', new Date(2026, 0, 1, 9)).kind).toBe('challenge');
    expect(heroContent('morning', new Date(2026, 0, 1, 22)).kind).toBe('doctrine');
  });
});

describe('import/export validation', () => {
  const good = () => JSON.stringify(buildExport(createSeedData()));
  it('round-trips seed data', () => {
    const seed = createSeedData();
    const r = parseImport(JSON.stringify(buildExport(seed)));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual(seed);
  });
  it('rejects garbage, wrong app, newer schema, bad fields', () => {
    expect(parseImport('nope').ok).toBe(false);
    expect(parseImport('{"app":"x"}').ok).toBe(false);
    const f = JSON.parse(good());
    expect(parseImport(JSON.stringify({ ...f, schemaVersion: 2 })).ok).toBe(false);
    f.data.adminTasks[0].done = 'yes';
    expect(parseImport(JSON.stringify(f)).ok).toBe(false);
  });
  it('rejects javascript: links and non-image data URLs, strips unknown fields', () => {
    const f = JSON.parse(good());
    f.data.settings.kanbanUrl = 'javascript:alert(1)';
    expect(parseImport(JSON.stringify(f)).ok).toBe(false);
    const g = JSON.parse(good());
    g.data.trophies[0].image = 'data:text/html;base64,AAAA';
    expect(parseImport(JSON.stringify(g)).ok).toBe(false);
    const h = JSON.parse(good());
    h.data.extra = 1;
    const r = parseImport(JSON.stringify(h));
    expect(r.ok && 'extra' in r.data).toBe(false);
  });
  it('normalises urls', () => {
    expect(normaliseUrl('example.com')).toBe('https://example.com/');
    expect(normaliseUrl('javascript:alert(1)')).toBe('');
  });
});

describe('repository', () => {
  beforeEach(() => localStorage.clear());
  it('seeds once and never overwrites saved data', () => {
    const repo = createLocalStorageRepository();
    expect(repo.load().status).toBe('seeded');
    const d = createSeedData();
    d.mainQuest.projectTitle = 'Mine';
    repo.save(d);
    const again = createLocalStorageRepository().load();
    expect(again.status).toBe('ok');
    expect(again.data.mainQuest.projectTitle).toBe('Mine');
  });
  it('keeps corrupt data untouched and backed up', () => {
    localStorage.setItem(STORAGE_KEY, '{bad');
    const r = createLocalStorageRepository().load();
    expect(r.status).toBe('corrupt');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('{bad');
    expect(localStorage.getItem('personal-hq:corrupt-backup')).toBe('{bad');
  });
});
