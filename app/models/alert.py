# app/models/alert.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from app.database import Base

class StockAlert(Base):
    __tablename__ = "stock_alerts"
    
    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.warehouse_id"), nullable=False)
    current_quantity = Column(Integer, nullable=False)
    threshold = Column(Integer, nullable=False)
    alert_type = Column(String(50), nullable=False)  # 'out_of_stock' or 'low_stock'
    created_at = Column(DateTime, default=func.now(), nullable=False)
    is_resolved = Column(Boolean, default=False, nullable=False)
    resolved_at = Column(DateTime, nullable=True)