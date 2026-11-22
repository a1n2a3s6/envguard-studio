import type { GeneratedArtifacts, InferredType, ParsedEnv } from '../types/env';
import { isSensitiveKeyName } from './auditor';

const SAFE_DEFAULT_KEYS = new Set([
  'NODE_ENV',
  'PORT',
  'HOST',
  'LOG_LEVEL',
  'TZ',
  'APP_ENV',
  'ENVIRONMENT',
  'DEBUG',
  'ENABLE_METRICS',
  'ENABLE_ANALYTICS',
  'MAX_RETRIES',
  'TIMEOUT_MS',
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^(?:https?|postgres|postgresql|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?|wss?):\/\/\S+$/i;
const BOOLEAN_REGEX = /^(?:true|false|yes|no|on|off)$/i;
const NUMERIC_REGEX = /^-?\d+(?:\.\d+)?$/;

export function inferType(key: string, value: string): InferredType {
  const upperKey = key.toUpperCase();
  const trimmed = value.trim();

  if (
    upperKey === 'PORT' ||
    upperKey.endsWith('_PORT') ||
    (upperKey.includes('PORT') && /^\d{2,5}$/.test(trimmed))
  ) {
    return 'port';
  }

  if (
    URL_REGEX.test(trimmed) ||
    upperKey.endsWith('_URL') ||
    upperKey.endsWith('_URI') ||
    upperKey.endsWith('_ENDPOINT')
  ) {
    return 'url';
  }

  if (
    EMAIL_REGEX.test(trimmed) ||
    upperKey.endsWith('_EMAIL') ||
    upperKey.includes('MAIL_FROM')
  ) {
    return 'email';
  }

  if (
    isSensitiveKeyName(upperKey) ||
    /^(?:sk-|sk_live_|rk_live_|whsec_|ghp_|github_pat_|AKIA|ASIA|xox[baprs]-|eyJ)/.test(
      trimmed
    ) ||
    /PRIVATE KEY-----/.test(trimmed)
  ) {
    return 'secret';
  }

  if (
    BOOLEAN_REGEX.test(trimmed) ||
    upperKey.startsWith('ENABLE_') ||
    upperKey.startsWith('IS_') ||
    upperKey.startsWith('USE_') ||
    upperKey === 'DEBUG'
  ) {
    return 'boolean';
  }

  if (
    NUMERIC_REGEX.test(trimmed) &&
    !upperKey.includes('ID') &&
    !upperKey.includes('KEY') &&
    !upperKey.includes('TOKEN')
  ) {
    return 'number';
  }

  return 'string';
}

function sanitizeValueForExample(key: string, value: string): string {
  const upperKey = key.toUpperCase();
  const trimmed = value.trim();
  const inferred = inferType(key, trimmed);

  if (trimmed.length === 0) {
    return '';
  }

  // Keep safe non-secret defaults
  if (
    (SAFE_DEFAULT_KEYS.has(upperKey) || inferred === 'port' || inferred === 'boolean') &&
    !isSensitiveKeyName(upperKey)
  ) {
    return trimmed;
  }

  // Keep clean localhost URLs that do not contain embedded credentials
  if (
    inferred === 'url' &&
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/\S*)?$/i.test(trimmed) &&
    !trimmed.includes('@')
  ) {
    return trimmed;
  }

  if (inferred === 'url') {
    const dbMatch = trimmed.match(
      /^(postgres|postgresql|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?):\/\//i
    );
    if (dbMatch) {
      const protocol = dbMatch[1].toLowerCase();
      if (protocol.startsWith('redis')) {
        return `${protocol}://:YOUR_REDIS_PASSWORD@localhost:6379/0`;
      }
      if (protocol.startsWith('mongo')) {
        return `${protocol}://USER:PASSWORD@HOST/DB_NAME?retryWrites=true&w=majority`;
      }
      if (protocol.startsWith('mysql') || protocol.startsWith('mariadb')) {
        return `${protocol}://USER:PASSWORD@HOST:3306/DB_NAME`;
      }
      return `${protocol}://USER:PASSWORD@HOST:5432/DB_NAME`;
    }
    return `https://your-${upperKey.toLowerCase().replace(/_/g, '-')}.example.com`;
  }

  if (inferred === 'email') {
    return 'you@example.com';
  }

  if (inferred === 'number') {
    return trimmed;
  }

  if (inferred === 'secret') {
    return `YOUR_${upperKey.replace(/[^A-Z0-9_]/g, '_')}`;
  }

  if (/\s/.test(trimmed)) {
    return `"YOUR_${upperKey.replace(/[^A-Z0-9_]/g, '_')}"`;
  }

  return `YOUR_${upperKey.replace(/[^A-Z0-9_]/g, '_')}`;
}

export function generateEnvExample(parsed: ParsedEnv): string {
  if (parsed.lines.length === 0) {
    return '# Paste or upload a .env file to generate a safe .env.example\n';
  }

  const seenKeys = new Set<string>();
  const outputLines: string[] = [];

  for (const line of parsed.lines) {
    if (line.type === 'blank') {
      outputLines.push('');
      continue;
    }

    if (line.type === 'comment') {
      outputLines.push(line.raw);
      continue;
    }

    if (line.type === 'invalid') {
      outputLines.push(`# [Skipped invalid line ${line.lineNumber}] ${line.raw.trim()}`);
      continue;
    }

    const key = line.key ?? '';
    if (seenKeys.has(key)) {
      // Omit duplicate shadow entries from sanitized template
      continue;
    }
    seenKeys.add(key);

    const sanitized = sanitizeValueForExample(key, line.value ?? '');
    const prefix = line.hasExportPrefix ? 'export ' : '';
    const commentSuffix = line.inlineComment ? ` ${line.inlineComment}` : '';
    outputLines.push(`${prefix}${key}=${sanitized}${commentSuffix}`);
  }

  return `${outputLines.join('\n')}\n`;
}

function getUniqueEntries(parsed: ParsedEnv): Array<{ key: string; value: string; type: InferredType }> {
  const uniqueKeys: string[] = [];
  const seen = new Set<string>();

  for (const entry of parsed.entries) {
    if (!entry.key || seen.has(entry.key)) continue;
    seen.add(entry.key);
    uniqueKeys.push(entry.key);
  }

  return uniqueKeys.map((key) => {
    const value = parsed.map[key] ?? '';
    return {
      key,
      value,
      type: inferType(key, value),
    };
  });
}

function zodFieldExpression(key: string, value: string, type: InferredType): string {
  const upperKey = key.toUpperCase();
  const isEmpty = value.trim().length === 0;

  if (upperKey === 'NODE_ENV') {
    return "z.enum(['development', 'production', 'test']).default('development')";
  }

  let expr: string;
  switch (type) {
    case 'url':
      expr = 'z.string().url()';
      break;
    case 'email':
      expr = 'z.string().email()';
      break;
    case 'port':
      expr = 'z.coerce.number().int().min(1).max(65535)';
      break;
    case 'number':
      expr = 'z.coerce.number()';
      break;
    case 'boolean':
      expr = "z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1')";
      break;
    case 'secret':
      expr = `z.string().min(1, '${key} is required')`;
      break;
    case 'string':
    default:
      expr = 'z.string().min(1)';
      break;
  }

  if (isEmpty) {
    return `${expr}.optional()`;
  }
  return expr;
}

export function generateZodSchema(parsed: ParsedEnv): string {
  const items = getUniqueEntries(parsed);

  if (items.length === 0) {
    return [
      "import { z } from 'zod';",
      '',
      'export const envSchema = z.object({});',
      '',
      'export type Env = z.infer<typeof envSchema>;',
      'export const env = envSchema.parse(process.env);',
      '',
    ].join('\n');
  }

  const fieldLines = items.map(
    ({ key, value, type }) => `  ${key}: ${zodFieldExpression(key, value, type)},`
  );

  return [
    "import { z } from 'zod';",
    '',
    'export const envSchema = z.object({',
    ...fieldLines,
    '});',
    '',
    'export type Env = z.infer<typeof envSchema>;',
    '',
    'export const env: Env = envSchema.parse(process.env);',
    '',
  ].join('\n');
}

export function generateTsTypes(parsed: ParsedEnv): string {
  const items = getUniqueEntries(parsed);
  const clientItems = items.filter(({ key }) =>
    /^(?:VITE_|NEXT_PUBLIC_|REACT_APP_)/.test(key)
  );

  const nodeFields =
    items.length > 0
      ? items.map(({ key, value }) => {
          const isOptional = value.trim().length === 0 ? '?' : '';
          if (key === 'NODE_ENV') {
            return `    readonly NODE_ENV: 'development' | 'production' | 'test';`;
          }
          return `    readonly ${key}${isOptional}: string;`;
        })
      : ['    // Add environment variables to populate ProcessEnv'];

  const importMetaFields =
    clientItems.length > 0
      ? clientItems.map(({ key, value }) => {
          const isOptional = value.trim().length === 0 ? '?' : '';
          return `  readonly ${key}${isOptional}: string;`;
        })
      : ['  // No VITE_ / NEXT_PUBLIC_ / REACT_APP_ client keys detected'];

  return [
    '/// <reference types="vite/client" />',
    '',
    'declare namespace NodeJS {',
    '  interface ProcessEnv {',
    ...nodeFields,
    '  }',
    '}',
    '',
    'interface ImportMetaEnv {',
    ...importMetaFields,
    '}',
    '',
    'interface ImportMeta {',
    '  readonly env: ImportMetaEnv;',
    '}',
    '',
  ].join('\n');
}

export function generateDockerCompose(parsed: ParsedEnv): string {
  const items = getUniqueEntries(parsed);

  const envLines =
    items.length > 0
      ? items.map(({ key }) => `      - ${key}=\${${key}}`)
      : ['      # Add keys to generate environment mappings'];

  return [
    '# Generated by EnvGuard Studio (100% client-side)',
    '# Pass host or CI secrets without hardcoding values in docker-compose.yml',
    'services:',
    '  app:',
    '    environment:',
    ...envLines,
    '',
  ].join('\n');
}

export function generateAllArtifacts(parsed: ParsedEnv): GeneratedArtifacts {
  return {
    envExample: generateEnvExample(parsed),
    zodSchema: generateZodSchema(parsed),
    tsTypes: generateTsTypes(parsed),
    dockerCompose: generateDockerCompose(parsed),
  };
}
