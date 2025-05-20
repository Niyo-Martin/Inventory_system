from pydantic import BaseModel
from typing import Optional

class ReturnCreate(BaseModel):
    product_id: int
    warehouse_id: int
    return_type: str  # from_customer, to_supplier
    quantity: int
    reason: Optional[str]
    created_by: Optional[int]

class ReturnOut(ReturnCreate):
    return_id: int

    class Config:
        orm_mode = True
