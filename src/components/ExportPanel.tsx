import { useState } from 'react';
import {
  Check,
  Container,
  Copy,
  Download,
  FileCode,
  FileKey2,
  Shield,
} from 'lucide-react';
import type { ExportTab, GeneratedArtifacts } from '../types/env';

interface ExportPanelProps {
  artifacts: GeneratedArtifacts;
  onNotify: (message: string) => void;
}

interface ExportTabMeta {
  id: ExportTab;
  label: string;
  filename: string;
  description: string;
}

const EXPORT_TABS: ExportTabMeta[] = [
  {
    id: 'envExample',
    label: '.env.example',
    filename: '.env.example',
    description: 'Safe sanitized template with comments & safe defaults preserved',
  },
  {
    id: 'zodSchema',
    label: 'Zod env.ts',
    filename: 'env.ts',
    description: 'Runtime validation schema with inferred URL, port, number & enum types',
  },
  {
    id: 'tsTypes',
    label: 'TypeScript env.d.ts',
    filename: 'env.d.ts',
    description: 'Global NodeJS.ProcessEnv and Vite ImportMetaEnv declarations',
  },
  {
    id: 'dockerCompose',
    label: 'Docker Compose',
    filename: 'docker-compose.env.yml',
    description: 'Zero-hardcoding environment block mapping host variables via ${KEY}',
  },
];

function renderTabIcon(id: ExportTab) {
  switch (id) {
    case 'envExample':
      return <FileKey2 className="h-3.5 w-3.5" />;
    case 'zodSchema':
      return <Shield className="h-3.5 w-3.5" />;
    case 'tsTypes':
      return <FileCode className="h-3.5 w-3.5" />;
    case 'dockerCompose':
      return <Container className="h-3.5 w-3.5" />;
  }
}

function getLineColorClass(line: string, tab: ExportTab): string {
  const trimmed = line.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return 'text-zinc-500';
  }
  if (tab === 'envExample') {
    return 'text-emerald-200';
  }
  if (tab === 'dockerCompose') {
    if (trimmed.startsWith('- ')) return 'text-emerald-300';
    return 'text-sky-300';
  }
  if (
    trimmed.startsWith('import ') ||
    trimmed.startsWith('export ') ||
    trimmed.startsWith('declare ') ||
    trimmed.startsWith('interface ')
  ) {
    return 'text-sky-300';
  }
  return 'text-zinc-200';
}

export function ExportPanel({ artifacts, onNotify }: ExportPanelProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>('envExample');
  const [copied, setCopied] = useState(false);

  const currentMeta =
    EXPORT_TABS.find((tab) => tab.id === activeTab) ?? EXPORT_TABS[0];
  const content = artifacts[activeTab];
  const lines = content.split('\n');

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onNotify(`Copied ${currentMeta.filename} to clipboard`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onNotify('Clipboard access blocked — copy directly from preview');
    }
  };

  const handleDownload = (): void => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentMeta.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify(`Downloaded ${currentMeta.filename}`);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {EXPORT_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCopied(false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
                }`}
              >
                {renderTabIcon(tab.id)}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-emerald-500/40 hover:text-emerald-200"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/25"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            Download
          </button>
        </div>
      </div>

      {/* Subheader */}
      <div className="flex items-center justify-between border-b border-zinc-800/70 bg-zinc-950/60 px-4 py-2 text-xs">
        <span className="font-mono text-zinc-300">{currentMeta.filename}</span>
        <span className="hidden text-zinc-500 sm:inline">{currentMeta.description}</span>
      </div>

      {/* Code Preview */}
      <div className="h-[440px] overflow-auto bg-zinc-950/95 py-3 font-mono text-[13px] leading-6">
        {lines.map((line, index) => (
          <div key={index} className="flex px-3 hover:bg-zinc-900/60">
            <span className="w-9 shrink-0 select-none pr-3 text-right text-xs text-zinc-600">
              {index + 1}
            </span>
            <span className={`whitespace-pre ${getLineColorClass(line, activeTab)}`}>
              {line.length > 0 ? line : ' '}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
