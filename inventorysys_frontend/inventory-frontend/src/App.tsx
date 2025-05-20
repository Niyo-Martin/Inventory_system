import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import TransactionHistory from './pages/TransactionHistory';
import Reports from './pages/Reports';
import PurchaseOrders from './pages/PurchaseOrders';
import CreatePurchaseOrder from './pages/CreatePurchaseOrder';
import Suppliers from './pages/Suppliers';
import SupplierForm from './pages/SupplierForm';
import Returns from './pages/Returns';
import Login from './auth/Login';
import Register from './auth/Register';
import { LayoutGrid, Package, Clock, BarChart3, ShoppingCart, LogOut, User, Truck, RotateCcw, AlertCircle, Folder } from 'lucide-react';
import './App.css';
import Alerts from "./pages/alerts";
import Categories from './components/categories/categories';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => (
    location.pathname === path ? "nav-item active" : "nav-item"
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="sidebar">
      <div className="logo">Inventory System</div>
      <nav className="nav-menu">
        <Link to="/" className={isActive('/')}>
          <LayoutGrid size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/products" className={isActive('/products')}>
          <Package size={20} />
          <span>Products</span>
        </Link>
        <Link to="/stock" className={isActive('/stock')}>
          <Package size={20} />
          <span>Stock</span>
        </Link>
        <Link to="/transactions" className={isActive('/transactions')}>
          <Clock size={20} />
          <span>Transactions</span>
        </Link>
        <Link to="/suppliers" className={isActive('/suppliers')}>
          <Truck size={20} />
          <span>Suppliers</span>
        </Link>
        <Link to="/purchase-orders" className={isActive('/purchase-orders')}>
          <ShoppingCart size={20} />
          <span>Purchase Orders</span>
        </Link>
        <Link to="/returns" className={isActive('/returns')}>
          <RotateCcw size={20} />
          <span>Returns</span>
        </Link>
        <Link to="/reports" className={isActive('/reports')}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </Link>
        <Link to="/alerts" className={isActive('/alerts')}>
          <AlertCircle size={20} />
          <span>Alerts</span>
        </Link>
        <Link to="/categories" className={isActive('/categories')}>
          <Folder size={20} />
          <span>Categories</span>
        </Link>
        <button onClick={handleLogout} className="nav-item text-red-300 hover:text-red-100 hover:bg-red-600/20">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <div></div> {/* Empty div for spacing */}
          <div className="user-profile">
            <User size={20} className="user-icon" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

function App() {
  const { token } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" replace /> : <Register />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute>
            <MainLayout>
              <Products />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/stock" element={
          <ProtectedRoute>
            <MainLayout>
              <Stock />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute>
            <MainLayout>
              <TransactionHistory />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/suppliers" element={
          <ProtectedRoute>
            <MainLayout>
              <Suppliers />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/add-supplier" element={
          <ProtectedRoute>
            <MainLayout>
              <SupplierForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/edit-supplier/:supplierId" element={
          <ProtectedRoute>
            <MainLayout>
              <SupplierForm />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/purchase-orders" element={
          <ProtectedRoute>
            <MainLayout>
              <PurchaseOrders />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/create-purchase-order" element={
          <ProtectedRoute>
            <MainLayout>
              <CreatePurchaseOrder />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/returns" element={
          <ProtectedRoute>
            <MainLayout>
              <Returns />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <MainLayout>
              <Reports />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <MainLayout>
              <Alerts />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/categories" element={
          <ProtectedRoute>
            <MainLayout>
              <Categories />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={token ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;