import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash, AlertTriangle, Truck, User, Mail, Phone, MapPin, X } from 'lucide-react';
import api from '../api/client';

type Supplier = {
  supplier_id: number;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (supplierId: number) => {
    setSupplierToDelete(supplierId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (supplierToDelete) {
      try {
        await api.delete(`/suppliers/${supplierToDelete}`);
        setSuppliers(suppliers.filter(supplier => supplier.supplier_id !== supplierToDelete));
        setShowDeleteModal(false);
        setSuccess('Supplier deleted successfully');

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } catch (err) {
        console.error('Error deleting supplier:', err);
        setError('Failed to delete supplier. Please try again later.');
      }
    }
  };

  const getSupplierWithMostInfo = () => {
    return suppliers.reduce((prev, current) => {
      const prevInfoCount = [prev.contact_name, prev.email, prev.phone, prev.address].filter(Boolean).length;
      const currentInfoCount = [current.contact_name, current.email, current.phone, current.address].filter(Boolean).length;
      return currentInfoCount > prevInfoCount ? current : prev;
    }, suppliers[0]);
  };

  if (isLoading) {
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
        <p>Loading suppliers data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Supplier Management</h1>
        <Link
          to="/add-supplier"
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "10px 16px",
            borderRadius: "6px",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "500"
          }}
        >
          <Plus size={16} /> Add Supplier
        </Link>
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
        {/* Total Suppliers Card */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <Truck style={{ color: "#3b82f6", marginRight: "8px" }} size={24} />
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Total Suppliers</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>{suppliers.length}</p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Registered suppliers</p>
        </div>

        {/* Suppliers with Contact Info */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <User style={{ color: "#8b5cf6", marginRight: "8px" }} size={24} />
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>With Contact Person</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            {suppliers.filter(s => s.contact_name).length}
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Named contacts available</p>
        </div>

        {/* Suppliers with Email */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          flex: "1",
          minWidth: "200px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
            <Mail style={{ color: "#10b981", marginRight: "8px" }} size={24} />
            <h2 style={{ fontSize: "18px", fontWeight: "600" }}>With Email</h2>
          </div>
          <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            {suppliers.filter(s => s.email).length}
          </p>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>Digital contact methods</p>
        </div>
      </div>

      {/* Suppliers Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        marginBottom: "20px",
        overflow: "hidden"
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Supplier Directory</h2>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          {suppliers.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Truck size={48} style={{ color: "#9ca3af", margin: "0 auto 16px" }} />
              <p style={{ color: "#6b7280", marginBottom: "16px" }}>No suppliers found. Add your first supplier.</p>
              <Link
                to="/add-supplier"
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "500"
                }}
              >
                <Plus size={16} /> Add First Supplier
              </Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Contact</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Email</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Phone</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.supplier_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px 16px" }}>{supplier.supplier_id}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "500" }}>{supplier.name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {supplier.contact_name ? (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <User size={14} style={{ color: "#6b7280", marginRight: "6px" }} />
                          {supplier.contact_name}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {supplier.email ? (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Mail size={14} style={{ color: "#6b7280", marginRight: "6px" }} />
                          {supplier.email}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {supplier.phone ? (
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Phone size={14} style={{ color: "#6b7280", marginRight: "6px" }} />
                          {supplier.phone}
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <Link
                          to={`/edit-supplier/${supplier.supplier_id}`}
                          style={{
                            backgroundColor: "#e0e7ff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(supplier.supplier_id)}
                          style={{
                            backgroundColor: "#fee2e2",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Supplier Details Card - show for the supplier with most info */}
      {suppliers.length > 0 && (
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          padding: "20px",
          marginBottom: "20px"
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>Supplier Spotlight</h2>
          
          {(() => {
            const detailedSupplier = getSupplierWithMostInfo();
            if (!detailedSupplier) return null;
            
            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ 
                    backgroundColor: "#e0f2fe", 
                    borderRadius: "50%", 
                    width: "50px", 
                    height: "50px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    marginRight: "16px"
                  }}>
                    <Truck size={24} style={{ color: "#0ea5e9" }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>{detailedSupplier.name}</h3>
                    <p style={{ color: "#6b7280", fontSize: "14px" }}>Supplier ID: {detailedSupplier.supplier_id}</p>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <User size={16} style={{ color: "#6b7280", marginRight: "8px", marginTop: "2px" }} />
                    <div>
                      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Contact Person</p>
                      <p style={{ fontWeight: "500" }}>{detailedSupplier.contact_name || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <Mail size={16} style={{ color: "#6b7280", marginRight: "8px", marginTop: "2px" }} />
                    <div>
                      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Email</p>
                      <p style={{ fontWeight: "500" }}>{detailedSupplier.email || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <Phone size={16} style={{ color: "#6b7280", marginRight: "8px", marginTop: "2px" }} />
                    <div>
                      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Phone</p>
                      <p style={{ fontWeight: "500" }}>{detailedSupplier.phone || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <MapPin size={16} style={{ color: "#6b7280", marginRight: "8px", marginTop: "2px" }} />
                    <div>
                      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>Address</p>
                      <p style={{ fontWeight: "500" }}>{detailedSupplier.address || "Not specified"}</p>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                  <Link
                    to={`/edit-supplier/${detailedSupplier.supplier_id}`}
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
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                  >
                    <Edit size={14} /> Edit Details
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
            maxWidth: "450px",
            width: "100%",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", color: "#ef4444" }}>
              <AlertTriangle size={24} style={{ marginRight: "12px" }} />
              <h3 style={{ fontSize: "18px", fontWeight: "600" }}>Confirm Delete</h3>
            </div>
            
            <p style={{ marginBottom: "20px", lineHeight: "1.5", color: "#4b5563" }}>
              Are you sure you want to delete this supplier? This action cannot be undone and may affect related purchase orders or transactions.
            </p>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  backgroundColor: "white",
                  color: "#4b5563",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Trash size={16} /> Delete Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;