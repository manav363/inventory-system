import { createContext, useState, useContext, useEffect } from 'react';
import * as XLSX from 'xlsx';

const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [rawInventory, setRawInventory] = useState([]); // Stores pure Excel data
  const [inventory, setInventory] = useState([]);       // Stores calculated data for UI
  const [channels, setChannels] = useState([]); 
  const [channelToggles, setChannelToggles] = useState({}); // Stores On/Off state
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Process File & Setup Initial State
  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonData.length === 0) throw new Error("Empty file");

        const baseKeys = ['productName', 'sku', 'warehouseStock', 'id', 'status'];
        const allKeys = Object.keys(jsonData[0]);
        const dynamicChannels = allKeys.filter(key => !baseKeys.includes(key));

        // Start with all channels turned ON
        const initialToggles = dynamicChannels.reduce((acc, curr) => ({ ...acc, [curr]: true }), {});

        const cleanedData = jsonData
          .filter(item => Object.keys(item).length > 0 && item.productName) 
          .map((item, index) => {
             const id = item.id || index + 1; 
             const warehouseStock = Number(item.warehouseStock) || 0;
             
             // Keep raw channels as numbers
             const rawChannels = {};
             dynamicChannels.forEach(ch => {
                 rawChannels[ch] = Number(item[ch]) || 0; 
             });
             
             return { 
               ...item, 
               id, 
               productName: String(item.productName),
               sku: item.sku ? String(item.sku) : 'N/A',
               warehouseStock,
               ...rawChannels
             };
          });

        setChannels(dynamicChannels);
        setChannelToggles(initialToggles);
        setRawInventory(cleanedData); // Save raw data
        setIsLoaded(true);
      } catch (error) {
        console.error("Error processing file:", error);
        alert("Error reading file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 2. THE MAGIC REACTIVE ENGINE (Recalculates when toggles or stock changes)
  useEffect(() => {
    if (rawInventory.length === 0) return;

    const updatedInventory = rawInventory.map(item => {
      let totalOrders = 0;
      
      // Only sum up channels that are toggled ON
      channels.forEach(ch => {
        if (channelToggles[ch]) {
           totalOrders += (item[ch] || 0);
        }
      });
      
      let status = 'Synced';
      if (item.warehouseStock === 0) status = 'Stockout';
      else if (item.warehouseStock < totalOrders) status = 'Conflict';
      
      return { ...item, totalOrders, status };
    });

    setInventory(updatedInventory);
  }, [rawInventory, channelToggles, channels]);

  // 3. Global Action Handlers
  const toggleChannel = (channel) => {
    setChannelToggles(prev => ({ ...prev, [channel]: !prev[channel] }));
  };

  const updateStock = (id, newStock) => {
    setRawInventory(prev => prev.map(item => 
      item.id === id ? { ...item, warehouseStock: Number(newStock) } : item
    ));
  };

  return (
    <InventoryContext.Provider value={{ 
        inventory, 
        isLoaded, 
        setIsLoaded, 
        processFile, 
        channels,
        channelToggles,
        toggleChannel,
        updateStock,
        setRawInventory
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventoryContext = () => useContext(InventoryContext);