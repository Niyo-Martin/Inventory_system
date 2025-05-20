import { useEffect, useState } from "react";
import api from "../api/client";

export default function CreatePurchaseOrder() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [orderItems, setOrderItems] = useState([{ product_id: "", quantity: "", unit_cost: "" }]);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(""); // Clear any previous errors
        setMessage(""); // Clear any previous messages
        
        console.log("🔄 Starting to load suppliers and products...");
        console.log("📍 API Base URL:", api.defaults.baseURL);
        
        // Fetch both suppliers and products in parallel
        const [suppRes, prodRes] = await Promise.all([
          api.get("/suppliers"),
          api.get("/products")
        ]);
        
        console.log("✅ Suppliers response:", suppRes.data);
        console.log("✅ Products response:", prodRes.data);
        
        // Ensure we have arrays
        const suppliersData = Array.isArray(suppRes.data) ? suppRes.data : [];
        const productsData = Array.isArray(prodRes.data) ? prodRes.data : [];
        
        setSuppliers(suppliersData);
        setProducts(productsData);
        
        console.log(`📊 Successfully loaded ${suppliersData.length} suppliers and ${productsData.length} products`);
        
        // Show success message if we got data
        if (suppliersData.length > 0 && productsData.length > 0) {
          setMessage(`✅ Loaded ${suppliersData.length} suppliers and ${productsData.length} products`);
        } else if (suppliersData.length === 0 && productsData.length === 0) {
          setMessage("⚠️ No suppliers or products found in database");
        } else if (suppliersData.length === 0) {
          setMessage("⚠️ No suppliers found in database");
        } else if (productsData.length === 0) {
          setMessage("⚠️ No products found in database");
        }
        
      } catch (err: any) {
        console.error("❌ Error loading data:", err);
        
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
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...orderItems];
    updatedItems[index][field as keyof typeof updatedItems[number]] = value;
    setOrderItems(updatedItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: "", unit_cost: "" }]);
  };

  const removeItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setMessage("🔄 Submitting purchase order...");
      
      const submitData = {
        supplier_id: parseInt(supplierId),
        notes: note, // Note: backend expects "notes" not "note"
        items: orderItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost),
        })),
      };
      
      console.log("🔄 Submitting purchase order data:", submitData);
      
      await api.post("/purchase-orders", submitData);
      
      setMessage("✅ Purchase order submitted successfully!");
      setSupplierId("");
      setNote("");
      setOrderItems([{ product_id: "", quantity: "", unit_cost: "" }]);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage("");
      }, 5000);
      
    } catch (err: any) {
      console.error("❌ Error submitting purchase order:", err);
      
      let errorMessage = "❌ Failed to submit purchase order. ";
      if (err.response) {
        errorMessage += `${err.response.data?.detail || err.response.statusText}`;
      }
      setMessage(errorMessage);
    }
  };

  // Calculate total amount
  const totalAmount = orderItems.reduce((total, item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitCost = parseFloat(item.unit_cost) || 0;
    return total + (quantity * unitCost);
  }, 0);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.8rem", fontWeight: "600" }}>
        🛒 Create Purchase Order
      </h2>
      
      {/* Loading indicator */}
      {loading && (
        <div style={{ 
          padding: "1rem", 
          background: "#e3f2fd", 
          color: "#1976d2", 
          marginBottom: "1rem",
          borderRadius: "8px",
          border: "1px solid #bbdefb"
        }}>
          🔄 Loading suppliers and products...
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div style={{ 
          padding: "1rem", 
          background: "#ffebee", 
          color: "#d32f2f", 
          marginBottom: "1rem",
          borderRadius: "8px",
          border: "1px solid #ffcdd2"
        }}>
          {error}
          <div style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            <strong>Debug info:</strong> API URL: {api.defaults.baseURL}
          </div>
        </div>
      )}
      
      {/* Success/Info message */}
      {message && !error && (
        <div style={{ 
          padding: "1rem", 
          background: message.includes("✅") ? "#e8f5e9" : "#fff3e0", 
          color: message.includes("✅") ? "#2e7d32" : "#ef6c00", 
          marginBottom: "1rem",
          borderRadius: "8px",
          border: message.includes("✅") ? "1px solid #c8e6c9" : "1px solid #ffcc02"
        }}>
          {message}
        </div>
      )}

      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          padding: "1rem", 
          background: "#f5f5f5", 
          marginBottom: "1rem",
          borderRadius: "8px",
          fontSize: "0.9em",
          border: "1px solid #e0e0e0"
        }}>
          <strong>Debug Info:</strong><br/>
          Suppliers loaded: {suppliers.length}<br/>
          Products loaded: {products.length}<br/>
          API Base URL: {api.defaults.baseURL}<br/>
          Loading: {loading.toString()}<br/>
          Error: {error || 'None'}
        </div>
      )}/* Debug info end */

      {/* Main form */}
      {!loading && (
        <form onSubmit={handleSubmit} style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          {/* Order Details */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "1rem", color: "#333" }}>📋 Order Details</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Supplier <span style={{ color: "#d32f2f" }}>*</span>
                </label>
                <select 
                  value={supplierId} 
                  onChange={(e) => setSupplierId(e.target.value)} 
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "1rem"
                  }}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                  Note (Optional)
                </label>
                <input 
                  type="text"
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter any additional details"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "1rem"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.3rem", color: "#333" }}>📦 Order Items</h3>
              <button 
                type="button" 
                onClick={addItem}
                style={{
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500"
                }}
              >
                ➕ Add Item
              </button>
            </div>
            
            {orderItems.map((item, index) => (
              <div key={index} style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 120px 120px auto", 
                gap: "1rem", 
                marginBottom: "1rem",
                padding: "1rem",
                background: "#f9f9f9",
                borderRadius: "8px"
              }}>
                <select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                  required
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.95rem"
                  }}
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  required
                  min="1"
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.95rem"
                  }}
                />
                
                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit Cost"
                  value={item.unit_cost}
                  onChange={(e) => handleItemChange(index, "unit_cost", e.target.value)}
                  required
                  min="0"
                  style={{
                    padding: "0.5rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.95rem"
                  }}
                />
                
                {orderItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{
                      background: "#ff4444",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total and Submit */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            paddingTop: "1rem",
            borderTop: "2px solid #eee"
          }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "600" }}>
              Total Amount: <span style={{ color: "#2e7d32" }}>${totalAmount.toFixed(2)}</span>
            </div>
            
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="button"
                onClick={() => {
                  setSupplierId("");
                  setNote("");
                  setOrderItems([{ product_id: "", quantity: "", unit_cost: "" }]);
                  setMessage("");
                  setError("");
                }}
                style={{
                  background: "#9e9e9e",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.75rem 1.5rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              >
                Cancel
              </button>
              
              <button 
                type="submit"
                disabled={!supplierId || orderItems.some(item => !item.product_id || !item.quantity || !item.unit_cost)}
                style={{
                  background: supplierId && orderItems.every(item => item.product_id && item.quantity && item.unit_cost) 
                    ? "#1976d2" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.75rem 2rem",
                  cursor: supplierId && orderItems.every(item => item.product_id && item.quantity && item.unit_cost) 
                    ? "pointer" : "not-allowed",
                  fontSize: "1rem",
                  fontWeight: "500"
                }}
              >
                📋 Submit Purchase Order
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}