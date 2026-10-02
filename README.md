# SyncPulse

[![CI](https://img.shields.io/github/actions/workflow/status/manav363/inventory-system/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/manav363/inventory-system/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](LICENSE)

**A browser-only dashboard that finds products whose warehouse stock cannot cover their orders.**

Drop in a spreadsheet with one row per product — name, SKU, warehouse stock, and one column of
orders per sales channel — and SyncPulse flags every product that is oversold across channels or
out of stock. Nothing is uploaded anywhere: the file is read and processed in your browser.

## How a row is judged

For each product, the orders from every **enabled** channel are summed and compared with the
warehouse stock:

| Status | Rule |
|---|---|
| **Stockout** | warehouse stock is 0 |
| **Conflict** | warehouse stock is below the total orders across enabled channels |
| **Synced** | everything else (also used if no stock column is mapped) |

## What you can do

- **Import** `.xlsx`, `.xls` or `.csv` by drag-and-drop or file picker. The first sheet is used.
- **Overview** — total units, number of conflicts and stockouts, a top-10 demand-versus-supply
  chart, a health breakdown, and the most urgent items to fix.
- **Inventory** — search by name or SKU, filter to conflicts or stockouts, edit a product's stock
  inline, and export the updated spreadsheet.
- **Settings** — correct which columns hold the product name, SKU and stock, and switch sales
  channels on or off to see how the statuses change.

### Column detection

On import the app guesses the columns so a typical sheet works without setup: header names are
matched against hints (a name like `Item Description` beats `Item ID` or `Brand Name`), and when
no header matches it falls back to column types. Every remaining numeric column is treated as a
sales channel, except descriptive ones such as `Reserved Stock`, `Returns Hold`, `Reorder Point`
or `Lead Time Days`, which are listed but start switched off. The guess is a heuristic; use
Settings if it picks wrongly.

## Try it

Two sample spreadsheets are included in [`public/`](public): `inventory_data.xlsx` (30 products,
5 channels) and `presentation-warehouse-dataset.xlsx` (180 products, 13 numeric columns).

```bash
npm install
npm run dev        # http://localhost:5173 — then drop a sample file onto the page
```

| Command | Purpose |
|---|---|
| `npm run dev` | development server |
| `npm test` | unit tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run build` | production build |

## Tests

The import and status logic lives in [`src/lib/inventoryData.js`](src/lib/inventoryData.js),
separate from React, and is covered by 24 tests: number parsing, header cleaning, empty-row
handling, column detection, the Synced / Conflict / Stockout rules (including disabled channels),
and the two sample files. The larger sample ships with its own `Healthy` / `Conflict` label per
row, and a test checks that the app's statuses agree with those labels on at least 95% of rows
(currently 178 of 180).

CI runs lint, tests and the production build on every push and pull request.

## Project structure

```
src/
  lib/inventoryData.js     parsing, column detection, status rules (pure, tested)
  context/                 React context: holds the workspace state
  pages/                   Dashboard, Inventory, Settings
  components/              Sidebar, UploadScreen
public/                    sample spreadsheets
```

## Known limitations

- **Nothing is saved.** Data lives in memory; refreshing the page discards it. Edited stock is only
  kept if you export the spreadsheet.
- **No backend and no accounts.** It is a single-user, client-side tool.
- **Spreadsheet library advisory.** `xlsx` 0.18.5 is the last version published to npm and has
  two known advisories (prototype pollution and a regular-expression DoS when parsing a crafted
  file); the fixed versions are only distributed from the SheetJS site. Since files are parsed
  locally from the person who opens them, the exposure is limited to opening an untrusted file in
  your own browser. `npm audit` reports it for that reason.
- **Detection is a guess** and can be wrong on unusual layouts (see Settings).
- **Rough edges:** errors are shown with browser alert dialogs, and the production bundle is large
  (Recharts and the spreadsheet library) and not code-split.

## How this was built

SyncPulse was built with AI coding assistance (Claude). The behaviour described above is
covered by the tests and checked by CI rather than asserted.

## License

[MIT](LICENSE)
