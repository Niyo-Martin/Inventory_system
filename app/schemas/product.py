from pydantic import BaseModel
from typing import Optional

class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    category_code: Optional[str] = None  # Added MongoDB category code field
    supplier_id: Optional[int] = None
    reorder_level: Optional[int] = 0
    unit_cost: Optional[float] = 0.0

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    product_id: int

    class Config:
        orm_mode = True