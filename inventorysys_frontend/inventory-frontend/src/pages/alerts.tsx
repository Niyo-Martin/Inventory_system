import { useEffect, useState } from "react";
import api from "../api/client";
import { AlertTriangle, CheckCircle, X, Clock, RefreshCw, Package } from "lucide-react";

type StockAlert = {
  alert_id: number;
  product_id: number;
  product_name: string;
  warehouse_id: number;
  warehouse_name: string;
  current_quantity: number;
  threshold: number;
  alert_type: "low_stock" | "out_of_stock";
  created_at: string;
  is_resolved: boolean;
  resolved_at: string | null;
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/alerts?resolved=${showResolved}`);
      setAlerts(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load stock alerts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [showResolved]);

  const handleResolveAlert = async (alertId: number) => {
    try {
      await api.put(`/alerts/${alertId}/resolve`);
      
      // Update the local state
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.alert_id === alertId 
            ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() } 
            : alert
        )
      );
      
      setSuccess("Alert marked as resolved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to resolve the alert. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Stock Alerts</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowResolved(!showResolved)}
            style={{
              backgroundColor: "white",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {showResolved ? "Hide Resolved" : "Show Resolved"}
          </button>
          <button
            onClick={fetchAlerts}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <RefreshCw size={16} />
            Refresh
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

      {/* Stat Cards */}
      <div style={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "20px", 
        marginBottom: "20px" 
      }}>
        {/* Total Alerts Card */}
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
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Active Alerts</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            {showResolved ? alerts.length : alerts.filter(a => !a.is_resolved).length}
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            {showResolved ? "All alerts" : "Unresolved inventory alerts"}
          </p>
        </div>

        {/* Out of Stock Items */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <Package style={{ color: "#ef4444", marginRight: "8px" }} size={24} />
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Out of Stock</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            {alerts.filter(a => a.alert_type === "out_of_stock" && (!showResolved ? !a.is_resolved : true)).length}
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Products with zero stock</p>
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
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Low Stock</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            {alerts.filter(a => a.alert_type === "low_stock" && (!showResolved ? !a.is_resolved : true)).length}
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Products below reorder level</p>
        </div>
      </div>

      {/* Alerts Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        marginBottom: "20px",
        overflow: "hidden"
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
            {showResolved ? "All Stock Alerts" : "Active Stock Alerts"}
          </h2>
        </div>
        
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p>Loading stock alerts...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {alerts.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <CheckCircle size={48} style={{ color: "#10b981", margin: "0 auto 16px" }} />
                <p style={{ color: "#374151", marginBottom: "8px", fontSize: "18px", fontWeight: "500" }}>
                  No alerts found
                </p>
                <p style={{ color: "#6b7280" }}>
                  {showResolved 
                    ? "There are no historical alerts in the system." 
                    : "All stock levels are within acceptable ranges."}
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Type</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Product</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Warehouse</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Quantity</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Threshold</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Created</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                    {!showResolved && (
                      <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.alert_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px 16px" }}>{alert.alert_id}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          backgroundColor: alert.alert_type === "low_stock" ? "#fff7ed" : "#fef2f2",
                          color: alert.alert_type === "low_stock" ? "#9a3412" : "#b91c1c",
                          padding: "4px 8px",
                          borderRadius: "9999px",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          {alert.alert_type === "low_stock" ? "Low Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "500" }}>{alert.product_name}</td>
                      <td style={{ padding: "12px 16px" }}>{alert.warehouse_name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          backgroundColor: alert.current_quantity === 0 ? "#fee2e2" : "#fff7ed",
                          color: alert.current_quantity === 0 ? "#b91c1c" : "#9a3412",
                          padding: "4px 8px",
                          borderRadius: "9999px",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          {alert.current_quantity}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>{alert.threshold}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6b7280", fontSize: "14px" }}>
                          <Clock size={14} />
                          {new Date(alert.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          backgroundColor: alert.is_resolved ? "#dcfce7" : "#fff7ed",
                          color: alert.is_resolved ? "#065f46" : "#9a3412",
                          padding: "4px 8px",
                          borderRadius: "9999px",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          {alert.is_resolved ? "Resolved" : "Active"}
                        </span>
                      </td>
                      {!showResolved && !alert.is_resolved && (
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          <button
                            onClick={() => handleResolveAlert(alert.alert_id)}
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#065f46",
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
                            <CheckCircle size={16} />
                            Resolve
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}