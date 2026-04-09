import { useInventoryContext } from '../context/InventoryContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Package, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { inventory } = useInventoryContext();

  // 1. KPI CALCULATIONS
  const totalStock = inventory.reduce((acc, item) => acc + item.warehouseStock, 0);
  const conflictCount = inventory.filter(i => i.status === 'Conflict').length;
  const stockoutCount = inventory.filter(i => i.status === 'Stockout').length;
  const syncedCount = inventory.filter(i => i.status === 'Synced').length;

  // 2. MAIN CHART DATA (Top 10 High-Demand Items only to keep UI clean)
  const topProducts = [...inventory]
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 10);

  const chartData = topProducts.map(item => ({
    // Take first two words of product name for cleaner labels
    name: item.productName ? item.productName.split(' ').slice(0, 2).join(' ') : 'Unknown', 
    stock: item.warehouseStock,
    orders: item.totalOrders 
  }));

  // 3. HEALTH DONUT CHART DATA
  const healthData = [
    { name: 'Synced', value: syncedCount, color: '#10b981' }, // Emerald
    { name: 'Conflicts', value: conflictCount, color: '#ef4444' }, // Red
    { name: 'Stockouts', value: stockoutCount, color: '#f97316' }  // Orange
  ].filter(d => d.value > 0); // Hide empty slices

  // 4. ACTION ITEMS (Top critical issues to fix immediately)
  const actionItems = inventory
    .filter(i => i.status !== 'Synced')
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 4);

  return (
    <div className="ml-64 min-h-screen bg-slate-50 p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Warehouse Metrics & Order Velocity</p>
      </header>

      {/* TOP ROW: KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <Package size={80} />
            </div>
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Total Inventory</p>
            <h3 className="text-3xl font-black text-slate-900 mt-2">{totalStock.toLocaleString()}</h3>
            <p className="text-sm text-emerald-600 font-medium mt-2">Units in warehouse</p>
        </div>
        
        {/* Conflicts (Gradient Background if critical) */}
        <div className={`p-6 rounded-2xl shadow-sm border relative overflow-hidden ${conflictCount > 0 ? 'bg-gradient-to-br from-red-50 to-white border-red-100' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className={`text-sm font-semibold uppercase tracking-wider ${conflictCount > 0 ? 'text-red-500' : 'text-slate-500'}`}>Active Conflicts</p>
                    <h3 className={`text-3xl font-black mt-2 ${conflictCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                        {conflictCount}
                    </h3>
                </div>
                <div className={`p-3 rounded-xl ${conflictCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    <AlertTriangle size={24}/>
                </div>
            </div>
            <p className={`text-sm font-medium mt-2 ${conflictCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                {conflictCount > 0 ? 'Immediate action required' : 'All orders can be fulfilled'}
            </p>
        </div>

        {/* Stockouts */}
        <div className={`p-6 rounded-2xl shadow-sm border ${stockoutCount > 0 ? 'bg-gradient-to-br from-orange-50 to-white border-orange-100' : 'bg-white border-slate-100'}`}>
             <div className="flex justify-between items-start">
                <div>
                    <p className={`text-sm font-semibold uppercase tracking-wider ${stockoutCount > 0 ? 'text-orange-500' : 'text-slate-500'}`}>Stockouts</p>
                    <h3 className={`text-3xl font-black mt-2 ${stockoutCount > 0 ? 'text-orange-700' : 'text-slate-900'}`}>
                        {stockoutCount}
                    </h3>
                </div>
                <div className={`p-3 rounded-xl ${stockoutCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                    <TrendingUp size={24}/>
                </div>
            </div>
            <p className={`text-sm font-medium mt-2 ${stockoutCount > 0 ? 'text-orange-600' : 'text-slate-500'}`}>Items completely depleted</p>
        </div>
      </div>

      {/* MIDDLE ROW: Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart (Takes up 2/3 of the screen) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 h-[420px] flex flex-col">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Demand vs. Supply (Top 10)</h3>
                <p className="text-sm text-slate-500">Highest volume items currently in the system</p>
            </div>
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} 
                />
                <Bar dataKey="stock" fill="#0f172a" radius={[4, 4, 0, 0]} name="Warehouse Stock" barSize={32} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Orders" barSize={32} />
            </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Right Sidebar Stack */}
        <div className="space-y-6 lg:col-span-1">
            
            {/* Health Donut Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[200px] flex items-center">
                <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={healthData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                                {healthData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-1/2 pl-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Inventory Health</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Synced</li>
                        <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Conflict</li>
                        <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Stockout</li>
                    </ul>
                </div>
            </div>

            {/* Critical Action Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 h-[196px] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert size={16} className="text-red-500"/> Action Items
                    </h3>
                    <Link to="/inventory" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Fix All <ArrowRight size={14}/>
                    </Link>
                </div>
                <div className="p-4 overflow-y-auto">
                    {actionItems.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No critical issues! 🎉</p>
                    ) : (
                        <ul className="space-y-3">
                            {actionItems.map(item => (
                                <li key={item.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className="truncate pr-4">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{item.productName}</p>
                                        <p className="text-xs text-slate-500">Short {item.totalOrders - item.warehouseStock} units</p>
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${item.status === 'Conflict' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {item.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;