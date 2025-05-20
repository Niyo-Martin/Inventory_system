# app/schemas/alert.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StockAlertOut(BaseModel):
    alert_id: int
    product_id: int
    product_name: str
    warehouse_id: int
    warehouse_name: str
    current_quantity: int
    threshold: int
    alert_type: str
    created_at: datetime
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class AlertResolve(BaseModel):
    resolution_note: Optional[str] = None