from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class POItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float
    warehouse_id: Optional[int] = 1  # Made optional with default

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    ordered_by: Optional[int] = None  # Made optional
    expected_delivery: Optional[date] = None  # Keep optional
    notes: Optional[str] = None
    items: List[POItemCreate]

class PurchaseOrderOut(BaseModel):
    po_id: int
    status: str
    supplier_id: int
    order_date: date
    expected_delivery: Optional[date]
    notes: Optional[str]

    class Config:
        orm_mode = True