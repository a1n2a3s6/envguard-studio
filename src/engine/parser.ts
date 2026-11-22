import type { DuplicateKeyRecord, EnvLine, ParsedEnv, QuoteType } from '../types/env';

interface ParsedValueResult {
  value: string;
  rawValue: string;
  quoteType: QuoteType;
  inlineComment?: string;
  hasTrailingWhitespace: boolean;
  hasUnquotedSpaces: boolean;
}

function parseQuotedValue(
  rawSegment: string,
  quoteChar: '"' | "'"
): ParsedValueResult {
  const quoteType: QuoteType = quoteChar === '"' ? 'double' : 'single';
  let value = '';
  let closingIndex = -1;

  for (let i = 1; i < rawSegment.length; i += 1) {
    const ch = rawSegment[i];
    if (quoteChar === '"' && ch === '\\' && i + 1 < rawSegment.length) {
      const next = rawSegment[i + 1];
      if (next === 'n') {
        value += '\n';
      } else if (next === 'r') {
        value += '\r';
      } else if (next === 't') {
        value += '\t';
      } else {
        value += next;
      }
      i += 1;
      continue;
    }

    if (ch === quoteChar) {
      closingIndex = i;
      break;
    }
    value += ch;
  }

  let inlineComment: string | undefined;
  let hasTrailingWhitespace = false;

  if (closingIndex !== -1) {
    const afterQuote = rawSegment.slice(closingIndex + 1);
    const commentIdx = afterQuote.indexOf('#');
    if (commentIdx !== -1) {
      inlineComment = afterQuote.slice(commentIdx).trim();
    } else if (afterQuote.length > 0 && /^\s+$/.test(afterQuote)) {
      hasTrailingWhitespace = true;
    }
  } else {
    hasTrailingWhitespace = /\s+$/.test(rawSegment);
  }

  return {
    value,
    rawValue: rawSegment,
    quoteType,
    inlineComment,
    hasTrailingWhitespace,
    hasUnquotedSpaces: false,
  };
}

function parseUnquotedValue(rawSegment: string): ParsedValueResult {
  let valuePart = rawSegment;
  let inlineComment: string | undefined;

  // Inline comment in unquoted values starts at '#' preceded by whitespace
  const inlineCommentMatch = rawSegment.match(/^(.*?)(\s+#.*)$/);
  if (inlineCommentMatch) {
    valuePart = inlineCommentMatch[1];
    inlineComment = inlineCommentMatch[2].trim();
  }

  const hasTrailingWhitespace =
    inlineComment === undefined && valuePart.length > 0 && /[ \t]+$/.test(valuePart);

  const trimmedValue = valuePart.trim();
  const hasUnquotedSpaces = trimmedValue.length > 0 && /\s/.test(trimmedValue);

  return {
    value: trimmedValue,
    rawValue: rawSegment,
    quoteType: 'none',
    inlineComment,
    hasTrailingWhitespace,
    hasUnquotedSpaces,
  };
}

export function parseEnv(input: string): ParsedEnv {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.length === 0 ? [] : normalized.split('\n');

  const lines: EnvLine[] = [];
  const entries: EnvLine[] = [];
  const invalidLines: EnvLine[] = [];
  const map: Record<string, string> = {};
  const keyOccurrences = new Map<string, number[]>();

  for (let idx = 0; idx < rawLines.length; idx += 1) {
    const lineNumber = idx + 1;
    const raw = rawLines[idx];
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      lines.push({
        lineNumber,
        raw,
        type: 'blank',
      });
      continue;
    }

    if (trimmed.startsWith('#')) {
      lines.push({
        lineNumber,
        raw,
        type: 'comment',
      });
      continue;
    }

    const exportMatch = raw.match(/^\s*export\s+(.*)$/);
    const hasExportPrefix = Boolean(exportMatch);
    const assignmentBody = exportMatch ? exportMatch[1] : raw.trimStart();
    const eqIndex = assignmentBody.indexOf('=');

    if (eqIndex <= 0) {
      const invalidLine: EnvLine = {
        lineNumber,
        raw,
        type: 'invalid',
      };
      lines.push(invalidLine);
      invalidLines.push(invalidLine);
      continue;
    }

    const rawKey = assignmentBody.slice(0, eqIndex).trim();
    const rawValueSegment = assignmentBody.slice(eqIndex + 1);

    if (!/^[A-Za-z0-9_.-]+$/.test(rawKey)) {
      const invalidLine: EnvLine = {
        lineNumber,
        raw,
        type: 'invalid',
      };
      lines.push(invalidLine);
      invalidLines.push(invalidLine);
      continue;
    }

    const leadingTrimmedVal = rawValueSegment.trimStart();
    let parsedValue: ParsedValueResult;

    if (leadingTrimmedVal.startsWith('"')) {
      parsedValue = parseQuotedValue(leadingTrimmedVal, '"');
    } else if (leadingTrimmedVal.startsWith("'")) {
      parsedValue = parseQuotedValue(leadingTrimmedVal, "'");
    } else {
      parsedValue = parseUnquotedValue(rawValueSegment);
    }

    const existingLines = keyOccurrences.get(rawKey) ?? [];
    const isDuplicate = existingLines.length > 0;
    const firstDefinedLine = isDuplicate ? existingLines[0] : undefined;
    existingLines.push(lineNumber);
    keyOccurrences.set(rawKey, existingLines);

    const entryLine: EnvLine = {
      lineNumber,
      raw,
      type: 'entry',
      key: rawKey,
      value: parsedValue.value,
      rawValue: parsedValue.rawValue,
      quoteType: parsedValue.quoteType,
      hasExportPrefix,
      inlineComment: parsedValue.inlineComment,
      hasTrailingWhitespace: parsedValue.hasTrailingWhitespace,
      hasUnquotedSpaces: parsedValue.hasUnquotedSpaces,
      isDuplicate,
      firstDefinedLine,
    };

    lines.push(entryLine);
    entries.push(entryLine);
    map[rawKey] = parsedValue.value;
  }

  const duplicates: DuplicateKeyRecord[] = [];
  keyOccurrences.forEach((lineNums, key) => {
    if (lineNums.length > 1) {
      duplicates.push({ key, lines: lineNums });
    }
  });

  return {
    lines,
    entries,
    map,
    duplicates,
    invalidLines,
    totalLines: rawLines.length,
    entryCount: entries.length,
  };
}
