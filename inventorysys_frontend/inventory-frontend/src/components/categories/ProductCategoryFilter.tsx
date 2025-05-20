import React from 'react';
import { Filter, XCircle } from 'lucide-react';
import CategorySelector from './CategorySelector';

interface ProductCategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

const ProductCategoryFilter: React.FC<ProductCategoryFilterProps> = ({
  value,
  onChange,
  onClear,
  isLoading = false
}) => {
  return (
    <div style={{ 
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "16px"
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center",
        gap: "8px"
      }}>
        <Filter size={18} style={{ color: "#3b82f6" }} />
        <span style={{ fontWeight: "500" }}>Filter by category:</span>
      </div>
      
      <div style={{ flex: 1, maxWidth: "300px" }}>
        <CategorySelector
          value={value}
          onChange={onChange}
          placeholder="All Categories"
        />
      </div>
      
      {value && (
        <button
          onClick={onClear}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "8px 12px",
            backgroundColor: "#f3f4f6",
            color: "#4b5563",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          <XCircle size={16} />
          Clear
        </button>
      )}
    </div>
  );
};

export default ProductCategoryFilter;