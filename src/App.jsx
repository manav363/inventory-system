import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import UploadScreen from './components/UploadScreen';
import { InventoryProvider, useInventoryContext } from './context/InventoryContext';

const MainLayout = () => {
  const { isLoaded } = useInventoryContext();

  if (!isLoaded) {
    return <UploadScreen />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <InventoryProvider>
      <Router>
        <MainLayout />
      </Router>
    </InventoryProvider>
  );
}

export default App;