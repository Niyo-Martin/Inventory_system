from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class Return(Base):
    __tablename__ = "returns"

    return_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.warehouse_id"))
    return_type = Column(String(20))
    quantity = Column(Integer)
    reason = Column(Text)
    created_by = Column(Integer, ForeignKey("users.user_id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
