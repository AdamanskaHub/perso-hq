import type { ReactNode } from 'react';
import { IconExternal } from './Icons';

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
  /** Show the small "opens in new tab" icon. */
  icon?: boolean;
}

/** External link that opens in a new tab without leaking the referrer. */
export function ExtLink({ href, children, className, icon = true }: Props) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      {icon && <IconExternal />}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Jumps to the links form in the Data & settings panel. */
export function focusSettingsLink(id: 'kanbanUrl' | 'timerUrl') {
  const el = document.getElementById(`setting-${id}`) as HTMLInputElement | null;
  document.getElementById('settings')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  window.setTimeout(() => el?.focus(), 250);
}
