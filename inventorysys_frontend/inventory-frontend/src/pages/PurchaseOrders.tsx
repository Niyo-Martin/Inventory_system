import { useEffect, useState } from "react";
import api from "../api/client";
import { ShoppingCart, Truck, Plus, Trash2, FileText, Calculator, X, History } from "lucide-react";

// Define proper types
type Supplier = {
  supplier_id: number;
  name: string;
  email?: string;
  phone?: string;
};

type Product = {
  product_id: number;
  name: string;
  sku: string;
  unit_cost: number;
  reorder_level: number;
};

type OrderItem = {
  product_id: string;
  quantity: string;
  unit_cost: string;
  product_name?: string; // For display purposes
};

type POStatusHistory = {
  history_id: number;
  po_id: number;
  old_status: string | null;
  new_status: string;
  changed_by: number | null;
  changed_by_name: string | null;
  changed_at: string;
  notes: string | null;
};

export default function CreatePurchaseOrder() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{ product_id: "", quantity: "", unit_cost: "" }]);
  const [note, setNote] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // States for PO history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<number | null>(null);
  const [poHistory, setPOHistory] = useState<POStatusHistory[]>([]);
  const [recentPOs, setRecentPOs] = useState<any[]>([]);

  // Calculate total order amount
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;
      return total + (quantity * unitCost);
    }, 0).toFixed(2);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Loading data for PurchaseOrders page...");
      
      // Fetch suppliers and products first (these work)
      const [suppRes, prodRes] = await Promise.all([
        api.get("/suppliers"),
        api.get("/products")
      ]);
      
      console.log("✅ Suppliers and products loaded successfully");
      setSuppliers(suppRes.data);
      setProducts(prodRes.data);
      
      // Try to fetch recent purchase orders separately with error handling
      try {
        const posRes = await api.get("/purchase-orders", { params: { limit: 5 } });
        setRecentPOs(posRes.data || []);
        console.log("✅ Recent purchase orders loaded");
      } catch (poError) {
        console.warn("⚠️ Could not load recent purchase orders:", poError);
        // Don't fail the whole page if POs can't be loaded
        setRecentPOs([]);
      }
      
      setError("");
    } catch (err: any) {
      console.error("❌ Error loading suppliers or products:", err);
      
      let errorMessage = "Failed to load suppliers or products. ";
      if (err.response) {
        errorMessage += `Server responded with ${err.response.status}: ${err.response.data?.detail || err.response.statusText}`;
      } else if (err.request) {
        errorMessage += "No response from server. Check if the API is running.";
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Auto-fill unit cost if product is selected
    if (field === "product_id" && value) {
      const selectedProduct = products.find(p => p.product_id.toString() === value);
      if (selectedProduct) {
        updatedItems[index].unit_cost = selectedProduct.unit_cost.toString();
        updatedItems[index].product_name = selectedProduct.name;
      }
    }

    setOrderItems(updatedItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: "", unit_cost: "" }]);
  };

  const removeItem = (index: number) => {
    if (orderItems.length > 1) {
      const updatedItems = [...orderItems];
      updatedItems.splice(index, 1);
      setOrderItems(updatedItems);
    }
  };

  const resetForm = () => {
    setSupplierId("");
    setNote("");
    setExpectedDeliveryDate("");
    setOrderItems([{ product_id: "", quantity: "", unit_cost: "" }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!supplierId) {
      setError("Please select a supplier");
      return;
    }

    if (!expectedDeliveryDate) {
      setError("Please set an expected delivery date");
      return;
    }

    const hasInvalidItems = orderItems.some(item => 
      !item.product_id || !item.quantity || !item.unit_cost || 
      parseInt(item.quantity) <= 0 || parseFloat(item.unit_cost) <= 0
    );

    if (hasInvalidItems) {
      setError("Please fill in all item details with valid quantities and costs");
      return;
    }

    try {
      await api.post("/purchase-orders", {
        supplier_id: parseInt(supplierId),
        expected_delivery: expectedDeliveryDate,
        notes: note, // Changed from 'note' to 'notes' to match backend
        items: orderItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
        })),
      });
      
      // Refresh the recent POs list
      loadData();
      
      setSuccess("Purchase order submitted successfully!");
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("❌ Error submitting purchase order:", err);
      let errorMessage = "Failed to submit purchase order. ";
      if (err.response) {
        errorMessage += `${err.response.data?.detail || err.response.statusText}`;
      }
      setError(errorMessage);
    }
  };

  // View PO history function
  const viewPOHistory = async (poId: number) => {
    try {
      setSelectedPO(poId);
      setIsLoading(true);
      
      const res = await api.get(`/purchase-orders/${poId}/history`);
      setPOHistory(res.data);
      setShowHistoryModal(true);
      setError("");
    } catch (err) {
      setError("Failed to load purchase order history.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Create Purchase Order</h1>
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
          <p>{error}</p>
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

      {isLoading ? (
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "200px", 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)" 
        }}>
          <p>Loading suppliers and products...</p>
        </div>
      ) : (
        <>
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "8px", 
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
            marginBottom: "24px"
          }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShoppingCart style={{ color: "#3b82f6" }} size={24} />
                <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Order Details</h2>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
              {/* Supplier and Delivery Date */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
                gap: "20px",
                marginBottom: "24px"
              }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Supplier
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      backgroundColor: "white"
                    }}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplier_id} value={supplier.supplier_id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter any additional details"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>

              {/* Order Items Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "16px"
                }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                    <FileText size={20} />
                    Order Items
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    style={{
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      border: "none",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "14px"
                    }}
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
                
                {/* Item Headers */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "3fr 1fr 1fr auto", 
                  gap: "12px",
                  padding: "8px 12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "4px",
                  marginBottom: "8px",
                  fontWeight: "500",
                  fontSize: "14px"
                }}>
                  <div>Product</div>
                  <div>Quantity</div>
                  <div>Unit Cost ($)</div>
                  <div></div>
                </div>
                
                {/* Item Rows */}
                {orderItems.map((item, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: "grid", 
                      gridTemplateColumns: "3fr 1fr 1fr auto", 
                      gap: "12px",
                      padding: "12px",
                      borderBottom: index < orderItems.length - 1 ? "1px solid #e5e7eb" : "none",
                      alignItems: "center"
                    }}
                  >
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
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
                    
                    <input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px"
                      }}
                    />
                    
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={item.unit_cost}
                      onChange={(e) => handleItemChange(index, "unit_cost", e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px"
                      }}
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={orderItems.length === 1}
                      style={{
                        backgroundColor: orderItems.length === 1 ? "#f3f4f6" : "#fee2e2",
                        color: orderItems.length === 1 ? "#9ca3af" : "#b91c1c",
                        border: "none",
                        borderRadius: "4px",
                        padding: "8px",
                        cursor: orderItems.length === 1 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                {/* Order Summary */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "flex-end", 
                  alignItems: "center",
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "4px"
                }}>
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    fontWeight: "600",
                    fontSize: "16px"
                  }}>
                    <Calculator size={18} />
                    <span>Total Amount:</span>
                    <span style={{ color: "#0e7490" }}>${calculateTotal()}</span>
                  </div>
                </div>
              </div>
              
              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    backgroundColor: "white",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Truck size={18} />
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
          
          {/* Recent Purchase Orders with Status History */}
          {recentPOs.length > 0 && (
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden"
            }}>
              <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <History style={{ color: "#8b5cf6" }} size={24} />
                  <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Recent Purchase Orders</h2>
                </div>
              </div>
              
              <div style={{ padding: "16px" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f9fafb" }}>
                        <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>PO #</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Supplier</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Date</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPOs.map((po) => (
                        <tr key={po.po_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "12px 16px" }}>#{po.po_id}</td>
                          <td style={{ padding: "12px 16px" }}>{po.supplier_name || `Supplier #${po.supplier_id}`}</td>
                          <td style={{ padding: "12px 16px" }}>{new Date(po.order_date).toLocaleDateString()}</td>
                          <td style={{ padding: "12px 16px" }}>
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
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <button
                              onClick={() => viewPOHistory(po.po_id)}
                              style={{
                                backgroundColor: "#e0f2fe",
                                color: "#0369a1",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              title="View Status History"
                            >
                              <History size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Status History Modal */}
      {showHistoryModal && (
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
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600" }}>
                Purchase Order #{selectedPO} Status History
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
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
            
            {poHistory.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px", color: "#6b7280" }}>No history available</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb" }}>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>From</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>To</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Changed By</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Date</th>
                      <th style={{ padding: "10px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poHistory.map((history) => (
                      <tr key={history.history_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "10px" }}>
                          {history.old_status ? (
                            <span style={{ 
                              backgroundColor: "#f3f4f6",
                              color: "#374151",
                              padding: "4px 8px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: "500"
                            }}>
                              {history.old_status}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Created</span>
                          )}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span style={{ 
                            backgroundColor: 
                              history.new_status === "pending" ? "#fff7ed" :
                              history.new_status === "received" ? "#dcfce7" :
                              history.new_status === "cancelled" ? "#fee2e2" : "#f3f4f6",
                            color: 
                              history.new_status === "pending" ? "#9a3412" :
                              history.new_status === "received" ? "#065f46" :
                              history.new_status === "cancelled" ? "#b91c1c" : "#374151",
                            padding: "4px 8px",
                            borderRadius: "9999px",
                            fontSize: "12px",
                            fontWeight: "500"
                          }}>
                            {history.new_status}
                          </span>
                        </td>
                        <td style={{ padding: "10px" }}>{history.changed_by_name || "System"}</td>
                        <td style={{ padding: "10px", fontSize: "14px", color: "#6b7280" }}>
                          {new Date(history.changed_at).toLocaleString()}
                        </td>
                        <td style={{ padding: "10px" }}>{history.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}