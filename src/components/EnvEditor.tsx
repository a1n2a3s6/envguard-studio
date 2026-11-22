import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Eye, EyeOff, FileCode2, Upload } from 'lucide-react';

interface EnvEditorProps {
  title: string;
  subtitle?: string;
  value: string;
  onChange: (nextValue: string) => void;
  maskSecrets: boolean;
  onToggleMask: () => void;
  placeholder?: string;
  criticalLines?: Set<number>;
  warningLines?: Set<number>;
  minHeightClass?: string;
  onFileLoaded?: (filename: string) => void;
}

function renderMaskedLine(rawLine: string): {
  prefix: string;
  keyPart: string;
  eqPart: string;
  valuePart: string;
  isEntry: boolean;
} {
  const trimmed = rawLine.trim();
  if (trimmed.length === 0 || trimmed.startsWith('#')) {
    return {
      prefix: '',
      keyPart: rawLine,
      eqPart: '',
      valuePart: '',
      isEntry: false,
    };
  }

  const eqIdx = rawLine.indexOf('=');
  if (eqIdx <= 0) {
    return {
      prefix: '',
      keyPart: rawLine,
      eqPart: '',
      valuePart: '',
      isEntry: false,
    };
  }

  return {
    prefix: '',
    keyPart: rawLine.slice(0, eqIdx),
    eqPart: '=',
    valuePart: rawLine.slice(eqIdx + 1),
    isEntry: true,
  };
}

export function EnvEditor({
  title,
  subtitle,
  value,
  onChange,
  maskSecrets,
  onToggleMask,
  placeholder = '# Paste your .env content here or drag & drop a .env file...',
  criticalLines,
  warningLines,
  minHeightClass = 'h-[480px]',
  onFileLoaded,
}: EnvEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const lines = value.length === 0 ? [''] : value.replace(/\r\n/g, '\n').split('\n');
  const nonEmptyEntryCount = lines.filter((line) => {
    const t = line.trim();
    return t.length > 0 && !t.startsWith('#') && t.includes('=');
  }).length;

  const handleReadFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = typeof event.target?.result === 'string' ? event.target.result : '';
      onChange(text);
      if (onFileLoaded) {
        onFileLoaded(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      handleReadFile(file);
      event.target.value = '';
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleReadFile(file);
    }
  };

  const handleScroll = (): void => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col overflow-hidden rounded-xl border transition ${
        isDragging
          ? 'border-emerald-400 bg-emerald-950/20 ring-2 ring-emerald-500/30'
          : 'border-zinc-800 bg-zinc-900/70'
      }`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-zinc-100">{title}</span>
          {subtitle && (
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMask}
            aria-pressed={maskSecrets}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              maskSecrets
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/20'
                : 'border-zinc-700/80 bg-zinc-800/80 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
            }`}
            title="Blur secret values for safe screen-sharing"
          >
            {maskSecrets ? (
              <>
                <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                Secrets Masked
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-zinc-400" />
                Mask Secrets
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-200"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".env,.env.*,text/plain"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Editor Surface */}
      <div className={`relative flex w-full overflow-hidden bg-zinc-950/90 ${minHeightClass}`}>
        {maskSecrets ? (
          <div className="flex-1 overflow-auto font-mono text-[13px] leading-6">
            {lines.map((rawLine, idx) => {
              const lineNum = idx + 1;
              const isCritical = criticalLines?.has(lineNum) ?? false;
              const isWarning = !isCritical && (warningLines?.has(lineNum) ?? false);
              const parsed = renderMaskedLine(rawLine);

              return (
                <div
                  key={lineNum}
                  className={`flex min-h-[1.5rem] px-2 ${
                    isCritical
                      ? 'bg-rose-500/10'
                      : isWarning
                        ? 'bg-amber-500/10'
                        : 'hover:bg-zinc-900/60'
                  }`}
                >
                  <span
                    className={`w-10 shrink-0 select-none pr-3 text-right text-xs leading-6 ${
                      isCritical
                        ? 'font-semibold text-rose-400'
                        : isWarning
                          ? 'font-semibold text-amber-400'
                          : 'text-zinc-600'
                    }`}
                  >
                    {lineNum}
                  </span>
                  <div className="whitespace-pre break-all">
                    {parsed.isEntry ? (
                      <>
                        <span className="text-sky-300">{parsed.keyPart}</span>
                        <span className="text-zinc-500">{parsed.eqPart}</span>
                        <span className="masked-value text-emerald-300">
                          {parsed.valuePart}
                        </span>
                      </>
                    ) : (
                      <span className="text-zinc-500">{parsed.keyPart}</span>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="sticky bottom-2 right-2 mx-3 my-2 flex justify-end">
              <button
                type="button"
                onClick={onToggleMask}
                className="rounded-md border border-zinc-700 bg-zinc-900/95 px-2.5 py-1 font-sans text-[11px] font-medium text-zinc-300 shadow-lg transition hover:border-emerald-500/40 hover:text-emerald-200"
              >
                Unmask to edit raw text
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={gutterRef}
              aria-hidden="true"
              className="w-12 shrink-0 select-none overflow-hidden border-r border-zinc-800/80 bg-zinc-950 py-3 pr-3 text-right font-mono text-xs leading-6"
            >
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isCritical = criticalLines?.has(lineNum) ?? false;
                const isWarning = !isCritical && (warningLines?.has(lineNum) ?? false);
                return (
                  <div
                    key={lineNum}
                    className={
                      isCritical
                        ? 'font-semibold text-rose-400'
                        : isWarning
                          ? 'font-semibold text-amber-400'
                          : 'text-zinc-600'
                    }
                  >
                    {lineNum}
                  </div>
                );
              })}
            </div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onScroll={handleScroll}
              placeholder={placeholder}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[13px] leading-6 text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
          </>
        )}

        {isDragging && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-sm">
            <Upload className="mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm font-medium text-emerald-200">
              Drop your .env file to load locally
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Processed strictly in browser memory — never uploaded
            </p>
          </div>
        )}
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/60 px-4 py-1.5 text-[11px] text-zinc-400">
        <span>
          {lines.length} {lines.length === 1 ? 'line' : 'lines'} · {nonEmptyEntryCount}{' '}
          {nonEmptyEntryCount === 1 ? 'variable' : 'variables'}
        </span>
        <span>Drag &amp; drop a .env file or paste directly</span>
      </div>
    </div>
  );
}
