from pydantic import BaseModel

class StockBase(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: int

class StockCreate(StockBase):
    pass

class StockOut(StockBase):
    stock_id: int

    class Config:
        orm_mode = True
