from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    # Add MongoDB category code field - keeping category_id for backward compatibility
    category_code = Column(String(50), index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"))
    reorder_level = Column(Integer, default=0)
    unit_cost = Column(Numeric(10, 2), default=0.00)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())