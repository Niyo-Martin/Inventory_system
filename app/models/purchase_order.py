from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    po_id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"))
    ordered_by = Column(Integer, ForeignKey("users.user_id"))
    status = Column(String(20), default="pending")
    order_date = Column(Date)
    expected_delivery = Column(Date)
    notes = Column(Text)

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    po_item_id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.po_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    quantity = Column(Integer)
    unit_cost = Column(Integer)
    warehouse_id = Column(Integer, ForeignKey("warehouses.warehouse_id"))
