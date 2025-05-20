import { useEffect, useState } from "react";
import api from "../api/client";
import { Plus, Minus, Package, AlertTriangle, Warehouse, X } from "lucide-react";

type StockEntry = {
  stock_id: number;
  product_id: number;
  quantity: number;
  warehouse_id: number;
  product_name: string;
  warehouse_name: string;
};

export default function Stock() {
  const [stockList, setStockList] = useState<StockEntry[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState("");

  const [txnEntry, setTxnEntry] = useState<StockEntry | null>(null);
  const [txnType, setTxnType] = useState<"in" | "out" | null>(null);
  const [txnQuantity, setTxnQuantity] = useState("");
  const [txnNote, setTxnNote] = useState("");

  const startTransaction = (entry: StockEntry, type: "in" | "out") => {
    setTxnEntry(entry);
    setTxnType(type);
    setTxnQuantity("");
    setTxnNote("");
    setSuccess("");
  };

  const fetchStockData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/stock");
      setStockList(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load stock data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post("/transactions", {
        product_id: txnEntry?.product_id,
        warehouse_id: txnEntry?.warehouse_id,
        transaction_type: txnType,
        quantity: parseInt(txnQuantity),
        note: txnNote
      });

      // Refresh stock data
      await fetchStockData();

      setSuccess(`Successfully ${txnType === "in" ? "added" : "removed"} ${txnQuantity} units of ${txnEntry?.product_name}.`);
      
      // Clear form after a delay
      setTimeout(() => {
        setTxnEntry(null);
        setTxnType(null);
        setTxnQuantity("");
        setTxnNote("");
        setSuccess("");
      }, 3000);
      
    } catch (err) {
      setError("Failed to submit transaction. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Stock Management</h1>
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
          <p>Loading stock data...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "20px", 
            marginBottom: "20px" 
          }}>
            {/* Total Items Card */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <Package style={{ color: "#2563eb", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Total Stock Items</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>{stockList.length}</p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Products in inventory</p>
            </div>

            {/* Low Stock Items */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <AlertTriangle style={{ color: "#f59e0b", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Low Stock Items</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                {stockList.filter(item => item.quantity < 10).length}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Products below threshold</p>
            </div>

            {/* Warehouses */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <Warehouse style={{ color: "#8b5cf6", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Warehouses</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                {new Set(stockList.map(item => item.warehouse_id)).size}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Storage locations</p>
            </div>
          </div>

          {/* Inventory Table */}
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "8px", 
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "20px",
            overflow: "hidden"
          }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Inventory Items</h2>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Product</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Warehouse</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Quantity</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stockList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
                        No stock entries found
                      </td>
                    </tr>
                  ) : (
                    stockList.map((entry) => (
                      <tr key={entry.stock_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px 16px" }}>{entry.stock_id}</td>
                        <td style={{ padding: "12px 16px" }}>{entry.product_name || `Product #${entry.product_id}`}</td>
                        <td style={{ padding: "12px 16px" }}>{entry.warehouse_name || `Warehouse #${entry.warehouse_id}`}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ 
                            backgroundColor: entry.quantity < 10 ? "#fee2e2" : "#dcfce7",
                            color: entry.quantity < 10 ? "#b91c1c" : "#065f46",
                            padding: "4px 8px",
                            borderRadius: "9999px",
                            fontSize: "14px",
                            fontWeight: "500"
                          }}>
                            {entry.quantity}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => startTransaction(entry, "in")}
                              style={{
                                backgroundColor: "#10b981",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "14px"
                              }}
                            >
                              <Plus size={16} /> Add
                            </button>
                            <button
                              onClick={() => startTransaction(entry, "out")}
                              style={{
                                backgroundColor: entry.quantity <= 0 ? "#d1d5db" : "#f59e0b",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                padding: "6px 12px",
                                cursor: entry.quantity <= 0 ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "14px",
                                opacity: entry.quantity <= 0 ? 0.6 : 1
                              }}
                              disabled={entry.quantity <= 0}
                            >
                              <Minus size={16} /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Transaction Form */}
          {txnEntry && txnType && (
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden"
            }}>
              <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
                  {txnType === "in" ? "Add Stock" : "Remove Stock"} for {txnEntry.product_name || `Product #${txnEntry.product_id}`}
                </h2>
              </div>
              
              <form onSubmit={handleSubmitTransaction} style={{ padding: "20px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={txnQuantity}
                      onChange={(e) => setTxnQuantity(e.target.value)}
                      min="1"
                      max={txnType === "out" ? txnEntry.quantity : undefined}
                      required
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        maxWidth: "300px"
                      }}
                    />
                    {txnType === "out" && (
                      <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
                        Available: {txnEntry.quantity}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={txnNote}
                      onChange={(e) => setTxnNote(e.target.value)}
                      placeholder="Enter reason for adjustment"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px"
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: txnType === "in" ? "#10b981" : "#f59e0b",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    {txnType === "in" ? "Add Stock" : "Remove Stock"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnEntry(null)}
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
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}