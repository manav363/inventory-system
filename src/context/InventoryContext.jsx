import { createContext, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  INTERNAL_ROW_ID,
  analyzeSheet,
  buildInitialChannelToggles,
  deriveInventory,
  getChannelColumns,
  toNumber,
} from '../lib/inventoryData';

const InventoryContext = createContext(null);

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

  const inventory = useMemo(
    () => deriveInventory({ rows: sheetRows, fieldMappings, channels, channelToggles }),
    [sheetRows, fieldMappings, channels, channelToggles],
  );

  const processFile = (file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const { rows, columns, fieldMappings: inferredMappings, channelToggles: toggles } =
          analyzeSheet(sheet);

        setSheetRows(rows);
        setAvailableColumns(columns);
        setFieldMappings(inferredMappings);
        setChannelToggles(toggles);
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
