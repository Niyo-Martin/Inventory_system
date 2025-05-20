import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Package, Clock, BarChart3, ShoppingCart, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string): string => {
    return location.pathname === path ? "nav-item active" : "nav-item";
  };

  const handleLogout = (): void => {
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
        <Link to="/reports" className={isActive('/reports')}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </Link>
        <Link to="/purchase-orders" className={isActive('/purchase-orders')}>
          <ShoppingCart size={20} />
          <span>Purchase Orders</span>
        </Link>
        <button onClick={handleLogout} className="nav-item">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;