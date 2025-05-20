from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.return_ import ReturnCreate, ReturnOut
from app.models.return_ import Return
from app.models.stock import Stock
from app.database import get_db
from typing import List

router = APIRouter()

@router.post("/", response_model=ReturnOut)
def handle_return(return_data: ReturnCreate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(
        Stock.product_id == return_data.product_id,
        Stock.warehouse_id == return_data.warehouse_id
    ).first()

    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")

    if return_data.return_type == "from_customer":
        stock.quantity += return_data.quantity
    elif return_data.return_type == "to_supplier":
        if stock.quantity < return_data.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock to return")
        stock.quantity -= return_data.quantity
    else:
        raise HTTPException(status_code=400, detail="Invalid return type")

    return_record = Return(**return_data.dict())
    db.add(return_record)
    db.commit()
    db.refresh(return_record)
    return return_record

@router.get("/", response_model=List[ReturnOut])
def get_all_returns(db: Session = Depends(get_db)):
    return db.query(Return).all()
