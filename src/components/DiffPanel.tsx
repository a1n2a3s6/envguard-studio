import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  GitCompareArrows,
  MinusCircle,
  PlusCircle,
} from 'lucide-react';
import type { DiffEntry, DiffFilter, DiffSummary } from '../types/env';
import { buildMissingKeysTemplate } from '../engine/differ';

interface DiffPanelProps {
  diff: DiffSummary;
  maskSecrets: boolean;
  onCopySuccess: (message: string) => void;
}

function StatusBadge({ status }: { status: DiffEntry['status'] }) {
  switch (status) {
    case 'missing_in_prod':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-medium text-rose-300">
          <MinusCircle className="h-3 w-3" />
          Missing in Prod
        </span>
      );
    case 'missing_in_local':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-medium text-sky-300">
          <PlusCircle className="h-3 w-3" />
          Missing in Local
        </span>
      );
    case 'value_differs':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
          <GitCompareArrows className="h-3 w-3" />
          Changed
        </span>
      );
    case 'identical':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          Identical
        </span>
      );
  }
}

export function DiffPanel({ diff, maskSecrets, onCopySuccess }: DiffPanelProps) {
  const [activeFilter, setActiveFilter] = useState<DiffFilter>('all');
  const [copied, setCopied] = useState(false);

  const filteredEntries =
    activeFilter === 'all'
      ? diff.entries
      : diff.entries.filter((entry) => entry.status === activeFilter);

  const missingTotal = diff.counts.missingInProd + diff.counts.missingInLocal;

  const handleCopyMissing = async (): Promise<void> => {
    const template = buildMissingKeysTemplate(diff.entries);
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      onCopySuccess('Copied missing keys template to clipboard');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onCopySuccess('Clipboard permission denied — select text manually');
    }
  };

  const filterTabs: Array<{ id: DiffFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: diff.counts.all },
    { id: 'missing_in_prod', label: 'Missing in Prod', count: diff.counts.missingInProd },
    { id: 'missing_in_local', label: 'Missing in Local', count: diff.counts.missingInLocal },
    { id: 'value_differs', label: 'Changed', count: diff.counts.valueDiffers },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
      {/* Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/90 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive ? 'bg-zinc-950 text-zinc-200' : 'bg-zinc-800/80 text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void handleCopyMissing()}
          disabled={missingTotal === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Copied Template
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-emerald-400" />
              Copy Missing Keys Template ({missingTotal})
            </>
          )}
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        {filteredEntries.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm font-medium text-zinc-200">
              No keys match this filter
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Both environments are aligned for the selected category.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Primary (.env.local)</th>
                <th className="px-4 py-2.5">Secondary (.env.production)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 font-mono text-xs">
              {filteredEntries.map((entry) => (
                <tr key={entry.key} className="transition hover:bg-zinc-800/30">
                  <td className="px-4 py-3 align-top font-semibold text-zinc-100">
                    <div className="flex items-center gap-2">
                      <span>{entry.key}</span>
                      {(entry.localEmpty || entry.prodEmpty) && (
                        <span
                          className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-sans text-[10px] font-medium text-amber-300"
                          title="Empty value detected in at least one environment"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Empty
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top font-sans">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="max-w-xs break-all px-4 py-3 align-top text-zinc-300">
                    {entry.localValue === undefined ? (
                      <span className="font-sans italic text-zinc-600">— missing —</span>
                    ) : entry.localEmpty ? (
                      <span className="font-sans italic text-amber-400/90">(empty)</span>
                    ) : (
                      <span className={maskSecrets ? 'masked-value' : ''}>
                        {entry.localValue}
                      </span>
                    )}
                  </td>
                  <td className="max-w-xs break-all px-4 py-3 align-top text-zinc-300">
                    {entry.prodValue === undefined ? (
                      <span className="font-sans italic text-zinc-600">— missing —</span>
                    ) : entry.prodEmpty ? (
                      <span className="font-sans italic text-amber-400/90">(empty)</span>
                    ) : (
                      <span className={maskSecrets ? 'masked-value' : ''}>
                        {entry.prodValue}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
