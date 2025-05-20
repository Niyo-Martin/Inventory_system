# app/routers/stock.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.stock import Stock
from app.schemas.stock import StockCreate, StockOut

router = APIRouter()

@router.post("/", response_model=StockOut)
def add_stock(stock: StockCreate, db: Session = Depends(get_db)):
    existing = db.query(Stock).filter(
        Stock.product_id == stock.product_id,
        Stock.warehouse_id == stock.warehouse_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Stock already exists. Use update.")
    
    db_stock = Stock(**stock.dict())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock

@router.get("/", response_model=List[StockOut])
def get_all_stock(db: Session = Depends(get_db)):
    return db.query(Stock).all()

@router.put("/{stock_id}", response_model=StockOut)
def update_stock_quantity(stock_id: int, update: StockCreate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.stock_id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock record not found")
    
    for key, value in update.dict().items():
        setattr(stock, key, value)

    db.commit()
    db.refresh(stock)
    return stock

@router.get("/product/{product_id}", response_model=List[StockOut])
def get_stock_by_product(product_id: int, db: Session = Depends(get_db)):
    return db.query(Stock).filter(Stock.product_id == product_id).all()

@router.get("/warehouse/{warehouse_id}", response_model=List[StockOut])
def get_stock_by_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    return db.query(Stock).filter(Stock.warehouse_id == warehouse_id).all()
