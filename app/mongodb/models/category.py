from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from app.mongodb.database import MongoBaseModel

class CategoryAttribute(BaseModel):
    """Defines an attribute that products in this category should have"""
    name: str
    display_name: str
    description: Optional[str] = None
    data_type: str  # string, number, boolean, date, enum
    unit: Optional[str] = None  # e.g., "kg", "cm", etc.
    required: bool = False
    options: Optional[List[str]] = None  # For enum types
    min_value: Optional[float] = None  # For number types
    max_value: Optional[float] = None  # For number types
    default_value: Optional[Any] = None
    search_weight: int = 1  # Importance in search (1-10)
    display_in_filter: bool = False  # Show in product filter UI
    display_in_product_card: bool = False  # Show in product listing
    sort_order: int = 0  # Display order in forms

class Category(MongoBaseModel):
    """Product category with hierarchical structure and dynamic attributes"""
    name: str
    code: str  # Unique code for the category
    description: Optional[str] = None
    parent_id: Optional[str] = None  # ObjectId of parent category (None for root)
    level: int = 0  # Hierarchy level (0 = root)
    path: List[str] = Field(default_factory=list)  # Path of category codes from root
    
    # UI display settings
    icon: Optional[str] = None  # Icon or image URL
    display_order: int = 0
    visible: bool = True
    
    # Category-specific attributes for products
    attributes: List[CategoryAttribute] = Field(default_factory=list)
    
    # Category-specific settings
    min_stock_threshold: Optional[int] = None
    default_reorder_level: Optional[int] = None
    storage_requirements: Optional[Dict[str, Any]] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

class CreateCategoryRequest(BaseModel):
    """Input model for creating a new category"""
    name: str
    code: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0
    visible: bool = True
    attributes: Optional[List[CategoryAttribute]] = None
    min_stock_threshold: Optional[int] = None
    default_reorder_level: Optional[int] = None
    storage_requirements: Optional[Dict[str, Any]] = None

class UpdateCategoryRequest(BaseModel):
    """Input model for updating a category"""
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None
    visible: Optional[bool] = None
    attributes: Optional[List[CategoryAttribute]] = None
    min_stock_threshold: Optional[int] = None
    default_reorder_level: Optional[int] = None
    storage_requirements: Optional[Dict[str, Any]] = None

class CategoryTree(BaseModel):
    """Category with its children for tree view"""
    id: str
    name: str
    code: str
    description: Optional[str] = None
    level: int
    icon: Optional[str] = None
    visible: bool
    children: List['CategoryTree'] = Field(default_factory=list)
    
# Needed for self-referencing model
CategoryTree.model_rebuild()