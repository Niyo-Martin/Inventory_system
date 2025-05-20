import { useEffect, useState } from "react";
import api from "../api/client";
import { PackagePlus, Package, Barcode, DollarSign, AlertTriangle, X, RefreshCw, Folder, Filter, XCircle } from "lucide-react";
import CategorySelector from "../components/categories/CategorySelector";

type Product = {
  product_id: number;
  name: string;
  sku: string;
  unit_cost: number;
  reorder_level: number;
  category_code?: string;
  category_name?: string;
};

type Category = {
  _id: string;
  code: string;
  name: string;
  description?: string;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  // Add state for category filter
  const [categoryFilter, setCategoryFilter] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    unit_cost: "",
    reorder_level: "",
    category_code: "",
  });

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Modify API call to include category filter if set
      const url = categoryFilter 
        ? `/products?category_code=${categoryFilter}`
        : "/products";
        
      const res = await api.get(url);
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      // Don't set error here to avoid overriding product errors
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [categoryFilter]); // Reload when filter changes

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/products", {
        ...newProduct,
        unit_cost: parseFloat(newProduct.unit_cost),
        reorder_level: parseInt(newProduct.reorder_level),
        category_code: newProduct.category_code || null, // Handle empty string
      });
      
      // Reload products
      await loadProducts();
      
      // Reset form and show success message
      setNewProduct({ name: "", sku: "", unit_cost: "", reorder_level: "", category_code: "" });
      setSuccess(`Successfully added product: ${newProduct.name}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError("Failed to add product. Please try again.");
    }
  };

  // Find category name by code
  const getCategoryName = (categoryCode: string) => {
    const category = categories.find(cat => cat.code === categoryCode);
    return category ? category.name : "";
  };
  
  // Handle category filter change
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
  };
  
  // Clear category filter
  const clearCategoryFilter = () => {
    setCategoryFilter("");
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Product Management</h1>
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

      {/* Category Filter */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        padding: "16px", 
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          <Filter style={{ color: "#3b82f6", marginRight: "8px" }} size={20} />
          <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Filter Products</h2>
        </div>
        
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          gap: "16px"
        }}>
          <div style={{ width: "300px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
              Category
            </label>
            {isLoadingCategories ? (
              <div>Loading categories...</div>
            ) : (
              <CategorySelector
                value={categoryFilter}
                onChange={handleCategoryFilterChange}
                placeholder="All Categories"
              />
            )}
          </div>
          
          {categoryFilter && (
            <button
              onClick={clearCategoryFilter}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "26px", // Align with dropdown
                backgroundColor: "#f3f4f6",
                color: "#4b5563",
                border: "none",
                borderRadius: "4px",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              <XCircle size={16} />
              Clear Filter
            </button>
          )}
        </div>
      </div>

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
          <p>Loading products...</p>
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
            {/* Total Products Card */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <Package style={{ color: "#8b5cf6", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>
                  {categoryFilter ? "Filtered Products" : "Total Products"}
                </h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                {products.length}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>
                {categoryFilter 
                  ? `Products in ${getCategoryName(categoryFilter) || categoryFilter}`
                  : "Products in catalog"}
              </p>
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
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Low Stock Products</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                {products.filter(product => {
                  // We'd need to compare with actual stock data, but as a placeholder:
                  // This would be replaced with actual stock check logic
                  return product.reorder_level > 10;
                }).length}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Products below reorder level</p>
            </div>

            {/* Categories Card */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <Folder style={{ color: "#3b82f6", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Categories</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                {categories.length}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Product categories</p>
            </div>

            {/* Average Cost */}
            <div style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              padding: "20px",
              flex: "1",
              minWidth: "200px"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <DollarSign style={{ color: "#10b981", marginRight: "8px" }} size={24} />
                <h2 style={{ fontSize: "18px", fontWeight: "600" }}>Average Cost</h2>
              </div>
              <p style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
                ${products.length > 0 
                  ? (products.reduce((sum, product) => sum + product.unit_cost, 0) / products.length).toFixed(2)
                  : "0.00"}
              </p>
              <p style={{ fontSize: "14px", color: "#6b7280" }}>Per unit</p>
            </div>
          </div>

          {/* Add Product Form */}
          <div style={{ 
            backgroundColor: "white", 
            borderRadius: "8px", 
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "20px",
            overflow: "hidden"
          }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <PackagePlus style={{ color: "#8b5cf6" }} size={24} />
                <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Add New Product</h2>
              </div>
            </div>
            
            <form onSubmit={handleAddProduct} style={{ padding: "20px" }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                gap: "16px",
                marginBottom: "20px"
              }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                    Product Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
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
                    SKU
                  </label>
                  <input
                    type="text"
                    placeholder="Enter SKU"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
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
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={newProduct.unit_cost}
                    onChange={(e) => setNewProduct({ ...newProduct, unit_cost: e.target.value })}
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
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    placeholder="Minimum stock level"
                    min="0"
                    value={newProduct.reorder_level}
                    onChange={(e) => setNewProduct({ ...newProduct, reorder_level: e.target.value })}
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
                    Category
                  </label>
                  {isLoadingCategories ? (
                    <div>Loading categories...</div>
                  ) : (
                    <CategorySelector
                      value={newProduct.category_code}
                      onChange={(value) => setNewProduct({ ...newProduct, category_code: value })}
                      placeholder="-- Select Category --"
                    />
                  )}
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#8b5cf6",
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
                  <PackagePlus size={18} />
                  Add Product
                </button>
              </div>
            </form>
          </div>

          {/* Product Table */}
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
              <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
                {categoryFilter 
                  ? `Products in ${getCategoryName(categoryFilter) || "category"}`
                  : "Product List"}
              </h2>
              
              <button
                onClick={loadProducts}
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
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>SKU</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Category</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Unit Cost</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
                        {categoryFilter 
                          ? `No products found in this category` 
                          : `No products found`}
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.product_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "12px 16px" }}>{product.product_id}</td>
                        <td style={{ padding: "12px 16px", fontWeight: "500" }}>{product.name}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Barcode size={16} style={{ color: "#6b7280" }} />
                            {product.sku}
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {product.category_code ? (
                            <span style={{ 
                              backgroundColor: "#e0f2fe", 
                              color: "#0369a1", 
                              padding: "4px 8px", 
                              borderRadius: "9999px", 
                              fontSize: "14px", 
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <Folder size={14} />
                              {product.category_name || getCategoryName(product.category_code) || product.category_code}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                              Uncategorized
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ 
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px", 
                            color: "#065f46", 
                            fontWeight: "500" 
                          }}>
                            <DollarSign size={16} />
                            {product.unit_cost.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ 
                            backgroundColor: "#f3f4f6",
                            color: "#374151",
                            padding: "4px 8px",
                            borderRadius: "9999px",
                            fontSize: "14px",
                            fontWeight: "500"
                          }}>
                            {product.reorder_level}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}