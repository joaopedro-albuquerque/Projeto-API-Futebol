const XLSX_CONTENT_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const detectDelimiter = (text) => {
  const firstLine = String(text || '').split(/\r?\n/, 1)[0] || '';
  const candidates = [',', ';', '\t'];

  let bestDelimiter = ',';
  let bestScore = -1;

  for (const delimiter of candidates) {
    const score = firstLine.split(delimiter).length;
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
};

const normalizeHeader = (header) =>
  String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const normalizeRecordKeys = (record) => {
  const normalizedRecord = {};

  for (const [key, value] of Object.entries(record || {})) {
    normalizedRecord[normalizeHeader(key)] = value == null ? '' : String(value).trim();
  }

  return normalizedRecord;
};

const splitCsvLine = (line, delimiter) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseCsvText = (text) => {
  if (!text || !String(text).trim()) return [];

  const delimiter = detectDelimiter(text);
  const lines = String(text)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    const record = {};

    headers.forEach((header, index) => {
      record[header] = String(values[index] ?? '').trim();
    });

    return record;
  });
};

const parseXlsxBuffer = (buffer) => {
  let xlsx;

  try {
    xlsx = require('xlsx');
  } catch (error) {
    const dependencyError = new Error('Suporte a XLSX indisponivel. Instale a dependencia xlsx no projeto.');
    dependencyError.statusCode = 500;
    throw dependencyError;
  }

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) return [];

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
  return rows.map(normalizeRecordKeys);
};

const parseTabularFile = (body, contentType = '') => {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body || '');
  const normalizedType = String(contentType || '').split(';')[0].trim().toLowerCase();

  if (!buffer.length) return [];

  if (XLSX_CONTENT_TYPES.includes(normalizedType)) {
    return parseXlsxBuffer(buffer);
  }

  return parseCsvText(buffer.toString('utf8'));
};

const toNullableString = (value) => {
  if (value == null) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;
  if (['null', 'undefined', 'n/a', 'na', '-'].includes(normalized.toLowerCase())) return null;

  return normalized;
};

const toNullableNumber = (value) => {
  const normalized = toNullableString(value);
  if (normalized == null) return null;

  const numeric = Number(normalized.replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
};

const toBoolean = (value, defaultValue = false) => {
  const normalized = toNullableString(value);
  if (normalized == null) return defaultValue;

  const lower = normalized.toLowerCase();
  if (['1', 'true', 'sim', 'yes', 'y'].includes(lower)) return true;
  if (['0', 'false', 'nao', 'não', 'no', 'n'].includes(lower)) return false;

  return defaultValue;
};

module.exports = {
  parseCsvText,
  parseTabularFile,
  toNullableString,
  toNullableNumber,
  toBoolean,
};