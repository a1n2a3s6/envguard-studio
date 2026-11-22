import type { AuditIssue, AuditResult, ParsedEnv } from '../types/env';

interface SecretPattern {
  rule: string;
  label: string;
  regex: RegExp;
  suggestion: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    rule: 'secret/openai-key',
    label: 'OpenAI API Key',
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
    suggestion:
      'Revoke this key in the OpenAI dashboard, rotate it immediately, and inject it via your runtime secret manager.',
  },
  {
    rule: 'secret/stripe-live-key',
    label: 'Stripe Live Secret / Restricted Key',
    regex: /\b(?:sk_live_|rk_live_|whsec_)[A-Za-z0-9]{16,}\b/,
    suggestion:
      'Rotate this live Stripe key immediately in Stripe Developers -> API Keys and never commit live keys to local or shared .env files.',
  },
  {
    rule: 'secret/github-token',
    label: 'GitHub Personal Access Token',
    regex: /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{22,}|gh[osu]_[A-Za-z0-9]{20,})\b/,
    suggestion:
      'Revoke this token under GitHub Settings -> Developer Settings -> Personal Access Tokens and generate a scoped replacement.',
  },
  {
    rule: 'secret/aws-access-key',
    label: 'AWS Access Key ID',
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
    suggestion:
      'Deactivate this IAM access key in AWS IAM and prefer short-lived IAM roles or AWS SSO credentials.',
  },
  {
    rule: 'secret/slack-token',
    label: 'Slack Bot / User Token',
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
    suggestion:
      'Regenerate this Slack OAuth token in your Slack App configuration and restrict it to server-side secrets.',
  },
  {
    rule: 'secret/jwt-token',
    label: 'JSON Web Token (JWT)',
    regex: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
    suggestion:
      'Avoid hardcoding static JWTs in environment files; mint short-lived tokens dynamically at runtime.',
  },
  {
    rule: 'secret/db-url-password',
    label: 'Database URL with Embedded Password',
    regex: /\b(?:postgres|postgresql|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?):\/\/[^:\s/]+:[^@\s/]+@[^\s]+/i,
    suggestion:
      'Use a placeholder in committed templates (e.g. postgresql://USER:PASSWORD@HOST:5432/DB) and store live credentials in a vault or platform secret store.',
  },
  {
    rule: 'secret/private-key',
    label: 'RSA / PEM Private Key',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/,
    suggestion:
      'Remove embedded private keys from .env files and mount them as read-only secret files or load via KMS.',
  },
];

const PUBLIC_CLIENT_PREFIXES = ['NEXT_PUBLIC_', 'VITE_', 'REACT_APP_'];

const SENSITIVE_KEY_TOKENS = [
  'SECRET',
  'PRIVATE',
  'PASSWORD',
  'PASSWD',
  'PWD',
  'TOKEN',
  'DB_URL',
  'DATABASE_URL',
  'API_KEY',
  'AUTH_KEY',
  'SIGNING_KEY',
  'WEBHOOK_SECRET',
  'ACCESS_KEY',
  'CONNECTION_STRING',
];

const PROD_URL_KEY_TOKENS = [
  'PROD',
  'PRODUCTION',
  'API_URL',
  'APP_URL',
  'BASE_URL',
  'SITE_URL',
  'WEBHOOK',
  'AUTH_URL',
  'ENDPOINT',
  'PUBLIC_URL',
];

const PLACEHOLDER_VALUE_REGEX =
  /^(?:your_[a-z0-9_]+|<[^>]+>|\$\{[^}]+\}|changeme|replace_me|placeholder|example|dummy|xxx+|user:password)$/i;

export function isSensitiveKeyName(key: string): boolean {
  const upper = key.toUpperCase();
  return SENSITIVE_KEY_TOKENS.some((token) => upper.includes(token));
}

function isLikelyPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  if (PLACEHOLDER_VALUE_REGEX.test(trimmed)) {
    return true;
  }
  if (/YOUR_[A-Z0-9_]+/.test(trimmed)) {
    return true;
  }
  if (/\/\/USER:PASSWORD@/i.test(trimmed)) {
    return true;
  }
  return false;
}

function computeGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

export function auditEnv(parsed: ParsedEnv): AuditResult {
  const issues: AuditIssue[] = [];
  let issueCounter = 0;

  const pushIssue = (
    severity: AuditIssue['severity'],
    line: number,
    key: string,
    rule: string,
    message: string,
    suggestion: string
  ): void => {
    issueCounter += 1;
    issues.push({
      id: `issue-${issueCounter}-${line}-${rule}`,
      severity,
      line,
      key,
      rule,
      message,
      suggestion,
    });
  };

  for (const invalid of parsed.invalidLines) {
    pushIssue(
      'warning',
      invalid.lineNumber,
      '(syntax)',
      'syntax/invalid-line',
      `Malformed assignment on line ${invalid.lineNumber}: "${invalid.raw.trim().slice(0, 48)}"`,
      'Use valid KEY=VALUE syntax or prefix notes with # to make them a comment.'
    );
  }

  for (const entry of parsed.entries) {
    const key = entry.key ?? '';
    const value = entry.value ?? '';
    const upperKey = key.toUpperCase();
    const line = entry.lineNumber;

    // 1. Frontend Exposure Risk (Critical)
    const matchedPrefix = PUBLIC_CLIENT_PREFIXES.find((prefix) =>
      upperKey.startsWith(prefix)
    );
    if (matchedPrefix && isSensitiveKeyName(upperKey)) {
      pushIssue(
        'critical',
        line,
        key,
        'security/client-bundle-exposure',
        `Sensitive variable "${key}" uses the client-exposed prefix "${matchedPrefix}", which bundles this value into public browser JavaScript.`,
        `Remove the "${matchedPrefix}" prefix (rename to "${key.slice(matchedPrefix.length)}") and access it exclusively on the server.`
      );
    }

    // 2. Critical Secret Leak Detection
    if (value.length > 0 && !isLikelyPlaceholder(value)) {
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(value)) {
          pushIssue(
            'critical',
            line,
            key,
            pattern.rule,
            `Detected ${pattern.label} in "${key}". Live credentials inside .env files pose a high leakage risk.`,
            pattern.suggestion
          );
          break;
        }
      }
    }

    // 3. Duplicate Key Shadowing (Warning)
    if (entry.isDuplicate && entry.firstDefinedLine !== undefined) {
      pushIssue(
        'warning',
        line,
        key,
        'bug/duplicate-key',
        `Duplicate key "${key}" overrides its earlier definition on line ${entry.firstDefinedLine}.`,
        `Remove one of the duplicate "${key}" definitions so runtime configuration is unambiguous.`
      );
    }

    // 4. Empty Value (Warning)
    if (value.length === 0) {
      pushIssue(
        'warning',
        line,
        key,
        'bug/empty-value',
        `Key "${key}" is defined with an empty value, which can cause runtime crashes or silent fallbacks.`,
        `Assign an explicit value for "${key}" or document it as optional in your validation schema.`
      );
    }

    // 5. Unquoted Spaces (Warning)
    if (entry.hasUnquotedSpaces) {
      pushIssue(
        'warning',
        line,
        key,
        'syntax/unquoted-spaces',
        `Value for "${key}" contains whitespace without surrounding quotes, which breaks shell sourcing and some dotenv parsers.`,
        `Wrap the value in double quotes: ${key}="${value}"`
      );
    }

    // 6. Insecure HTTP URL in Production-Named Key (Warning)
    const isProdNamedUrl = PROD_URL_KEY_TOKENS.some((token) =>
      upperKey.includes(token)
    );
    if (
      isProdNamedUrl &&
      /^http:\/\//i.test(value) &&
      !/^http:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i.test(value)
    ) {
      pushIssue(
        'warning',
        line,
        key,
        'security/insecure-http-url',
        `Production or API endpoint "${key}" uses unencrypted http:// ("${value.slice(0, 48)}").`,
        `Upgrade "${key}" to https:// to prevent credential interception and mixed-content errors.`
      );
    }

    // 7. Trailing Whitespace (Info)
    if (entry.hasTrailingWhitespace) {
      pushIssue(
        'info',
        line,
        key,
        'style/trailing-whitespace',
        `Line ${line} ("${key}") has trailing whitespace that may be included verbatim by strict parsers.`,
        `Trim trailing spaces at the end of line ${line}.`
      );
    }

    // 8. Lowercase or Non-Standard Key Name (Info)
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      pushIssue(
        'info',
        line,
        key,
        'style/non-standard-key-name',
        `Key "${key}" does not follow standard SCREAMING_SNAKE_CASE naming.`,
        `Rename "${key}" to "${key.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}" for cross-platform shell compatibility.`
      );
    }
  }

  // Sort by severity (critical -> warning -> info) then by line number
  const severityWeight: Record<AuditIssue['severity'], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  issues.sort((a, b) => {
    const diff = severityWeight[a.severity] - severityWeight[b.severity];
    return diff !== 0 ? diff : a.line - b.line;
  });

  const counts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  const penalty = counts.critical * 22 + counts.warning * 7 + counts.info * 2;
  const score = parsed.entryCount === 0 && parsed.invalidLines.length === 0
    ? 100
    : Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    grade: computeGrade(score),
    issues,
    counts,
    scannedKeys: parsed.entryCount,
  };
}
