# app/schemas/po_history.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class POStatusHistoryOut(BaseModel):
    history_id: int
    po_id: int
    old_status: Optional[str]
    new_status: str
    changed_by: Optional[int]
    changed_by_name: Optional[str]
    changed_at: datetime
    notes: Optional[str]
    
    class Config:
        orm_mode = True