import { createContext, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

const InventoryContext = createContext(null);

const EMPTY_VALUE = '';
const INTERNAL_ROW_ID = '__rowId';

const NAME_HINTS = ['product', 'item', 'name', 'title', 'description'];
const SKU_HINTS = ['sku', 'code', 'barcode', 'upc', 'ean', 'asin'];
const STOCK_HINTS = ['stock', 'inventory', 'warehouse', 'on hand', 'available', 'qty', 'quantity', 'balance'];

const cleanHeader = (header, index) => {
  const normalizedHeader = String(header ?? '').trim();

  return normalizedHeader || `Column ${index + 1}`;
};

const makeUniqueHeaders = (headers) => {
  const counts = new Map();

  return headers.map((header) => {
    const nextCount = (counts.get(header) ?? 0) + 1;
    counts.set(header, nextCount);

    return nextCount === 1 ? header : `${header} (${nextCount})`;
  });
};

const getCellValue = (value) => {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }

  return value;
};

const isMeaningfulValue = (value) =>
  value !== null && value !== undefined && String(value).trim() !== EMPTY_VALUE;

const toNumber = (value) => {
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

const formatCell = (value, fallback) => {
  if (!isMeaningfulValue(value)) {
    return fallback;
  }

  return String(value);
};

const hasHint = (columnName, hints) => {
  const normalized = columnName.toLowerCase();
  return hints.some((hint) => normalized.includes(hint));
};

const getColumnStats = (rows, columnName) => {
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

const pickBestColumn = (columns, predicate) => columns.find(predicate)?.key ?? null;

const inferFieldMappings = (columns) => {
  const textColumns = columns.filter((column) => !column.isNumeric);
  const numericColumns = columns.filter((column) => column.isNumeric);

  const productName =
    pickBestColumn(columns, (column) => hasHint(column.label, NAME_HINTS)) ??
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

const getChannelColumns = (columns, fieldMappings) =>
  columns
    .filter(
      (column) =>
        column.isNumeric &&
        column.key !== fieldMappings.warehouseStock &&
        column.key !== fieldMappings.sku &&
        column.key !== fieldMappings.productName,
    )
    .map((column) => column.key);

const buildInitialChannelToggles = (channelColumns, existingToggles = {}) =>
  channelColumns.reduce(
    (acc, channel) => ({
      ...acc,
      [channel]: existingToggles[channel] ?? true,
    }),
    {},
  );

const normalizeSheetRows = (sheet) => {
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

export const InventoryProvider = ({ children }) => {
  const [sheetRows, setSheetRows] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({
    productName: null,
    sku: null,
    warehouseStock: null,
  });
  const [channelToggles, setChannelToggles] = useState({});
  const [fileName, setFileName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const numericColumns = useMemo(
    () => availableColumns.filter((column) => column.isNumeric).map((column) => column.key),
    [availableColumns],
  );

  const channels = useMemo(
    () => getChannelColumns(availableColumns, fieldMappings),
    [availableColumns, fieldMappings],
  );

  const inventory = useMemo(() => {
    if (sheetRows.length === 0) {
      return [];
    }

    return sheetRows.map((row, index) => {
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
  }, [sheetRows, fieldMappings, channels, channelToggles]);

  const processFile = (file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const { rows } = normalizeSheetRows(sheet);

        if (rows.length === 0) {
          throw new Error('The uploaded file is empty.');
        }

        const columns = Object.keys(rows[0])
          .filter((key) => key !== INTERNAL_ROW_ID)
          .map((key) => getColumnStats(rows, key));

        const inferredMappings = inferFieldMappings(columns);
        const channelColumns = getChannelColumns(columns, inferredMappings);

        setSheetRows(rows);
        setAvailableColumns(columns);
        setFieldMappings(inferredMappings);
        setChannelToggles(buildInitialChannelToggles(channelColumns));
        setFileName(file.name);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error processing file:', error);
        alert(error.message || 'Error reading file.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const setFieldMapping = (field, value) => {
    setFieldMappings((prev) => {
      const nextMappings = {
        ...prev,
        [field]: value || null,
      };

      const nextChannels = getChannelColumns(availableColumns, nextMappings);
      setChannelToggles((currentToggles) =>
        buildInitialChannelToggles(nextChannels, currentToggles),
      );

      return nextMappings;
    });
  };

  const toggleChannel = (channel) => {
    setChannelToggles((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  const updateStock = (id, newStock) => {
    if (!fieldMappings.warehouseStock) {
      return;
    }

    setSheetRows((prev) =>
      prev.map((row) =>
        row[INTERNAL_ROW_ID] === id
          ? { ...row, [fieldMappings.warehouseStock]: toNumber(newStock) }
          : row,
      ),
    );
  };

  const clearData = () => {
    setSheetRows([]);
    setAvailableColumns([]);
    setFieldMappings({
      productName: null,
      sku: null,
      warehouseStock: null,
    });
    setChannelToggles({});
    setFileName('');
    setIsLoaded(false);
  };

  const exportRows = useMemo(
    () =>
      sheetRows.map((row) => {
        const cleanRow = { ...row };
        delete cleanRow[INTERNAL_ROW_ID];
        return cleanRow;
      }),
    [sheetRows],
  );

  const value = {
    availableColumns,
    channelToggles,
    channels,
    clearData,
    exportRows,
    fieldMappings,
    fileName,
    inventory,
    isLoaded,
    numericColumns,
    processFile,
    setFieldMapping,
    setIsLoaded,
    toggleChannel,
    updateStock,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export default InventoryContext;
