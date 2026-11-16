import { CHALLENGES, STARTERS } from '../data/challenges';
import { DOCTRINES } from '../data/doctrines';
import type { Doctrine } from '../types';

export type Mode = 'morning' | 'evening';
export type ModeOverride = Mode | 'auto';

/** Evening runs from 17:00 until 04:00. */
export const EVENING_START_HOUR = 17;
export const MORNING_START_HOUR = 4;

/** Whole days since the epoch, counted in the *local* calendar. Changes at local midnight. */
export function localDayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export function autoMode(d: Date): Mode {
  const h = d.getHours();
  return h >= EVENING_START_HOUR || h < MORNING_START_HOUR ? 'evening' : 'morning';
}

export function resolveMode(override: ModeOverride, d: Date): Mode {
  return override === 'auto' ? autoMode(d) : override;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function doctrineFor(d: Date): Doctrine {
  return DOCTRINES[mod(localDayNumber(d), DOCTRINES.length)];
}

/** Deterministic pseudo-random: roughly 2 evenings in 5 carry a challenge. */
export function hasChallengeToday(d: Date): boolean {
  const n = localDayNumber(d);
  const h = Math.imul(n ^ 0x9e3779b9, 2654435761) >>> 0;
  return h % 100 < 40;
}

export function challengeFor(d: Date): string {
  // Stride 4 is coprime with 15, so challenges don't simply follow the doctrine order.
  return CHALLENGES[mod(localDayNumber(d) * 4, CHALLENGES.length)];
}

export function starterFor(d: Date): string {
  return STARTERS[mod(localDayNumber(d), STARTERS.length)];
}

export type HeroContent =
  | { kind: 'doctrine'; doctrine: Doctrine }
  | { kind: 'challenge'; question: string; doctrine: Doctrine };

/**
 * Morning: the doctrine.
 * Evening (automatic): the challenge on challenge-days, otherwise the doctrine.
 * Evening (manual override): always the challenge, since the user asked to see it.
 */
export function heroContent(override: ModeOverride, d: Date): HeroContent {
  const mode = resolveMode(override, d);
  const doctrine = doctrineFor(d);
  if (mode === 'evening' && (override === 'evening' || hasChallengeToday(d))) {
    return { kind: 'challenge', question: challengeFor(d), doctrine };
  }
  return { kind: 'doctrine', doctrine };
}

export function greetingFor(mode: Mode): string {
  return mode === 'morning' ? 'Morning doctrine' : 'Evening';
}
