import { useState, useMemo } from 'react';
import useInventoryContext from '../context/useInventoryContext';
import { Save, AlertTriangle, CheckCircle, Search, SlidersHorizontal, PackageX, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';

function Inventory() {
  const { exportRows, fieldMappings, inventory, updateStock } = useInventoryContext(); 
  
  // NEW: UI State for Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Conflicts', 'Stockouts'

  const handleStockChange = (id, newStock) => {
    updateStock(id, newStock); 
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory_Export");
    XLSX.writeFile(wb, "SyncPulse_Inventory.xlsx");
    alert("Updated file downloaded successfully!");
  };

  // NEW: Smart Filtering Logic
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // 1. Apply Search
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Apply Status Filter
      const matchesFilter = activeFilter === 'All' ? true : 
                            activeFilter === 'Conflicts' ? item.status === 'Conflict' : 
                            item.status === 'Stockout';

      return matchesSearch && matchesFilter;
    });
  }, [inventory, searchTerm, activeFilter]);

  const conflictCount = inventory.filter(i => i.status === 'Conflict').length;

  return (
    <div className="ml-64 min-h-screen bg-slate-50 p-8 font-sans pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fulfillment Center</h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">Manage stock levels and resolve discrepancies</p>
          </div>
          <button 
            onClick={handleExport} 
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/20 font-medium"
          >
            <Save size={18} /><span>Save & Export</span>
          </button>
        </header>

        {/* CONTROL PANEL (Search & Filters) */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-slate-400" size={18} />
                </div>
                <input 
                    type="text" 
                    placeholder="Search by product name or SKU..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm font-medium text-slate-700 placeholder-slate-400"
                />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-200 text-slate-400 mr-2">
                    <SlidersHorizontal size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Filter</span>
                </div>
                
                <button onClick={() => setActiveFilter('All')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeFilter === 'All' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    All Items
                </button>
                <button onClick={() => setActiveFilter('Conflicts')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeFilter === 'Conflicts' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                    Conflicts {conflictCount > 0 && <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeFilter === 'Conflicts' ? 'bg-white text-red-600' : 'bg-red-200 text-red-800'}`}>{conflictCount}</span>}
                </button>
                <button onClick={() => setActiveFilter('Stockouts')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeFilter === 'Stockouts' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                    Stockouts
                </button>
            </div>
        </div>

        {/* THE INTERACTIVE TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">Product Info</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    {fieldMappings.warehouseStock ?? 'Stock Column'}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Demand</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredInventory.length === 0 ? (
                    <tr>
                        <td colSpan="4" className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                                <PackageX size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-semibold text-slate-600">No items found</p>
                                <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    filteredInventory.map((item) => (
                    <tr 
                        key={item.id} 
                        // Subtle red background if there is a conflict to draw the eye
                        className={`transition-colors group hover:bg-slate-50 ${item.status === 'Conflict' ? 'bg-red-50/30' : ''}`}
                    >
                        <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-xs font-medium text-slate-400 font-mono mt-0.5">{item.sku}</div>
                        </td>
                        
                        {/* SAAS-STYLE EDITABLE CELL */}
                        <td className="px-6 py-4">
                        <div className="relative flex items-center max-w-[120px]">
                            <input 
                            type="number" 
                            value={item.warehouseStock}
                            onChange={(e) => handleStockChange(item.id, e.target.value)}
                            disabled={!fieldMappings.warehouseStock}
                            // Cleaner input: looks like text until focused, then acts like an input
                            className="w-full px-3 py-2 bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-slate-800 transition-all hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                            />
                        </div>
                        </td>

                        <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-800 font-extrabold text-base">{item.totalOrders}</span>
                            <span className="text-xs text-slate-400 font-medium">units</span>
                        </div>
                        </td>
                        
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold capitalize shadow-sm border
                            ${item.status === 'Conflict' ? 'bg-red-50 text-red-700 border-red-200' : 
                            item.status === 'Stockout' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                            {item.status === 'Conflict' && <AlertTriangle size={14} />}
                            {item.status === 'Stockout' && <TrendingUp size={14} />}
                            {item.status === 'Synced' && <CheckCircle size={14} />}
                            {item.status}
                        </span>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inventory;
