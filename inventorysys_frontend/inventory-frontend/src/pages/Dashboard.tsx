import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, DollarSign, Clock, RefreshCcw, Bell, Folder } from 'lucide-react';
import api from '../api/client';

// Define types
type DashboardData = {
  totalProducts: number;
  lowStockItems: number;
  totalStockValue: number;
  recentTransactions: number;
  activeAlerts: number;
  totalCategories: number; // Add this field
};

type Transaction = {
  transaction_id: number;
  product_id: number;
  product_name?: string;
  transaction_type: "in" | "out";
  quantity: number;
  created_at: string;
  amount?: number;
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalProducts: 0,
    lowStockItems: 0,
    totalStockValue: 0,
    recentTransactions: 0,
    activeAlerts: 0,
    totalCategories: 0 // Initialize with 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // First check API connectivity
        try {
          await api.get('/');
        } catch (err) {
          setError('Cannot connect to the API server. Please check if your backend is running.');
          setIsLoading(false);
          return;
        }

        // Get product count
        const productsRes = await api.get('/products');
        
        // Get low stock items
        const lowStockRes = await api.get('/reports/stock-status', {
          params: {
            status: 'LOW_STOCK'
          }
        });
        
        // Get stock valuation
        const valuationRes = await api.get('/reports/valuation');
        
        // Get recent transactions
        const transactionsRes = await api.get('/transactions');
        
        // Get active alerts count
        const alertsRes = await api.get('/alerts', {
          params: {
            resolved: false
          }
        });
        
        // Get categories count - add this API call
        const categoriesRes = await api.get('/categories');
        
        // Processing the responses
        const totalProducts = productsRes.data.length;
        const lowStockItems = Array.isArray(lowStockRes.data) ? lowStockRes.data.length : 0;
        
        // Calculate total value from valuation endpoint
        const totalValue = valuationRes.data.reduce(
          (sum: number, item: any) => sum + (item.total_value || 0), 
          0
        );
        
        // Get active alerts count
        const activeAlerts = Array.isArray(alertsRes.data) ? alertsRes.data.length : 0;
        
        // Get total categories count
        const totalCategories = Array.isArray(categoriesRes.data) ? categoriesRes.data.length : 0;
        
        setDashboardData({
          totalProducts,
          lowStockItems,
          totalStockValue: totalValue,
          recentTransactions: transactionsRes.data.length,
          activeAlerts,
          totalCategories // Include the categories count
        });
        
        // Get the 10 most recent transactions
        setRecentTransactions(transactionsRes.data.slice(0, 10));
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="p-4">
      {/* Added a content-container div to center the dashboard content */}
      <div className="content-container">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded flex justify-between items-center">
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
            <button 
              onClick={handleRefresh} 
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center"
            >
              <RefreshCcw size={16} className="mr-2" /> Retry
            </button>
          </div>
        )}
        
        {/* Dashboard Cards */}
        <div className="dashboard-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          {/* Total Products Card */}
          <div className="card bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
            <div className="flex items-center">
              <div className="card-icon products-icon bg-blue-100 p-2 rounded-full">
                <Package size={18} className="text-blue-500" />
              </div>
              <div className="ml-4">
                <div className="card-title text-gray-500 text-sm uppercase font-semibold">Total Products</div>
                <div className="card-value text-2xl font-bold text-gray-800">{dashboardData.totalProducts}</div>
              </div>
            </div>
            <Link to="/products" className="card-link block text-blue-500 hover:text-blue-700 text-sm mt-4">
              View all products
            </Link>
          </div>

          {/* Categories Card - New */}
          <div className="card bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
            <div className="flex items-center">
              <div className="card-icon categories-icon bg-indigo-100 p-2 rounded-full">
                <Folder size={18} className="text-indigo-500" />
              </div>
              <div className="ml-4">
                <div className="card-title text-gray-500 text-sm uppercase font-semibold">Categories</div>
                <div className="card-value text-2xl font-bold text-gray-800">{dashboardData.totalCategories}</div>
              </div>
            </div>
            <Link to="/categories" className="card-link block text-indigo-500 hover:text-indigo-700 text-sm mt-4">
              Manage categories
            </Link>
          </div>

          {/* Low Stock Card */}
          <div className="card bg-white rounded-lg shadow p-6 border-t-4 border-yellow-500">
            <div className="flex items-center">
              <div className="card-icon low-stock-icon bg-yellow-100 p-2 rounded-full">
                <AlertTriangle size={18} className="text-yellow-500" />
              </div>
              <div className="ml-4">
                <div className="card-title text-gray-500 text-sm uppercase font-semibold">Low Stock Items</div>
                <div className="card-value text-2xl font-bold text-gray-800">{dashboardData.lowStockItems}</div>
              </div>
            </div>
            <Link to="/reports" className="card-link block text-yellow-500 hover:text-yellow-700 text-sm mt-4">
              View report
            </Link>
          </div>

          {/* Alerts Card */}
          <div className="card bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
            <div className="flex items-center">
              <div className="card-icon alerts-icon bg-red-100 p-2 rounded-full">
                <Bell size={18} className="text-red-500" />
              </div>
              <div className="ml-4">
                <div className="card-title text-gray-500 text-sm uppercase font-semibold">Active Alerts</div>
                <div className="card-value text-2xl font-bold text-gray-800">{dashboardData.activeAlerts}</div>
              </div>
            </div>
            <Link to="/alerts" className="card-link block text-red-500 hover:text-red-700 text-sm mt-4">
              Manage alerts
            </Link>
          </div>

          {/* Total Stock Value Card */}
          <div className="card bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
            <div className="flex items-center">
              <div className="card-icon value-icon bg-green-100 p-2 rounded-full">
                <DollarSign size={18} className="text-green-500" />
              </div>
              <div className="ml-4">
                <div className="card-title text-gray-500 text-sm uppercase font-semibold">Total Stock Value</div>
                <div className="card-value text-2xl font-bold text-gray-800">${dashboardData.totalStockValue.toLocaleString()}</div>
              </div>
            </div>
            <Link to="/reports" className="card-link block text-green-500 hover:text-green-700 text-sm mt-4">
              View valuation
            </Link>
          </div>

          {/* Recent Transactions Card */}
          <div className="card bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
            <div className="flex items-center">
              <div className="card-icon transactions-icon bg-purple-100 p-2 rounded-full">
                <Clock size={18} className="text-purple-500" />
              </div>
              <div className="ml-4">
                <div className="card-title text-gray-500 text-sm uppercase font-semibold">Recent Transactions</div>
                <div className="card-value text-2xl font-bold text-gray-800">{dashboardData.recentTransactions}</div>
                <div className="card-subtitle text-sm text-gray-600">transactions</div>
              </div>
            </div>
            <Link to="/transactions" className="card-link block text-purple-500 hover:text-purple-700 text-sm mt-4">
              View all transactions
            </Link>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="transactions-section bg-white rounded-lg shadow p-6 mb-8">
          <div className="section-header-container flex justify-between items-center mb-6">
            <h2 className="section-header text-xl font-semibold text-gray-800">Recent Transactions</h2>
            <Link to="/transactions" className="view-all-link text-blue-500 hover:text-blue-700 text-sm">
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="transactions-table min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-data px-6 py-4 text-center text-sm text-gray-500">No recent transactions found</td>
                  </tr>
                ) : (
                  recentTransactions.map((txn) => (
                    <tr key={txn.transaction_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.transaction_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(txn.created_at).toLocaleDateString()}</td>
                      <td className={`px-6 py-4 whitespace-nowrap ${txn.transaction_type === 'in' ? 'type-in text-green-600' : 'type-out text-yellow-600'}`}>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          txn.transaction_type === 'in' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {txn.transaction_type === 'in' ? 'Inbound' : 'Outbound'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{txn.product_name || `Product #${txn.product_id}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{txn.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="quick-links-section bg-white rounded-lg shadow p-6">
          <h2 className="section-header text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
          <div className="flex justify-end space-x-4 flex-wrap">
            <Link 
              to="/create-purchase-order" 
              className="quick-link-btn bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg text-center transition-colors mb-2"
            >
              Create Purchase Order
            </Link>
            <Link 
              to="/products" 
              className="quick-link-btn bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg text-center transition-colors mb-2"
            >
              Add New Product
            </Link>
            <Link 
              to="/categories" 
              className="quick-link-btn bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-lg text-center transition-colors mb-2"
            >
              Manage Categories
            </Link>
            <Link 
              to="/stock" 
              className="quick-link-btn bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg text-center transition-colors mb-2"
            >
              Update Stock
            </Link>
            {dashboardData.activeAlerts > 0 && (
              <Link 
                to="/alerts" 
                className="quick-link-btn bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg text-center transition-colors mb-2"
              >
                View Alerts ({dashboardData.activeAlerts})
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;