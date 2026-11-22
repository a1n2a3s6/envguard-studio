import { Lock, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  onClearAll: () => void;
}

export function Header({ onLoadSample, onClearAll }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-950/40">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">
                EnvGuard Studio
              </h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Lock className="h-3 w-3" />
                100% Local · Zero Network Calls
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Client-side .env secrets auditor, multi-env diff checker &amp; schema generator
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 sm:hidden">
            <Lock className="h-3 w-3" />
            100% Local · Zero Network
          </span>

          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Load Realistic Sample .env
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </button>
        </div>
      </div>
    </header>
  );
}
