import { useEffect, useState } from "react";
import api from "../api/client";
import { ArrowDown, ArrowUp, X, Clock } from "lucide-react";

type Transaction = {
  transaction_id: number;
  product_id: number;
  product_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  quantity: number;
  transaction_type: "in" | "out";
  note: string;
  created_at: string;
};

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load transaction history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = transactions.filter(txn => 
    filterType === "all" || txn.transaction_type === filterType
  );

  // Calculate totals for summary cards
  const totalTransactions = transactions.length;
  const inboundTransactions = transactions.filter(txn => txn.transaction_type === "in").length;
  const outboundTransactions = transactions.filter(txn => txn.transaction_type === "out").length;

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Transaction History</h1>
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
          <p>Loading transaction data...</p>
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
            {/* Total Transactions Card */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <Clock style={{ color: "#2563eb", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Total Transactions</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>{totalTransactions}</p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>All time activity</p>
            </div>

            {/* Inbound Transactions */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <ArrowDown style={{ color: "#10b981", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Stock Additions</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                {inboundTransactions}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Inbound transactions</p>
            </div>

            {/* Outbound Transactions */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <ArrowUp style={{ color: "#f59e0b", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Stock Removals</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                {outboundTransactions}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Outbound transactions</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "8px", 
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "20px",
            overflow: "hidden"
          }}>
            <div style={{ 
              padding: "16px", 
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Transaction Records</h2>
              
              {/* Filter controls */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setFilterType("all")}
                  style={{
                    backgroundColor: filterType === "all" ? "#3b82f6" : "#f3f4f6",
                    color: filterType === "all" ? "white" : "#374151",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("in")}
                  style={{
                    backgroundColor: filterType === "in" ? "#10b981" : "#f3f4f6",
                    color: filterType === "in" ? "white" : "#374151",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <ArrowDown size={16} /> In
                </button>
                <button
                  onClick={() => setFilterType("out")}
                  style={{
                    backgroundColor: filterType === "out" ? "#f59e0b" : "#f3f4f6",
                    color: filterType === "out" ? "white" : "#374151",
                    border: "none",
                    borderRadius: "4px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <ArrowUp size={16} /> Out
                </button>
              </div>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Type</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Product</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Warehouse</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Quantity</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Note</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((txn) => (
                      <tr key={txn.transaction_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px 16px" }}>{txn.transaction_id}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ 
                            backgroundColor: txn.transaction_type === "in" ? "#dcfce7" : "#fee2e2",
                            color: txn.transaction_type === "in" ? "#065f46" : "#b91c1c",
                            padding: "4px 8px",
                            borderRadius: "9999px",
                            fontSize: "14px",
                            fontWeight: "500",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            {txn.transaction_type === "in" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                            {txn.transaction_type === "in" ? "In" : "Out"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>{txn.product_name || `Product #${txn.product_id}`}</td>
                        <td style={{ padding: "12px 16px" }}>{txn.warehouse_name || `Warehouse #${txn.warehouse_id}`}</td>
                        <td style={{ padding: "12px 16px", fontWeight: "500" }}>{txn.quantity}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {txn.note || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No note</span>}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "14px" }}>
                          {new Date(txn.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Refresh Button */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={loadTransactions}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Refresh Transactions
            </button>
          </div>
        </>
      )}
    </div>
  );
}