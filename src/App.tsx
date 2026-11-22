import { useCallback, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  GitCompareArrows,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { Header } from './components/Header';
import { EnvEditor } from './components/EnvEditor';
import { AuditPanel } from './components/AuditPanel';
import { DiffPanel } from './components/DiffPanel';
import { ExportPanel } from './components/ExportPanel';
import { parseEnv } from './engine/parser';
import { auditEnv } from './engine/auditor';
import { diffEnvs } from './engine/differ';
import { generateAllArtifacts } from './engine/generators';
import type { ToastMessage, WorkspaceTab } from './types/env';

const SAMPLE_LOCAL_ENV = `# Core Runtime Configuration
NODE_ENV=development
PORT=3000
APP_NAME=EnvGuard Studio Local
PROD_API_URL=http://api.acme-studio.io/v1

# Database & Cache
DATABASE_URL=postgresql://admin:Sup3rS3cretPass!@db.internal.acme.io:5432/envguard_dev
REDIS_URL=redis://localhost:6379/0

# Third-Party Services (Mock Demo Values)
VITE_STRIPE_SECRET_KEY=sk_live_51MockDemoStripeKeyForEnvGuard998877
OPENAI_API_KEY=sk-proj-MockDemoOpenAIKeyEnvGuardTest12345678
GITHUB_TOKEN=ghp_MockDemoGitHubTokenEnvGuard1234567890
SUPPORT_EMAIL=ops@acme-studio.io

# Telemetry & Flags
SENTRY_DSN=
ENABLE_ANALYTICS=true
debug_mode=true   
PORT=4000
`;

const SAMPLE_PROD_ENV = `# Core Runtime Configuration
NODE_ENV=production
PORT=8080
APP_NAME="EnvGuard Studio"
PROD_API_URL=https://api.acme-studio.io/v1

# Database & Cache
DATABASE_URL=postgresql://prod_user:YOUR_DB_PASSWORD@prod-db.acme.io:5432/envguard_prod
REDIS_URL=rediss://:YOUR_REDIS_PASSWORD@cache.acme.io:6379/0

# Third-Party Services
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
SUPPORT_EMAIL=ops@acme-studio.io

# Telemetry & Flags
SENTRY_DSN=https://public@o123456.ingest.sentry.io/789012
ENABLE_ANALYTICS=true
`;

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('audit');
  const [primaryEnv, setPrimaryEnv] = useState<string>(SAMPLE_LOCAL_ENV);
  const [secondaryEnv, setSecondaryEnv] = useState<string>(SAMPLE_PROD_ENV);
  const [maskSecrets, setMaskSecrets] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef<number>(0);

  const pushToast = useCallback(
    (message: string, tone: ToastMessage['tone'] = 'success') => {
      toastIdRef.current += 1;
      const id = toastIdRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 2800);
    },
    []
  );

  const parsedPrimary = useMemo(() => parseEnv(primaryEnv), [primaryEnv]);
  const parsedSecondary = useMemo(() => parseEnv(secondaryEnv), [secondaryEnv]);
  const auditResult = useMemo(() => auditEnv(parsedPrimary), [parsedPrimary]);
  const diffSummary = useMemo(
    () => diffEnvs(parsedPrimary, parsedSecondary),
    [parsedPrimary, parsedSecondary]
  );
  const generatedArtifacts = useMemo(
    () => generateAllArtifacts(parsedPrimary),
    [parsedPrimary]
  );

  const criticalLines = useMemo(() => {
    const set = new Set<number>();
    for (const issue of auditResult.issues) {
      if (issue.severity === 'critical') set.add(issue.line);
    }
    return set;
  }, [auditResult.issues]);

  const warningLines = useMemo(() => {
    const set = new Set<number>();
    for (const issue of auditResult.issues) {
      if (issue.severity === 'warning') set.add(issue.line);
    }
    return set;
  }, [auditResult.issues]);

  const handleLoadSample = (): void => {
    setPrimaryEnv(SAMPLE_LOCAL_ENV);
    setSecondaryEnv(SAMPLE_PROD_ENV);
    pushToast('Loaded realistic sample .env.local and .env.production', 'info');
  };

  const handleClearAll = (): void => {
    setPrimaryEnv('');
    setSecondaryEnv('');
    pushToast('Cleared all environment buffers', 'warning');
  };

  const toggleMask = (): void => {
    setMaskSecrets((prev) => {
      const next = !prev;
      pushToast(
        next
          ? 'Secret masking enabled — values blurred for screen-sharing'
          : 'Secret masking disabled — raw editing restored',
        'info'
      );
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header onLoadSample={handleLoadSample} onClearAll={handleClearAll} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Workspace Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <nav
            aria-label="Workspace views"
            className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900/80 p-1"
          >
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition sm:text-sm ${
                activeTab === 'audit'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Security Audit
              {auditResult.counts.critical > 0 && (
                <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-rose-300">
                  {auditResult.counts.critical}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diff')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition sm:text-sm ${
                activeTab === 'diff'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitCompareArrows className="h-4 w-4 text-amber-400" />
              Env Diff
              {diffSummary.counts.missingInProd + diffSummary.counts.missingInLocal > 0 && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  {diffSummary.counts.missingInProd + diffSummary.counts.missingInLocal}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition sm:text-sm ${
                activeTab === 'export'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Code2 className="h-4 w-4 text-emerald-400" />
              Code &amp; Sanitizer
            </button>
          </nav>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
              Score:{' '}
              <strong
                className={
                  auditResult.score >= 85
                    ? 'text-emerald-400'
                    : auditResult.score >= 60
                      ? 'text-amber-400'
                      : 'text-rose-400'
                }
              >
                {auditResult.score}/100
              </strong>
            </span>
            <span className="hidden rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 sm:inline">
              Keys: <strong className="text-zinc-200">{parsedPrimary.entryCount}</strong>
            </span>
          </div>
        </div>

        {/* Tab 1: Security Audit */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <EnvEditor
                title="Primary Environment"
                subtitle=".env.local"
                value={primaryEnv}
                onChange={setPrimaryEnv}
                maskSecrets={maskSecrets}
                onToggleMask={toggleMask}
                criticalLines={criticalLines}
                warningLines={warningLines}
                minHeightClass="h-[540px]"
                onFileLoaded={(name) => pushToast(`Loaded ${name} locally`, 'success')}
              />
            </div>
            <div className="lg:col-span-6">
              <AuditPanel result={auditResult} />
            </div>
          </div>
        )}

        {/* Tab 2: Multi-Environment Diff */}
        {activeTab === 'diff' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <EnvEditor
                title="Primary Environment"
                subtitle=".env.local"
                value={primaryEnv}
                onChange={setPrimaryEnv}
                maskSecrets={maskSecrets}
                onToggleMask={toggleMask}
                criticalLines={criticalLines}
                warningLines={warningLines}
                minHeightClass="h-[280px]"
                onFileLoaded={(name) =>
                  pushToast(`Loaded ${name} into Primary`, 'success')
                }
              />
              <EnvEditor
                title="Secondary Environment"
                subtitle=".env.production"
                value={secondaryEnv}
                onChange={setSecondaryEnv}
                maskSecrets={maskSecrets}
                onToggleMask={toggleMask}
                minHeightClass="h-[280px]"
                placeholder="# Paste your .env.production or .env.example to compare..."
                onFileLoaded={(name) =>
                  pushToast(`Loaded ${name} into Secondary`, 'success')
                }
              />
            </div>
            <DiffPanel
              diff={diffSummary}
              maskSecrets={maskSecrets}
              onCopySuccess={(msg) => pushToast(msg, 'success')}
            />
          </div>
        )}

        {/* Tab 3: Code & Sanitizer */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <EnvEditor
                title="Source Environment"
                subtitle=".env.local"
                value={primaryEnv}
                onChange={setPrimaryEnv}
                maskSecrets={maskSecrets}
                onToggleMask={toggleMask}
                criticalLines={criticalLines}
                warningLines={warningLines}
                minHeightClass="h-[520px]"
                onFileLoaded={(name) => pushToast(`Loaded ${name} locally`, 'success')}
              />
            </div>
            <div className="lg:col-span-7">
              <ExportPanel
                artifacts={generatedArtifacts}
                onNotify={(msg) => pushToast(msg, 'success')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Toast Stack */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-medium shadow-xl backdrop-blur-md ${
              toast.tone === 'success'
                ? 'border-emerald-500/40 bg-zinc-900/95 text-emerald-200'
                : toast.tone === 'warning'
                  ? 'border-amber-500/40 bg-zinc-900/95 text-amber-200'
                  : 'border-sky-500/40 bg-zinc-900/95 text-sky-200'
            }`}
          >
            {toast.tone === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : toast.tone === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            ) : (
              <Info className="h-4 w-4 text-sky-400" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
