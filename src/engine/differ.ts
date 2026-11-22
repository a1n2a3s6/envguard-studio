import type { DiffEntry, DiffSummary, ParsedEnv } from '../types/env';
import { isSensitiveKeyName } from './auditor';

export function diffEnvs(localEnv: ParsedEnv, prodEnv: ParsedEnv): DiffSummary {
  const localLineMap = new Map<string, number>();
  const prodLineMap = new Map<string, number>();
  const orderedKeys: string[] = [];
  const seen = new Set<string>();

  for (const entry of localEnv.entries) {
    if (!entry.key) continue;
    localLineMap.set(entry.key, entry.lineNumber);
    if (!seen.has(entry.key)) {
      seen.add(entry.key);
      orderedKeys.push(entry.key);
    }
  }

  for (const entry of prodEnv.entries) {
    if (!entry.key) continue;
    prodLineMap.set(entry.key, entry.lineNumber);
    if (!seen.has(entry.key)) {
      seen.add(entry.key);
      orderedKeys.push(entry.key);
    }
  }

  const entries: DiffEntry[] = [];

  for (const key of orderedKeys) {
    const inLocal = Object.prototype.hasOwnProperty.call(localEnv.map, key);
    const inProd = Object.prototype.hasOwnProperty.call(prodEnv.map, key);
    const localValue = inLocal ? localEnv.map[key] : undefined;
    const prodValue = inProd ? prodEnv.map[key] : undefined;

    let status: DiffEntry['status'];
    if (inLocal && !inProd) {
      status = 'missing_in_prod';
    } else if (!inLocal && inProd) {
      status = 'missing_in_local';
    } else if (localValue !== prodValue) {
      status = 'value_differs';
    } else {
      status = 'identical';
    }

    entries.push({
      key,
      status,
      localValue,
      prodValue,
      localLine: localLineMap.get(key),
      prodLine: prodLineMap.get(key),
      localEmpty: inLocal && (localValue ?? '').trim().length === 0,
      prodEmpty: inProd && (prodValue ?? '').trim().length === 0,
      isSensitive: isSensitiveKeyName(key),
    });
  }

  const counts = {
    all: entries.length,
    missingInProd: entries.filter((e) => e.status === 'missing_in_prod').length,
    missingInLocal: entries.filter((e) => e.status === 'missing_in_local').length,
    valueDiffers: entries.filter((e) => e.status === 'value_differs').length,
    identical: entries.filter((e) => e.status === 'identical').length,
    emptyValues: entries.filter((e) => e.localEmpty || e.prodEmpty).length,
  };

  return { entries, counts };
}

export function buildMissingKeysTemplate(entries: DiffEntry[]): string {
  const missingInProd = entries.filter((e) => e.status === 'missing_in_prod');
  const missingInLocal = entries.filter((e) => e.status === 'missing_in_local');

  const sections: string[] = [];

  if (missingInProd.length > 0) {
    sections.push('# Missing in Secondary (.env.production)');
    for (const item of missingInProd) {
      sections.push(`${item.key}=YOUR_${item.key.toUpperCase()}`);
    }
  }

  if (missingInLocal.length > 0) {
    if (sections.length > 0) sections.push('');
    sections.push('# Missing in Primary (.env.local)');
    for (const item of missingInLocal) {
      sections.push(`${item.key}=YOUR_${item.key.toUpperCase()}`);
    }
  }

  if (sections.length === 0) {
    return '# All keys are aligned across both environments.';
  }

  return sections.join('\n');
}
