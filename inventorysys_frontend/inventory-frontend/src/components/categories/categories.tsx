// src/components/categories/Categories.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../../api/client';

interface Category {
  _id: string;
  code: string;
  name: string;
  description?: string;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    code: '',
    description: ''
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const generateCode = () => {
    if (!formData.name) return;
    
    // Generate a simple code from the name
    const code = formData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      setError('Name and code are required');
      return;
    }
    
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.code}`, formData);
        setSuccess('Category updated successfully');
      } else {
        await api.post('/categories', formData);
        setSuccess('Category created successfully');
      }
      
      // Reset form and refresh data
      setFormData({ name: '', code: '', description: '' });
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save category:', err);
      setError('Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (code: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      await api.delete(`/categories/${code}`);
      setSuccess('Category deleted successfully');
      fetchCategories();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Failed to delete category');
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Categories</h1>
        <button
          onClick={() => {
            setFormData({ name: '', code: '', description: '' });
            setEditingCategory(null);
            setShowForm(true);
          }}
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
          <Plus size={16} />
          Add Category
        </button>
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
            onClick={() => setError('')} 
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
            onClick={() => setSuccess('')} 
            style={{ background: "none", border: "none", cursor: "pointer", color: "#065f46" }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Category Form */}
      {showForm && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "8px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "20px"
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                onBlur={() => !formData.code && generateCode()}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px"
                }}
              />
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ fontWeight: "500" }}>
                  Category Code *
                </label>
                <button
                  type="button"
                  onClick={generateCode}
                  style={{
                    backgroundColor: "transparent",
                    color: "#3b82f6",
                    border: "none",
                    padding: "0",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  Generate from name
                </button>
              </div>
              <input
                type="text"
                name="code"
                value={formData.code || ''}
                onChange={handleInputChange}
                disabled={!!editingCategory}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  backgroundColor: editingCategory ? "#f3f4f6" : "white"
                }}
              />
              <p style={{ marginTop: "4px", fontSize: "14px", color: "#6b7280" }}>
                Unique identifier used in your database
              </p>
            </div>
            
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  resize: "vertical"
                }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  setFormData({ name: '', code: '', description: '' });
                }}
                style={{
                  backgroundColor: "white",
                  color: "#4b5563",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  padding: "8px 16px",
                  cursor: "pointer"
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
                  padding: "8px 16px",
                  cursor: "pointer"
                }}
              >
                {editingCategory ? 'Update' : 'Save'} Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Table */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600" }}>Category List</h2>
        </div>
        
        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
            No categories found. Add your first category to get started.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Code</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Description</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px 16px" }}>{category.code}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "500" }}>{category.name}</td>
                    <td style={{ padding: "12px 16px" }}>{category.description || '-'}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleEdit(category)}
                          style={{
                            backgroundColor: "#e0e7ff",
                            color: "#4f46e5",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px",
                            cursor: "pointer"
                          }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.code)}
                          style={{
                            backgroundColor: "#fee2e2",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px",
                            cursor: "pointer"
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;