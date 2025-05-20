# app/models/warehouse.py
from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class Warehouse(Base):
    __tablename__ = "warehouses"

    warehouse_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(Text)
