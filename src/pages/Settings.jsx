import { Store, Trash2, Activity, AlertTriangle } from 'lucide-react';
import useInventoryContext from '../context/useInventoryContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const {
    availableColumns,
    channelToggles,
    channels,
    clearData,
    fieldMappings,
    numericColumns,
    setFieldMapping,
    toggleChannel,
  } = useInventoryContext();
  const navigate = useNavigate();

  const handleClearData = () => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to clear all inventory data? This cannot be undone.")) {
      clearData();
      navigate('/');
    }
  };

  const handleFieldMappingChange = (field, value) => {
    setFieldMapping(field, value);
  };

  // Helper function to make channel names pretty (e.g., "Retail_Store_NY" -> "Retail Store NY")
  const formatChannelName = (name) => name.replace(/_/g, ' ');

  return (
    <div className="ml-64 min-h-screen bg-slate-50 p-8 font-sans pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">Manage integrations, alert thresholds, and workspace data.</p>
        </header>

        <div className="space-y-10">

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Store className="text-slate-700" size={20} />
                Sheet Mapping
              </h2>
              <p className="text-sm text-slate-500">
                These options are generated from the uploaded Excel sheet. Remap them any time if we guessed wrong.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700 block mb-2">Item name column</span>
                <select
                  value={fieldMappings.productName ?? ''}
                  onChange={(event) => handleFieldMappingChange('productName', event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableColumns.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700 block mb-2">SKU / secondary label</span>
                <select
                  value={fieldMappings.sku ?? ''}
                  onChange={(event) => handleFieldMappingChange('sku', event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {availableColumns.map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700 block mb-2">Stock column</span>
                <select
                  value={fieldMappings.warehouseStock ?? ''}
                  onChange={(event) => handleFieldMappingChange('warehouseStock', event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {numericColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          
          {/* SECTION 1: INTEGRATIONS GRID */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="text-blue-500" size={20} />
                Active Data Pipelines
              </h2>
              <p className="text-sm text-slate-500">Toggle which order sources affect your global inventory demand.</p>
            </div>
            
            {channels.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 border-dashed text-center">
                    <p className="text-slate-500 font-medium">No order sources detected in your workspace.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {channels.map((channel) => (
                        <div 
                            key={channel} 
                            className={`bg-white p-5 rounded-2xl shadow-sm border transition-all duration-300 relative overflow-hidden group
                            ${channelToggles[channel] ? 'border-blue-200 ring-1 ring-blue-500/10' : 'border-slate-200 opacity-75 grayscale-[50%]'}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl transition-colors ${channelToggles[channel] ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Store size={22} />
                                </div>
                                {/* Modern SaaS Toggle Switch */}
                                <button 
                                    onClick={() => toggleChannel(channel)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                    ${channelToggles[channel] ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm
                                    ${channelToggles[channel] ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <h3 className={`font-bold text-base capitalize truncate ${channelToggles[channel] ? 'text-slate-900' : 'text-slate-500'}`}>
                                {formatChannelName(channel)}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                {channelToggles[channel] ? 'Syncing active' : 'Syncing paused'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
          </section>

          {/* SECTION 2: DANGER ZONE */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle size={20} />
                Danger Zone
              </h2>
            </div>

            <div className="bg-red-50/50 p-6 rounded-2xl border border-red-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-red-900">Clear Workspace Data</h3>
                    <p className="text-sm text-red-700/80 mt-1 max-w-xl">
                        This will permanently delete the current inventory dataset from the local environment and return you to the upload screen. This action cannot be reversed.
                    </p>
                </div>
                <button 
                    onClick={handleClearData} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 font-bold transition-all shadow-sm"
                >
                    <Trash2 size={18} /> 
                    <span>Reset Workspace</span>
                </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Settings;
