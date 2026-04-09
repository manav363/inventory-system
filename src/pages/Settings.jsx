import { useState, useEffect } from 'react';
import { Store, Bell, Trash2, ShieldAlert, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useInventoryContext } from '../context/InventoryContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { setRawInventory, setIsLoaded, channels, channelToggles, toggleChannel } = useInventoryContext();
  const navigate = useNavigate();

  // State for the Alert Slider
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Micro-interaction: Show a brief "Saved" checkmark when the slider stops moving
  useEffect(() => {
    setShowSaveConfirm(true);
    const timer = setTimeout(() => setShowSaveConfirm(false), 2000);
    return () => clearTimeout(timer);
  }, [alertThreshold]);

  const handleClearData = () => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to clear all inventory data? This cannot be undone.")) {
      setRawInventory([]);
      setIsLoaded(false);
      navigate('/');
    }
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

          {/* SECTION 2: GLOBAL PREFERENCES */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="text-orange-500" size={20} />
                Notification Thresholds
              </h2>
              <p className="text-sm text-slate-500">Configure when the system should warn you about low stock.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="max-w-2xl flex flex-col md:flex-row md:items-center gap-8">
                    <div className="flex-1">
                        <label className="text-sm font-bold text-slate-700 block mb-3">Global Low Stock Warning</label>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-400">0</span>
                            {/* Visual Range Slider */}
                            <input 
                                type="range" 
                                min="0" 
                                max="50" 
                                value={alertThreshold}
                                onChange={(e) => setAlertThreshold(e.target.value)}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <span className="text-xs font-bold text-slate-400">50</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center min-w-[120px]">
                        <div className="relative">
                            <input 
                                type="number" 
                                value={alertThreshold}
                                onChange={(e) => setAlertThreshold(e.target.value)}
                                className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-black text-xl text-center text-slate-800 transition-all"
                            />
                            {/* Saved Feedback Checkmark */}
                            {showSaveConfirm && (
                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm animate-bounce">
                                    <CheckCircle2 size={14} />
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium mt-2">Units remaining</span>
                    </div>
                </div>
            </div>
          </section>

          {/* SECTION 3: DANGER ZONE */}
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