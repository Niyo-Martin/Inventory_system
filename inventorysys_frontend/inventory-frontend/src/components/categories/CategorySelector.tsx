// src/components/categories/CategorySelector.tsx
import React, { useState, useEffect } from 'react';
import api from '../../api/client';

interface Category {
  _id: string;
  code: string;
  name: string;
}

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Select a category' 
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    fetchCategories();
  }, []);

  if (loading) {
    return <div>Loading categories...</div>;
  }

  if (error) {
    return <div style={{ color: '#b91c1c' }}>{error}</div>;
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '4px'
      }}
    >
      <option value="">{placeholder}</option>
      {categories.map((category) => (
        <option key={category._id} value={category.code}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategorySelector;