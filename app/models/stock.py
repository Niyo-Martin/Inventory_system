# app/models/stock.py
from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base

class Stock(Base):
    __tablename__ = "stock"

    stock_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.warehouse_id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        # Ensure one product per warehouse
        {'sqlite_autoincrement': True},  # optional, MySQL will still work
    )
