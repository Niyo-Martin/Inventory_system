# app/schemas/transaction.py
from pydantic import BaseModel
from typing import Optional

class TransactionCreate(BaseModel):
    product_id: int
    warehouse_id: int
    transaction_type: str  # in, out, adjust, transfer
    quantity: int
    note: Optional[str] = None
    created_by: Optional[int] = None

class TransactionOut(TransactionCreate):
    transaction_id: int

    class Config:
        orm_mode = True

class TransferRequest(BaseModel):
    product_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: int
    note: Optional[str] = None
    created_by: Optional[int] = None

