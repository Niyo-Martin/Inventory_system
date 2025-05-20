import { useEffect, useState } from "react";
import api from "../api/client";
import { RotateCcw, AlertTriangle, X, RefreshCw, ArrowLeft, ArrowRight, Calendar } from "lucide-react";

// Define types
type Product = {
  product_id: number;
  name: string;
  sku: string;
};

type Warehouse = {
  warehouse_id: number;
  name: string;
};

type Return = {
  return_id: number;
  product_id: number;
  product_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  return_type: "from_customer" | "to_supplier";
  quantity: number;
  reason: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
};

type NewReturn = {
  product_id: string;
  warehouse_id: string;
  return_type: "from_customer" | "to_supplier";
  quantity: string;
  reason: string;
};

export default function Returns() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [newReturn, setNewReturn] = useState<NewReturn>({
    product_id: "",
    warehouse_id: "",
    return_type: "from_customer",
    quantity: "",
    reason: ""
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [returnsRes, productsRes, warehousesRes] = await Promise.all([
        api.get("/returns"),
        api.get("/products"),
        // If you don't have warehouses endpoint, create a mock one or skip
        // api.get("/warehouses")
        Promise.resolve({ data: [{ warehouse_id: 1, name: "Main Warehouse" }] })
      ]);
      
      setReturns(returnsRes.data);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
      setError("");
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Failed to load returns data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof NewReturn, value: string) => {
    setNewReturn(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!newReturn.product_id) {
      setError("Please select a product");
      return false;
    }
    if (!newReturn.warehouse_id) {
      setError("Please select a warehouse");
      return false;
    }
    if (!newReturn.quantity || parseInt(newReturn.quantity) <= 0) {
      setError("Please enter a valid quantity");
      return false;
    }
    if (!newReturn.reason.trim()) {
      setError("Please provide a reason for the return");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const submitData = {
        product_id: parseInt(newReturn.product_id),
        warehouse_id: parseInt(newReturn.warehouse_id),
        return_type: newReturn.return_type,
        quantity: parseInt(newReturn.quantity),
        reason: newReturn.reason.trim(),
        created_by: 1 // You might want to get this from user context
      };

      await api.post("/returns", submitData);
      
      // Reset form and refresh data
      setNewReturn({
        product_id: "",
        warehouse_id: "",
        return_type: "from_customer",
        quantity: "",
        reason: ""
      });
      
      setShowCreateForm(false);
      setSuccess("Return processed successfully!");
      
      // Refresh the returns list
      await fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
      
    } catch (err: any) {
      console.error("Error creating return:", err);
      let errorMessage = "Failed to process return. ";
      if (err.response?.data?.detail) {
        errorMessage += err.response.data.detail;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewReturn({
      product_id: "",
      warehouse_id: "",
      return_type: "from_customer",
      quantity: "",
      reason: ""
    });
    setShowCreateForm(false);
    setError("");
  };

  // Calculate statistics
  const fromCustomerReturns = returns.filter(r => r.return_type === "from_customer");
  const toSupplierReturns = returns.filter(r => r.return_type === "to_supplier");
  const totalFromCustomer = fromCustomerReturns.reduce((sum, r) => sum + r.quantity, 0);
  const totalToSupplier = toSupplierReturns.reduce((sum, r) => sum + r.quantity, 0);

  if (isLoading && returns.length === 0) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "200px", 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        margin: "20px"
      }}>
        <p>Loading returns data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Returns Management</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={fetchData}
            style={{
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "4px",
              padding: "8px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px"
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "8px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px"
            }}
          >
            <RotateCcw size={16} />
            Process Return
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ 
          backgroundColor: "#fee2e2", 
          borderLeft: "4px solid #ef4444", 
          color: "#b91c1c", 
          padding: "16px", 
          marginBottom: "20px", 
          borderRadius: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <AlertTriangle size={20} style={{ marginRight: "8px" }} />
            <p>{error}</p>
          </div>
          <button 
            onClick={() => setError("")} 
            style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c" }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {success && (
        <div style={{ 
          backgroundColor: "#dcfce7", 
          borderLeft: "4px solid #10b981", 
          color: "#065f46", 
          padding: "16px", 
          marginBottom: "20px", 
          borderRadius: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <p>{success}</p>
          <button 
            onClick={() => setSuccess("")} 
            style={{ background: "none", border: "none", cursor: "pointer", color: "#065f46" }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "20px", 
        marginBottom: "20px" 
      }}>
        {/* Total Returns Card */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <RotateCcw style={{ color: "#3b82f6", marginRight: "8px" }} size={24} />
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Total Returns</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>{returns.length}</p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>All return transactions</p>
        </div>

        {/* From Customer Returns */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <ArrowLeft style={{ color: "#10b981", marginRight: "8px" }} size={24} />
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>From Customers</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            {fromCustomerReturns.length}
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            {totalFromCustomer} items returned
          </p>
        </div>

        {/* To Supplier Returns */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <ArrowRight style={{ color: "#f59e0b", marginRight: "8px" }} size={24} />
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>To Suppliers</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            {toSupplierReturns.length}
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            {totalToSupplier} items returned
          </p>
        </div>
      </div>

      {/* Create Return Form Modal */}
      {showCreateForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "500px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600" }}>Process Return</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b7280"
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
                  Product *
                </label>
                <select
                  value={newReturn.product_id}
                  onChange={(e) => handleInputChange("product_id", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.name} (SKU: {product.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
                  Warehouse *
                </label>
                <select
                  value={newReturn.warehouse_id}
                  onChange={(e) => handleInputChange("warehouse_id", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
                  Return Type *
                </label>
                <select
                  value={newReturn.return_type}
                  onChange={(e) => handleInputChange("return_type", e.target.value as "from_customer" | "to_supplier")}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="from_customer">From Customer (Stock Increase)</option>
                  <option value="to_supplier">To Supplier (Stock Decrease)</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newReturn.quantity}
                  onChange={(e) => handleInputChange("quantity", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500" }}>
                  Reason *
                </label>
                <textarea
                  value={newReturn.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter reason for return..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    backgroundColor: "white",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontWeight: "500",
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? "Processing..." : "Process Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Returns Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        marginBottom: "20px",
        overflow: "hidden"
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Return History</h2>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          {returns.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <RotateCcw size={48} style={{ color: "#9ca3af", margin: "0 auto 16px" }} />
              <p style={{ color: "#6b7280", marginBottom: "16px" }}>No returns found.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "500"
                }}
              >
                <RotateCcw size={16} />
                Process First Return
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Product</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Warehouse</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Quantity</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Reason</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((returnItem) => (
                  <tr key={returnItem.return_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px 16px" }}>#{returnItem.return_id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "500" }}>
                      {returnItem.product_name || `Product #${returnItem.product_id}`}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {returnItem.warehouse_name || `Warehouse #${returnItem.warehouse_id}`}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "9999px", 
                        fontSize: "12px", 
                        fontWeight: "500",
                        backgroundColor: returnItem.return_type === "from_customer" ? "#dcfce7" : "#fff7ed",
                        color: returnItem.return_type === "from_customer" ? "#065f46" : "#9a3412"
                      }}>
                        {returnItem.return_type === "from_customer" ? (
                          <>
                            <ArrowLeft size={12} style={{ display: "inline", marginRight: "4px" }} />
                            From Customer
                          </>
                        ) : (
                          <>
                            <ArrowRight size={12} style={{ display: "inline", marginRight: "4px" }} />
                            To Supplier
                          </>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "500" }}>{returnItem.quantity}</td>
                    <td style={{ padding: "12px 16px", maxWidth: "200px" }}>
                      <div style={{ 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap" 
                      }} title={returnItem.reason}>
                        {returnItem.reason}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6b7280", fontSize: "14px" }}>
                        <Calendar size={14} />
                        {new Date(returnItem.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}