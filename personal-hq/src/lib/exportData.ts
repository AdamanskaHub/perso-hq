import type { AppData } from '../types';
import { buildExport } from '../storage/validate';
import { localDateKey } from './util';

export function downloadText(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFilename(): string {
  return `personal-hq-${localDateKey()}.json`;
}

/** Downloads a complete export, trophy images included. Returns the ISO export time. */
export function exportAll(data: AppData): string {
  const file = buildExport(data);
  downloadText(exportFilename(), JSON.stringify(file, null, 2));
  return file.exportedAt;
}
