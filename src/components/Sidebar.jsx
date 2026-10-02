import { LayoutDashboard, Package, Settings, LogOut, Hexagon, FileSpreadsheet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import useInventoryContext from '../context/useInventoryContext';

const Sidebar = () => {
  const { fileName, inventory } = useInventoryContext();
  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // There is no account: closing the workspace discards the in-memory data and returns to upload.
  const handleCloseWorkspace = () => {
    window.location.reload();
  };

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 shadow-sm z-10">
      
      {/* BRANDING */}
      <div className="p-6 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-sm shadow-blue-500/30">
            {/* Swapped the icon to a Hexagon for a cool, tech-focused logo */}
            <Hexagon className="text-white fill-white" size={20} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SyncPulse</h1>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            // NavLink gives us an 'isActive' boolean we can use to dynamically style the buttons
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 group ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={20} 
                  className={`transition-transform duration-200 ${
                    isActive 
                      ? 'scale-110' 
                      : 'group-hover:scale-110 text-slate-400 group-hover:text-blue-500'
                  }`} 
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* WORKSPACE / USER INFO */}
      <div className="p-4 border-t border-slate-100">
        
        {/* The file the workspace was built from */}
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-slate-50 border border-slate-100">
            <FileSpreadsheet size={24} className="text-slate-400 shrink-0" />
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate" title={fileName}>{fileName || 'No file loaded'}</p>
                <p className="text-xs font-medium text-slate-500 truncate">{inventory.length.toLocaleString()} rows</p>
            </div>
        </div>

        <button 
          onClick={handleCloseWorkspace} 
          className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:shadow-sm rounded-xl w-full font-bold transition-all group cursor-pointer"
        >
          {/* Micro-interaction: The icon slides left slightly on hover */}
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Close workspace</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;