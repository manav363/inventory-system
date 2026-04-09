import { useState } from 'react';
import { UploadCloud, Hexagon, Info } from 'lucide-react';
import { useInventoryContext } from '../context/InventoryContext';

const UploadScreen = () => {
  const { processFile } = useInventoryContext();
  
  // NEW: State to detect when a file is hovering over the dropzone
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag & Drop Handlers for native feel
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* Decorative Ambient Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-slate-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Upload Card */}
      <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 max-w-xl w-full text-center border border-white relative z-10">
        
        {/* Brand Logo matching the Sidebar */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-lg shadow-slate-900/20">
            <Hexagon className="text-white fill-white" size={36} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
          Welcome to SyncPulse
        </h1>
        <p className="text-slate-500 font-medium mb-10">
          Upload your inventory workspace to initialize your command center.
        </p>

        {/* Interactive Dropzone */}
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 group
            ${isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-inner'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
            }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
            {/* Icon that reacts to drag state */}
            <div className={`p-4 rounded-full mb-5 transition-all duration-300 shadow-sm
                ${isDragging ? 'bg-blue-100 text-blue-600 scale-110' : 'bg-white text-slate-400 group-hover:text-blue-500'}`}
            >
                <UploadCloud size={40} className={isDragging ? 'animate-bounce' : ''} />
            </div>
            
            <p className="mb-2 text-lg text-slate-800 font-extrabold tracking-tight">
              {isDragging ? 'Drop file to upload...' : 'Click or drag to upload'}
            </p>
            <p className="text-sm text-slate-500 font-medium">
              Supports <span className="font-bold text-slate-700">.XLSX</span> or <span className="font-bold text-slate-700">.CSV</span>
            </p>
          </div>
          {/* Hidden input field triggered by the label click */}
          <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
        </label>

        {/* Smart Schema Requirements (Error Prevention Principle) */}
        <div className="mt-10 bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left">
          <div className="flex items-center gap-2 mb-3 text-slate-800">
            <Info size={18} className="text-blue-500" />
            <span className="text-sm font-bold">Required Data Schema</span>
          </div>
          <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
            Ensure your file includes the exact column headers below to prevent rendering errors:
          </p>
          <div className="flex flex-wrap gap-2">
            {['productName', 'sku', 'warehouseStock'].map(col => (
              <span key={col} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs rounded-lg font-mono font-medium shadow-sm">
                {col}
              </span>
            ))}
            <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs rounded-lg font-mono font-bold shadow-sm">
              + Any Order Sources
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UploadScreen;