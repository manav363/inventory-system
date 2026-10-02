import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import {
  INTERNAL_ROW_ID,
  analyzeSheet,
  buildInitialChannelToggles,
  cleanHeader,
  deriveInventory,
  getChannelColumns,
  getColumnStats,
  inferFieldMappings,
  isNonChannelName,
  makeUniqueHeaders,
  normalizeSheetRows,
  toNumber,
} from './inventoryData';

const sheetFrom = (rows) => XLSX.utils.aoa_to_sheet(rows);

const readSample = (name) => {
  const file = fileURLToPath(new URL(`../../public/${name}`, import.meta.url));
  const workbook = XLSX.read(fs.readFileSync(file));
  return workbook.Sheets[workbook.SheetNames[0]];
};

const derive = (sheet) => {
  const analysis = analyzeSheet(sheet);
  const channels = getChannelColumns(analysis.columns, analysis.fieldMappings);
  const inventory = deriveInventory({
    rows: analysis.rows,
    fieldMappings: analysis.fieldMappings,
    channels,
    channelToggles: analysis.channelToggles,
  });
  return { ...analysis, channels, inventory };
};

describe('toNumber', () => {
  it('passes finite numbers through and zeroes everything else', () => {
    expect(toNumber(12)).toBe(12);
    expect(toNumber(Infinity)).toBe(0);
    expect(toNumber(NaN)).toBe(0);
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('')).toBe(0);
    expect(toNumber('n/a')).toBe(0);
  });

  it('reads numeric strings, including thousands separators', () => {
    expect(toNumber('42')).toBe(42);
    expect(toNumber(' 1,250 ')).toBe(1250);
    expect(toNumber('3.5')).toBe(3.5);
  });
});

describe('headers', () => {
  it('names blank headers by position', () => {
    expect(cleanHeader('', 2)).toBe('Column 3');
    expect(cleanHeader(null, 0)).toBe('Column 1');
    expect(cleanHeader('  SKU ', 1)).toBe('SKU');
  });

  it('makes duplicate headers unique', () => {
    expect(makeUniqueHeaders(['Stock', 'Stock', 'SKU', 'Stock'])).toEqual([
      'Stock',
      'Stock (2)',
      'SKU',
      'Stock (3)',
    ]);
  });
});

describe('normalizeSheetRows', () => {
  it('drops fully empty rows, numbers the rest, and fills short rows', () => {
    const sheet = sheetFrom([
      ['Name', 'Stock', 'Orders'],
      ['Chair', 5, 2],
      [null, null, null],
      ['Desk', 7],
    ]);

    const { headers, rows } = normalizeSheetRows(sheet);

    expect(headers).toEqual(['Name', 'Stock', 'Orders']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ Name: 'Chair', Stock: 5, Orders: 2, [INTERNAL_ROW_ID]: 1 });
    expect(rows[1]).toMatchObject({ Name: 'Desk', Stock: 7, Orders: '', [INTERNAL_ROW_ID]: 3 });
  });
});

describe('getColumnStats', () => {
  it('treats a column as numeric when at least 60% of its values are numbers', () => {
    const mostlyNumbers = [{ a: 1 }, { a: 2 }, { a: 3 }, { a: '4' }, { a: 'x' }];
    const mostlyText = [{ a: 1 }, { a: 'x' }, { a: 'y' }, { a: 'z' }, { a: 'w' }];

    expect(getColumnStats(mostlyNumbers, 'a').isNumeric).toBe(true);
    expect(getColumnStats(mostlyText, 'a').isNumeric).toBe(false);
  });

  it('ignores blanks and handles an empty column', () => {
    const stats = getColumnStats([{ a: '' }, { a: null }], 'a');
    expect(stats).toMatchObject({ nonEmptyCount: 0, numericCount: 0, isNumeric: false });
  });
});

describe('inferFieldMappings', () => {
  const columnsFor = (rows) =>
    Object.keys(rows[0]).map((key) => getColumnStats(rows, key));

  it('uses header hints to find name, SKU and stock', () => {
    const rows = [{ 'Product Name': 'Chair', 'SKU Code': 'C-1', 'Units On Hand': 5, Web: 2 }];
    expect(inferFieldMappings(columnsFor(rows))).toEqual({
      productName: 'Product Name',
      sku: 'SKU Code',
      warehouseStock: 'Units On Hand',
    });
  });

  it('prefers a description over an ID or a brand name when both match a hint', () => {
    const rows = [
      { 'Item ID': 'ITM-1', 'Item Description': 'Chair', 'Brand Name': 'Vertex', 'Model Code': 'M1', Stock: 5 },
    ];
    expect(inferFieldMappings(columnsFor(rows)).productName).toBe('Item Description');
  });

  it('falls back to column types when no header matches a hint', () => {
    const rows = [
      { A: 'Chair', B: 'C-1', C: 10, D: 3 },
      { A: 'Desk', B: 'D-1', C: 4, D: 1 },
    ];
    expect(inferFieldMappings(columnsFor(rows))).toEqual({
      productName: 'A',
      sku: 'B',
      warehouseStock: 'C',
    });
  });
});

describe('channels', () => {
  it('treats the remaining numeric columns as sales channels', () => {
    const rows = [{ Name: 'Chair', SKU: 'C-1', Stock: 5, Web: 2, Retail: 1 }];
    const columns = Object.keys(rows[0]).map((key) => getColumnStats(rows, key));
    const mappings = inferFieldMappings(columns);

    expect(getChannelColumns(columns, mappings)).toEqual(['Web', 'Retail']);
  });

  it('starts descriptive columns switched off but keeps them togglable', () => {
    expect(isNonChannelName('Reserved Stock')).toBe(true);
    expect(isNonChannelName('Returns_Hold')).toBe(true);
    expect(isNonChannelName('Lead Time Days')).toBe(true);
    expect(isNonChannelName('Household Orders')).toBe(false);
    expect(isNonChannelName('Retail_Store_NY')).toBe(false);

    const toggles = buildInitialChannelToggles(['Web', 'Reserved Stock']);
    expect(toggles).toEqual({ Web: true, 'Reserved Stock': false });
  });

  it('keeps a toggle the user already set', () => {
    expect(buildInitialChannelToggles(['Web'], { Web: false })).toEqual({ Web: false });
  });
});

describe('deriveInventory', () => {
  const fieldMappings = { productName: 'Name', sku: 'SKU', warehouseStock: 'Stock' };
  const channels = ['Web', 'Retail'];
  const row = (id, name, sku, stock, web, retail) => ({
    [INTERNAL_ROW_ID]: id,
    Name: name,
    SKU: sku,
    Stock: stock,
    Web: web,
    Retail: retail,
  });

  const statusOf = (rows, channelToggles = { Web: true, Retail: true }) =>
    deriveInventory({ rows, fieldMappings, channels, channelToggles }).map((i) => i.status);

  it('flags a stockout when warehouse stock is zero', () => {
    expect(statusOf([row(1, 'Chair', 'C', 0, 0, 0)])).toEqual(['Stockout']);
  });

  it('flags a conflict when orders across channels exceed stock', () => {
    expect(statusOf([row(1, 'Chair', 'C', 10, 6, 5)])).toEqual(['Conflict']);
  });

  it('is synced when stock covers the orders exactly or with room to spare', () => {
    expect(statusOf([row(1, 'Chair', 'C', 11, 6, 5), row(2, 'Desk', 'D', 50, 6, 5)])).toEqual([
      'Synced',
      'Synced',
    ]);
  });

  it('ignores channels that are switched off', () => {
    const rows = [row(1, 'Chair', 'C', 10, 6, 5)];
    expect(statusOf(rows, { Web: true, Retail: false })).toEqual(['Synced']);
    const [item] = deriveInventory({
      rows,
      fieldMappings,
      channels,
      channelToggles: { Web: true, Retail: false },
    });
    expect(item.totalOrders).toBe(6);
  });

  it('reads numeric strings and treats junk as zero', () => {
    expect(statusOf([row(1, 'Chair', 'C', '1,000', '400', 'n/a')])).toEqual(['Synced']);
  });

  it('labels rows that have no name or SKU', () => {
    const [item] = deriveInventory({
      rows: [row(7, '', '', 5, 1, 1)],
      fieldMappings,
      channels,
      channelToggles: { Web: true, Retail: true },
    });
    expect(item).toMatchObject({ productName: 'Row 1', sku: 'N/A', id: 7 });
  });

  it('reports everything as synced when no stock column is mapped', () => {
    const items = deriveInventory({
      rows: [row(1, 'Chair', 'C', 0, 99, 99)],
      fieldMappings: { ...fieldMappings, warehouseStock: null },
      channels,
      channelToggles: { Web: true, Retail: true },
    });
    expect(items[0].status).toBe('Synced');
  });

  it('returns nothing for no rows', () => {
    expect(statusOf([])).toEqual([]);
  });
});

describe('analyzeSheet', () => {
  it('rejects an empty sheet', () => {
    expect(() => analyzeSheet(sheetFrom([['Name', 'Stock']]))).toThrow('empty');
  });
});

describe('bundled sample files', () => {
  it('imports the small sample and finds the five sales channels', () => {
    const { rows, fieldMappings, channels, inventory } = derive(readSample('inventory_data.xlsx'));

    expect(rows).toHaveLength(30);
    expect(fieldMappings).toEqual({
      productName: 'productName',
      sku: 'sku',
      warehouseStock: 'warehouseStock',
    });
    expect(channels).toEqual([
      'B2B_Orders',
      'Retail_Store_NY',
      'Retail_Store_LA',
      'Website_Direct',
      'Wholesale_Distributor',
    ]);
    expect(new Set(inventory.map((i) => i.status))).toEqual(
      new Set(['Synced', 'Conflict', 'Stockout']),
    );
  });

  it('agrees with the warehouse dataset\'s own health labels on almost every row', () => {
    const { rows, fieldMappings, inventory, channelToggles } = derive(
      readSample('presentation-warehouse-dataset.xlsx'),
    );

    expect(rows).toHaveLength(180);
    expect(fieldMappings.productName).toBe('Item Description');
    expect(fieldMappings.warehouseStock).toBe('Available Units');
    // Descriptive numeric columns must not be counted as sales channels by default.
    expect(channelToggles['Reserved Stock']).toBe(false);
    expect(channelToggles['Lead Time Days']).toBe(false);
    expect(channelToggles['Amazon Marketplace']).toBe(true);

    // The file ships a "Stock Health Snapshot" column (Healthy / Conflict) computed independently.
    const agree = inventory.filter((item, index) => {
      const label = rows[index]['Stock Health Snapshot'];
      return (item.status === 'Synced' ? 'Healthy' : item.status) === label;
    }).length;
    expect(agree / inventory.length).toBeGreaterThanOrEqual(0.95);
  });
});
