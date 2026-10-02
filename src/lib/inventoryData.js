import * as XLSX from 'xlsx';

// Pure data logic for the inventory workspace. Everything here is free of React so it can be
// tested directly: spreadsheet parsing, column inference, and the stock-status rules.

export const EMPTY_VALUE = '';
export const INTERNAL_ROW_ID = '__rowId';

// Tried in order, most specific first, so "Item Description" beats "Brand Name" and "Item ID".
const NAME_HINTS = ['product name', 'item name', 'product', 'description', 'title', 'name', 'item'];
const SKU_HINTS = ['sku', 'code', 'barcode', 'upc', 'ean', 'asin'];
// Numeric columns that describe a product but are not sales channels. They are still offered as
// toggles in Settings; they just start switched off so they do not inflate the order totals.
const NON_CHANNEL_PATTERN =
  /\b(reserved|hold|reorder|lead time|cover|days|safety|price|cost|weight)\b/;

const STOCK_HINTS = ['stock', 'inventory', 'warehouse', 'on hand', 'available', 'qty', 'quantity', 'balance'];

export const cleanHeader = (header, index) => {
  const normalizedHeader = String(header ?? '').trim();

  return normalizedHeader || `Column ${index + 1}`;
};

export const makeUniqueHeaders = (headers) => {
  const counts = new Map();

  return headers.map((header) => {
    const nextCount = (counts.get(header) ?? 0) + 1;
    counts.set(header, nextCount);

    return nextCount === 1 ? header : `${header} (${nextCount})`;
  });
};

export const getCellValue = (value) => {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }

  return value;
};

export const isMeaningfulValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== EMPTY_VALUE;

export const toNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? '')
    .replace(/,/g, '')
    .trim();

  if (normalized === EMPTY_VALUE) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCell = (value, fallback) => {
  if (!isMeaningfulValue(value)) {
    return fallback;
  }

  return String(value);
};

export const normalizeName = (columnName) => columnName.toLowerCase().replace(/[_-]+/g, ' ');

const hasHint = (columnName, hints) => {
  const normalized = normalizeName(columnName);
  return hints.some((hint) => normalized.includes(hint));
};

export const isNonChannelName = (columnName) => NON_CHANNEL_PATTERN.test(normalizeName(columnName));

// First column matching the earliest hint, so hint order expresses priority.
const pickByHintPriority = (columns, hints) => {
  for (const hint of hints) {
    const match = columns.find((column) => normalizeName(column.label).includes(hint));
    if (match) {
      return match.key;
    }
  }

  return null;
};

export const getColumnStats = (rows, columnName) => {
  const values = rows
    .map((row) => row[columnName])
    .filter((value) => isMeaningfulValue(value));

  if (values.length === 0) {
    return {
      key: columnName,
      label: columnName,
      nonEmptyCount: 0,
      numericCount: 0,
      isNumeric: false,
    };
  }

  const numericCount = values.filter((value) => {
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }

    const normalized = String(value).replace(/,/g, '').trim();
    return normalized !== EMPTY_VALUE && Number.isFinite(Number(normalized));
  }).length;

  return {
    key: columnName,
    label: columnName,
    nonEmptyCount: values.length,
    numericCount,
    isNumeric: numericCount / values.length >= 0.6,
  };
};

export const pickBestColumn = (columns, predicate) => columns.find(predicate)?.key ?? null;

export const inferFieldMappings = (columns) => {
  const textColumns = columns.filter((column) => !column.isNumeric);
  const numericColumns = columns.filter((column) => column.isNumeric);

  const productName =
    pickByHintPriority(textColumns, NAME_HINTS) ??
    pickByHintPriority(columns, NAME_HINTS) ??
    textColumns[0]?.key ??
    columns[0]?.key ??
    null;

  const sku =
    pickBestColumn(
      columns,
      (column) => column.key !== productName && hasHint(column.label, SKU_HINTS),
    ) ??
    textColumns.find((column) => column.key !== productName)?.key ??
    null;

  const warehouseStock =
    pickBestColumn(columns, (column) => column.isNumeric && hasHint(column.label, STOCK_HINTS)) ??
    numericColumns[0]?.key ??
    null;

  return {
    productName,
    sku,
    warehouseStock,
  };
};

export const getChannelColumns = (columns, fieldMappings) =>
  columns
    .filter(
      (column) =>
        column.isNumeric &&
        column.key !== fieldMappings.warehouseStock &&
        column.key !== fieldMappings.sku &&
        column.key !== fieldMappings.productName,
    )
    .map((column) => column.key);

export const buildInitialChannelToggles = (channelColumns, existingToggles = {}) =>
  channelColumns.reduce(
    (acc, channel) => ({
      ...acc,
      [channel]: existingToggles[channel] ?? !isNonChannelName(channel),
    }),
    {},
  );

export const normalizeSheetRows = (sheet) => {
  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: EMPTY_VALUE,
    raw: true,
  });

  const [headerRow = [], ...bodyRows] = matrix;
  const headers = makeUniqueHeaders(headerRow.map(cleanHeader));

  const rows = bodyRows
    .map((row, rowIndex) => {
      const item = { [INTERNAL_ROW_ID]: rowIndex + 1 };

      headers.forEach((header, columnIndex) => {
        item[header] = getCellValue(row[columnIndex]);
      });

      return item;
    })
    .filter((row) =>
      headers.some((header) => isMeaningfulValue(row[header])),
    );

  return { headers, rows };
};

/**
 * The whole import step: parse a worksheet, describe its columns, guess which columns hold the
 * product name / SKU / warehouse stock, and treat the remaining numeric columns as sales channels.
 */
export const analyzeSheet = (sheet) => {
  const { rows } = normalizeSheetRows(sheet);

  if (rows.length === 0) {
    throw new Error('The uploaded file is empty.');
  }

  const columns = Object.keys(rows[0])
    .filter((key) => key !== INTERNAL_ROW_ID)
    .map((key) => getColumnStats(rows, key));

  const fieldMappings = inferFieldMappings(columns);
  const channels = getChannelColumns(columns, fieldMappings);

  return {
    rows,
    columns,
    fieldMappings,
    channelToggles: buildInitialChannelToggles(channels),
  };
};

/**
 * Turns parsed rows into inventory items with a stock status.
 *
 * - Stockout: warehouse stock is 0
 * - Conflict: warehouse stock is below the orders summed over the enabled channels
 * - Synced:   everything else (also used when no stock column is mapped)
 */
export const deriveInventory = ({ rows, fieldMappings, channels, channelToggles }) => {
  if (rows.length === 0) {
    return [];
  }

  return rows.map((row, index) => {
    const warehouseStock = fieldMappings.warehouseStock
      ? toNumber(row[fieldMappings.warehouseStock])
      : 0;

    const totalOrders = channels.reduce((total, channel) => {
      if (!channelToggles[channel]) {
        return total;
      }

      return total + toNumber(row[channel]);
    }, 0);

    let status = 'Synced';
    if (fieldMappings.warehouseStock) {
      if (warehouseStock === 0) {
        status = 'Stockout';
      } else if (warehouseStock < totalOrders) {
        status = 'Conflict';
      }
    }

    return {
      id: row[INTERNAL_ROW_ID] ?? index + 1,
      rowId: row[INTERNAL_ROW_ID] ?? index + 1,
      productName: formatCell(
        fieldMappings.productName ? row[fieldMappings.productName] : null,
        `Row ${index + 1}`,
      ),
      sku: formatCell(fieldMappings.sku ? row[fieldMappings.sku] : null, 'N/A'),
      warehouseStock,
      totalOrders,
      status,
      sourceRow: row,
    };
  });
};
