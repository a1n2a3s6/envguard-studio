import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import type { AuditResult, AuditSeverity } from '../types/env';

interface AuditPanelProps {
  result: AuditResult;
}

type SeverityFilter = 'all' | AuditSeverity;

function getScorePalette(score: number): {
  stroke: string;
  text: string;
  badge: string;
  label: string;
} {
  if (score >= 85) {
    return {
      stroke: '#10b981',
      text: 'text-emerald-400',
      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      label: 'Healthy',
    };
  }
  if (score >= 60) {
    return {
      stroke: '#f59e0b',
      text: 'text-amber-400',
      badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      label: 'Needs Attention',
    };
  }
  return {
    stroke: '#f43f5e',
    text: 'text-rose-400',
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    label: 'High Risk',
  };
}

export function AuditPanel({ result }: AuditPanelProps) {
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.score / 100) * circumference;
  const palette = getScorePalette(result.score);

  const visibleIssues =
    filter === 'all'
      ? result.issues
      : result.issues.filter((issue) => issue.severity === filter);

  return (
    <div className="flex flex-col gap-4">
      {/* Score Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-28 w-28 shrink-0">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 104 104">
                <circle
                  cx="52"
                  cy="52"
                  r={radius}
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="8"
                />
                <circle
                  cx="52"
                  cy="52"
                  r={radius}
                  fill="none"
                  stroke={palette.stroke}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold tracking-tight ${palette.text}`}>
                  {result.score}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Grade {result.grade}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100">
                  Health &amp; Security Score
                </h2>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${palette.badge}`}
                >
                  {palette.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                Scanned{' '}
                <span className="font-mono font-medium text-zinc-200">
                  {result.scannedKeys}
                </span>{' '}
                environment {result.scannedKeys === 1 ? 'entry' : 'entries'} across secret
                signatures, client-bundle rules, and dotenv lint checks.
              </p>
            </div>
          </div>
        </div>

        {/* Severity Filter Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-4">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === 'all'
                ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            All Issues
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[11px] text-zinc-300">
              {result.issues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('critical')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === 'critical'
                ? 'border-rose-500/60 bg-rose-500/20 text-rose-200'
                : 'border-rose-500/25 bg-rose-500/10 text-rose-300 hover:border-rose-500/40'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Critical
            <span className="rounded-full bg-rose-500/20 px-1.5 text-[11px]">
              {result.counts.critical}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('warning')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === 'warning'
                ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
                : 'border-amber-500/25 bg-amber-500/10 text-amber-300 hover:border-amber-500/40'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Warning
            <span className="rounded-full bg-amber-500/20 px-1.5 text-[11px]">
              {result.counts.warning}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('info')}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
              filter === 'info'
                ? 'border-sky-500/60 bg-sky-500/20 text-sky-200'
                : 'border-sky-500/25 bg-sky-500/10 text-sky-300 hover:border-sky-500/40'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            Info
            <span className="rounded-full bg-sky-500/20 px-1.5 text-[11px]">
              {result.counts.info}
            </span>
          </button>
        </div>
      </div>

      {/* Issue Cards */}
      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {visibleIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-10 text-center">
            {result.issues.length === 0 ? (
              <>
                <ShieldCheck className="mb-2.5 h-9 w-9 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-200">
                  No security or syntax issues detected
                </p>
                <p className="mt-1 max-w-sm text-xs text-zinc-400">
                  {result.scannedKeys === 0
                    ? 'Paste a .env file or click "Load Realistic Sample .env" to run a full security scan.'
                    : 'All scanned keys passed secret pattern checks, frontend exposure rules, and syntax validation.'}
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium text-zinc-200">
                  No {filter} issues found
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Switch to &quot;All Issues&quot; to view other severities.
                </p>
              </>
            )}
          </div>
        ) : (
          visibleIssues.map((issue) => {
            const isCritical = issue.severity === 'critical';
            const isWarning = issue.severity === 'warning';

            const cardBorder = isCritical
              ? 'border-rose-500/30 bg-rose-950/15'
              : isWarning
                ? 'border-amber-500/30 bg-amber-950/15'
                : 'border-sky-500/25 bg-sky-950/10';

            const badgeStyle = isCritical
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              : isWarning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-sky-500/20 text-sky-300 border-sky-500/30';

            return (
              <div
                key={issue.id}
                className={`rounded-xl border p-4 transition hover:border-zinc-700 ${cardBorder}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeStyle}`}
                    >
                      {isCritical ? (
                        <ShieldAlert className="h-3 w-3" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Info className="h-3 w-3" />
                      )}
                      {issue.severity}
                    </span>
                    <span className="rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-100">
                      {issue.key}
                    </span>
                    <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                      Line {issue.line}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {issue.rule}
                  </span>
                </div>

                <p className="mt-2.5 text-xs leading-relaxed text-zinc-200">
                  {issue.message}
                </p>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-300">
                  <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span>{issue.suggestion}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
