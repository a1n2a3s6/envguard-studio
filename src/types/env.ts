export type EnvLineType = 'entry' | 'comment' | 'blank' | 'invalid';

export type QuoteType = 'single' | 'double' | 'none';

export interface EnvLine {
  lineNumber: number;
  raw: string;
  type: EnvLineType;
  key?: string;
  value?: string;
  rawValue?: string;
  quoteType?: QuoteType;
  hasExportPrefix?: boolean;
  inlineComment?: string;
  hasTrailingWhitespace?: boolean;
  hasUnquotedSpaces?: boolean;
  isDuplicate?: boolean;
  firstDefinedLine?: number;
}

export interface DuplicateKeyRecord {
  key: string;
  lines: number[];
}

export interface ParsedEnv {
  lines: EnvLine[];
  entries: EnvLine[];
  map: Record<string, string>;
  duplicates: DuplicateKeyRecord[];
  invalidLines: EnvLine[];
  totalLines: number;
  entryCount: number;
}

export type AuditSeverity = 'critical' | 'warning' | 'info';

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  line: number;
  key: string;
  rule: string;
  message: string;
  suggestion: string;
}

export interface AuditResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: AuditIssue[];
  counts: {
    critical: number;
    warning: number;
    info: number;
  };
  scannedKeys: number;
}

export type DiffStatus =
  | 'missing_in_prod'
  | 'missing_in_local'
  | 'value_differs'
  | 'identical';

export interface DiffEntry {
  key: string;
  status: DiffStatus;
  localValue?: string;
  prodValue?: string;
  localLine?: number;
  prodLine?: number;
  localEmpty: boolean;
  prodEmpty: boolean;
  isSensitive: boolean;
}

export interface DiffSummary {
  entries: DiffEntry[];
  counts: {
    all: number;
    missingInProd: number;
    missingInLocal: number;
    valueDiffers: number;
    identical: number;
    emptyValues: number;
  };
}

export type InferredType =
  | 'url'
  | 'email'
  | 'port'
  | 'number'
  | 'boolean'
  | 'secret'
  | 'string';

export interface GeneratedArtifacts {
  envExample: string;
  zodSchema: string;
  tsTypes: string;
  dockerCompose: string;
}

export type WorkspaceTab = 'audit' | 'diff' | 'export';

export type ExportTab = 'envExample' | 'zodSchema' | 'tsTypes' | 'dockerCompose';

export type DiffFilter =
  | 'all'
  | 'missing_in_prod'
  | 'missing_in_local'
  | 'value_differs';

export interface ToastMessage {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'warning';
}
