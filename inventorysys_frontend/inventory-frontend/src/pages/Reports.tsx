import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, AlertTriangle, Clock, RefreshCw, Filter, BarChart } from "lucide-react";
import api from "../api/client";

// Define types for the API responses
interface ValuationItem {
  product_id?: number;
  name?: string;
  quantity?: number;
  unit_cost?: number;
  total_value: number;
  warehouse?: string;
}

interface StockSummaryItem {
  product_id: number;
  name: string;
  sku: string;
  quantity: number;
  reorder_level: number;
  stock_status?: string;
  category?: string;
  supplier?: string;
  warehouse?: string;
}

interface Transaction {
  transaction_id: number;
  product_id: number;
  warehouse_id: number;
  transaction_type: "in" | "out" | "transfer" | "adjust";
  quantity: number;
  created_at: string;
  note?: string;
}

interface PurchaseOrderAnalysis {
  po_id: number;
  supplier_name: string;
  order_date: string;
  expected_delivery: string;
  status: string;
  item_count: number;
  total_value: number;
  ordered_by: string;
}

interface FilterState {
  warehouse_id: number | null;
  category_id: number | null;
  supplier_id: number | null;
  product_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  low_stock_only: boolean;
}

export default function Reports() {
  const [totalValue, setTotalValue] = useState<number>(0);
  const [lowStock, setLowStock] = useState<StockSummaryItem[]>([]);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [poAnalysis, setPOAnalysis] = useState<PurchaseOrderAnalysis[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);
  
  // New filter state
  const [filters, setFilters] = useState<FilterState>({
    warehouse_id: null,
    category_id: null,
    supplier_id: null,
    product_id: null,
    start_date: null,
    end_date: null,
    status: null,
    low_stock_only: false
  });

  // Warehouse, category, supplier options for dropdowns
  const [warehouses, setWarehouses] = useState<{warehouse_id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<{category_id: number, name: string}[]>([]);
  const [suppliers, setSuppliers] = useState<{supplier_id: number, name: string}[]>([]);
  const [products, setProducts] = useState<{product_id: number, name: string}[]>([]);

  useEffect(() => {
    // Fetch filter options
    const fetchOptions = async () => {
      try {
        const [warehouseRes, categoryRes, supplierRes, productRes] = await Promise.all([
          api.get("/warehouses"),
          api.get("/categories"),
          api.get("/suppliers"),
          api.get("/products")
        ]);
        
        setWarehouses(warehouseRes.data);
        setCategories(categoryRes.data);
        setSuppliers(supplierRes.data);
        setProducts(productRes.data);
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    };
    
    fetchOptions();
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Use the new stored procedure endpoints with filters
      const [valRes, stockRes, txnRes] = await Promise.all([
        api.get<ValuationItem[]>("/reports/valuation", {
          params: {
            warehouse_id: filters.warehouse_id,
            low_stock_only: filters.low_stock_only
          }
        }),
        api.get<StockSummaryItem[]>("/reports/stock-status", {
          params: {
            category_id: filters.category_id,
            supplier_id: filters.supplier_id,
            status: "LOW_STOCK" // Default to showing low stock items
          }
        }),
        api.get<Transaction[]>("/reports/movement", {
          params: {
            product_id: filters.product_id,
            start_date: filters.start_date,
            end_date: filters.end_date
          }
        })
      ]);

      // Calculate total value from valuation response
      const calculatedValue = Array.isArray(valRes.data) 
        ? valRes.data.reduce((sum, item) => sum + (item.total_value || 0), 0)
        : 0;
      
      setTotalValue(calculatedValue);
      
      // Set low stock items
      setLowStock(Array.isArray(stockRes.data) ? stockRes.data : []);
      
      // Get most recent transactions (limit to 5)
      const transactions = Array.isArray(txnRes.data) 
        ? txnRes.data.slice(0, 5) 
        : [];
      
      setRecentTxns(transactions);
      
      setError("");
    } catch (err) {
      console.error("Error loading reports:", err);
      setError("Failed to load reports data. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    setIsLoading(true);
    setActiveReport(reportType);
    try {
      switch (reportType) {
        case "inventory_valuation":
          const valRes = await api.get<ValuationItem[]>("/reports/valuation", {
            params: {
              warehouse_id: filters.warehouse_id,
              low_stock_only: filters.low_stock_only
            }
          });
          
          // Set data and show the appropriate section
          setTotalValue(valRes.data.reduce((sum, item) => sum + (item.total_value || 0), 0));
          break;

        case "product_movement":
          const moveRes = await api.get<Transaction[]>("/reports/movement", {
            params: {
              product_id: filters.product_id,
              start_date: filters.start_date,
              end_date: filters.end_date
            }
          });
          
          setRecentTxns(moveRes.data);
          break;

        case "purchase_orders":
          const poRes = await api.get<PurchaseOrderAnalysis[]>("/reports/purchase-orders", {
            params: {
              supplier_id: filters.supplier_id,
              start_date: filters.start_date,
              end_date: filters.end_date,
              status: filters.status
            }
          });
          
          setPOAnalysis(poRes.data);
          break;
          
        default:
          break;
      }
    } catch (err) {
      console.error(`Error generating ${reportType} report:`, err);
      setError(`Failed to generate the ${reportType.replace('_', ' ')} report. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchReportData();
    if (activeReport) {
      generateReport(activeReport);
    }
  };

  const resetFilters = () => {
    setFilters({
      warehouse_id: null,
      category_id: null,
      supplier_id: null,
      product_id: null,
      start_date: null,
      end_date: null,
      status: null,
      low_stock_only: false
    });
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return date.toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>Reports Dashboard</h1>
        <div style={{ textAlign: "center", padding: "40px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Reports Dashboard</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              backgroundColor: showFilters ? "#4b5563" : "#f3f4f6", 
              color: showFilters ? "white" : "#374151", 
              padding: "8px 16px", 
              borderRadius: "4px", 
              border: "none", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Filter size={16} />
            <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
          </button>
          <button 
            onClick={() => {
              resetFilters();
              setTimeout(fetchReportData, 0);
            }}
            style={{ 
              backgroundColor: "#3b82f6", 
              color: "white", 
              padding: "8px 16px", 
              borderRadius: "4px", 
              border: "none", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: "#fee2e2", 
          borderLeft: "4px solid #ef4444", 
          color: "#b91c1c", 
          padding: "16px", 
          marginBottom: "20px", 
          borderRadius: "4px" 
        }}>
          <p style={{ fontWeight: "bold" }}>Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Filters Section */}
      {showFilters && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Report Filters</h2>
            <button 
              onClick={resetFilters}
              style={{
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "4px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              Reset Filters
            </button>
          </div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
            gap: "16px",
            marginBottom: "16px" 
          }}>
            {/* Warehouse Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4b5563" }}>
                Warehouse
              </label>
              <select
                value={filters.warehouse_id || ""}
                onChange={(e) => handleFilterChange("warehouse_id", e.target.value ? parseInt(e.target.value) : null)}
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: "4px", 
                  border: "1px solid #d1d5db" 
                }}
              >
                <option value="">All Warehouses</option>
                {warehouses.map(wh => (
                  <option key={wh.warehouse_id} value={wh.warehouse_id}>{wh.name}</option>
                ))}
              </select>
            </div>
            
            {/* Category Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4b5563" }}>
                Category
              </label>
              <select
                value={filters.category_id || ""}
                onChange={(e) => handleFilterChange("category_id", e.target.value ? parseInt(e.target.value) : null)}
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: "4px", 
                  border: "1px solid #d1d5db" 
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            {/* Supplier Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4b5563" }}>
                Supplier
              </label>
              <select
                value={filters.supplier_id || ""}
                onChange={(e) => handleFilterChange("supplier_id", e.target.value ? parseInt(e.target.value) : null)}
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: "4px", 
                  border: "1px solid #d1d5db" 
                }}
              >
                <option value="">All Suppliers</option>
                {suppliers.map(sup => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>{sup.name}</option>
                ))}
              </select>
            </div>
            
            {/* Product Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4b5563" }}>
                Product
              </label>
              <select
                value={filters.product_id || ""}
                onChange={(e) => handleFilterChange("product_id", e.target.value ? parseInt(e.target.value) : null)}
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: "4px", 
                  border: "1px solid #d1d5db" 
                }}
              >
                <option value="">All Products</option>
                {products.map(prod => (
                  <option key={prod.product_id} value={prod.product_id}>{prod.name}</option>
                ))}
              </select>
            </div>
            
            {/* Date Range - Start */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4b5563" }}>
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date || ""}
                onChange={(e) => handleFilterChange("start_date", e.target.value || null)}
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: "4px", 
                  border: "1px solid #d1d5db" 
                }}
              />
            </div>
            
            {/* Date Range - End */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4b5563" }}>
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date || ""}
                onChange={(e) => handleFilterChange("end_date", e.target.value || null)}
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: "4px", 
                  border: "1px solid #d1d5db" 
                }}
              />
            </div>
            
            {/* Status Filter */}
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", color: "#4b5563" }}>
                Stock Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value || null)}
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: "4px", 
                  border: "1px solid #d1d5db" 
                }}
              >
                <option value="">All Statuses</option>
                <option value="OK">OK</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
            
            {/* Low Stock Checkbox */}
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="checkbox"
                id="low-stock-only"
                checked={filters.low_stock_only}
                onChange={(e) => handleFilterChange("low_stock_only", e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              <label htmlFor="low-stock-only" style={{ fontSize: "14px", color: "#4b5563" }}>
                Show only low stock items
              </label>
            </div>
          </div>
          
          <div>
            <button
              onClick={applyFilters}
              style={{
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "8px 16px",
                cursor: "pointer"
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Advanced Reports Section */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>Advanced Reports</h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          <div>
            <button
              onClick={() => generateReport("inventory_valuation")}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: activeReport === "inventory_valuation" ? "#0f766e" : "#f0fdfa",
                color: activeReport === "inventory_valuation" ? "white" : "#0f766e",
                border: "1px solid #99f6e4",
                borderRadius: "6px",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <DollarSign size={16} />
                Inventory Valuation
              </div>
              <div style={{ fontSize: "14px" }}>View stock value by warehouse</div>
            </button>
          </div>
          
          <div>
            <button
              onClick={() => generateReport("product_movement")}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: activeReport === "product_movement" ? "#1e40af" : "#eff6ff",
                color: activeReport === "product_movement" ? "white" : "#1e40af",
                border: "1px solid #bfdbfe",
                borderRadius: "6px",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={16} />
                Product Movement
              </div>
              <div style={{ fontSize: "14px" }}>Analyze stock movement patterns</div>
            </button>
          </div>
          
          <div>
            <button
              onClick={() => generateReport("purchase_orders")}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: activeReport === "purchase_orders" ? "#92400e" : "#fef3c7",
                color: activeReport === "purchase_orders" ? "white" : "#92400e",
                border: "1px solid #fcd34d",
                borderRadius: "6px",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <div style={{ fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart size={16} />
                Purchase Order Analysis
              </div>
              <div style={{ fontSize: "14px" }}>Review purchase history and trends</div>
            </button>
          </div>
        </div>
      </div>

      {/* Value Card */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          <DollarSign style={{ color: "#059669", marginRight: "8px" }} size={24} />
          <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Total Stock Value</h2>
        </div>
        <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>Current inventory valuation</p>
        <Link to="/products" style={{ fontSize: "14px", color: "#2563eb", textDecoration: "none" }}>
          View inventory details →
        </Link>
      </div>

      {/* Low Stock Card */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          <AlertTriangle style={{ color: "#f59e0b", marginRight: "8px" }} size={24} />
          <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Low Stock Items</h2>
        </div>
        <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>{lowStock.length}</p>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>Products need reordering</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link to="/stock" style={{ fontSize: "14px", color: "#2563eb", textDecoration: "none" }}>
            View stock levels →
          </Link>
          <Link to="/alerts" style={{ fontSize: "14px", color: "#dc2626", textDecoration: "none" }}>
            Manage alerts →
          </Link>
        </div>
      </div>

      {/* Low Stock List */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Low Stock Products</h2>
          <Link to="/stock" style={{ fontSize: "14px", color: "#2563eb", textDecoration: "none" }}>View all →</Link>
        </div>
        
        {lowStock.length === 0 ? (
          <div style={{ 
            backgroundColor: "#ecfdf5", 
            padding: "16px", 
            borderRadius: "4px", 
            color: "#065f46" 
          }}>
            <p>All products are sufficiently stocked. No items need reordering at this time.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Product</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>SKU</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Quantity</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Reorder Level</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.product_id}>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{item.name}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{item.sku}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{item.reorder_level}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "9999px", 
                        fontSize: "12px", 
                        fontWeight: "500",
                        backgroundColor: item.quantity === 0 ? "#fee2e2" : "#fef3c7",
                        color: item.quantity === 0 ? "#b91c1c" : "#92400e"
                      }}>
                        {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
            {activeReport === "product_movement" ? "Product Movement Analysis" : "Recent Transactions"}
          </h2>
          <Link to="/transactions" style={{ fontSize: "14px", color: "#2563eb", textDecoration: "none" }}>View all →</Link>
        </div>
        
        {recentTxns.length === 0 ? (
          <div style={{ 
            backgroundColor: "#eff6ff", 
            padding: "16px", 
            borderRadius: "4px", 
            color: "#1e40af" 
          }}>
            <p>No transaction history available for the selected criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Quantity</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((txn) => (
                  <tr key={txn.transaction_id}>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>#{txn.transaction_id}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{formatDate(txn.created_at)}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "9999px", 
                        fontSize: "12px", 
                        fontWeight: "500",
                        backgroundColor: txn.transaction_type === 'in' ? "#dcfce7" : 
                                        txn.transaction_type === 'out' ? "#ffedd5" :
                                        txn.transaction_type === 'transfer' ? "#dbeafe" : "#f3e8ff",
                        color: txn.transaction_type === 'in' ? "#166534" : 
                              txn.transaction_type === 'out' ? "#9a3412" :
                              txn.transaction_type === 'transfer' ? "#1e40af" : "#6b21a8"
                      }}>
                        {txn.transaction_type === 'in' ? 'Inbound' : 
                         txn.transaction_type === 'out' ? 'Outbound' : 
                         txn.transaction_type === 'transfer' ? 'Transfer' : 'Adjustment'}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{txn.quantity}</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{txn.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase Order Analysis Section - Only show when that report is selected */}
      {activeReport === "purchase_orders" && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Purchase Order Analysis</h2>
            <Link to="/purchase-orders" style={{ fontSize: "14px", color: "#2563eb", textDecoration: "none" }}>View all →</Link>
          </div>
          
          {poAnalysis.length === 0 ? (
            <div style={{ 
              backgroundColor: "#fef3c7", 
              padding: "16px", 
              borderRadius: "4px", 
              color: "#92400e" 
            }}>
              <p>No purchase order data available for the selected criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>PO #</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Supplier</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Order Date</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Expected Delivery</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Items</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {poAnalysis.map((po) => (
                    <tr key={po.po_id}>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>#{po.po_id}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{po.supplier_name}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{formatDate(po.order_date)}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{formatDate(po.expected_delivery)}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: "9999px", 
                          fontSize: "12px", 
                          fontWeight: "500",
                          backgroundColor: 
                            po.status === "pending" ? "#fef3c7" :
                            po.status === "received" ? "#dcfce7" :
                            po.status === "cancelled" ? "#fee2e2" : "#f3f4f6",
                          color: 
                            po.status === "pending" ? "#92400e" :
                            po.status === "received" ? "#065f46" :
                            po.status === "cancelled" ? "#b91c1c" : "#374151"
                        }}>
                          {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>{po.item_count}</td>
                      <td style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: "500" }}>
                        ${po.total_value.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}