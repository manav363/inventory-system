// src/hooks/useInventory.js
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export const useInventory = (filePath) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 1. Fetch the file from the public folder
        const response = await fetch(filePath);
        if (!response.ok) throw new Error('Failed to fetch Excel file');

        // 2. Turn the file into an ArrayBuffer (raw data)
        const arrayBuffer = await response.arrayBuffer();

        // 3. Parse the data using SheetJS (xlsx)
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // 4. Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // 5. Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        console.log("Data Loaded:", jsonData); // Debugging line
        setInventory(jsonData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filePath]);

  return { inventory, loading, error, setInventory };
};