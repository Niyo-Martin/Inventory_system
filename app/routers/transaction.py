# app/routers/transaction.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.stock import Stock
from app.schemas.transaction import TransactionCreate, TransactionOut, TransferRequest
from app.database import get_db
from typing import List

router = APIRouter()

@router.post("/", response_model=TransactionOut)
def create_transaction(txn: TransactionCreate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(
        Stock.product_id == txn.product_id,
        Stock.warehouse_id == txn.warehouse_id
    ).first()

    if not stock:
        raise HTTPException(status_code=404, detail="Stock entry not found")

    # Adjust quantity based on transaction type
    if txn.transaction_type == "in":
        stock.quantity += txn.quantity
    elif txn.transaction_type == "out":
        if stock.quantity < txn.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock")
        stock.quantity -= txn.quantity
    elif txn.transaction_type == "adjust":
        stock.quantity = txn.quantity
    elif txn.transaction_type == "transfer":
        raise HTTPException(status_code=501, detail="Use transfer endpoint (future)")
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    db_transaction = Transaction(**txn.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    db.commit()
    return db_transaction

@router.get("/", response_model=List[TransactionOut])
def list_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).order_by(Transaction.created_at.desc()).all()

###### transfer

@router.post("/transfer", response_model=List[TransactionOut])
def transfer_stock(txn: TransferRequest, db: Session = Depends(get_db)):
    # Step 1: Get source stock
    from_stock = db.query(Stock).filter(
        Stock.product_id == txn.product_id,
        Stock.warehouse_id == txn.from_warehouse_id
    ).first()

    if not from_stock or from_stock.quantity < txn.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock in source warehouse")

    # Step 2: Get or create destination stock
    to_stock = db.query(Stock).filter(
        Stock.product_id == txn.product_id,
        Stock.warehouse_id == txn.to_warehouse_id
    ).first()

    if not to_stock:
        to_stock = Stock(product_id=txn.product_id, warehouse_id=txn.to_warehouse_id, quantity=0)
        db.add(to_stock)

    # Step 3: Perform the transfer
    from_stock.quantity -= txn.quantity
    to_stock.quantity += txn.quantity

    # Step 4: Log both movements
    transfer_out = Transaction(
        product_id=txn.product_id,
        warehouse_id=txn.from_warehouse_id,
        transaction_type="transfer",
        quantity=-txn.quantity,
        note=f"Transfer to warehouse {txn.to_warehouse_id}: {txn.note}",
        created_by=txn.created_by
    )

    transfer_in = Transaction(
        product_id=txn.product_id,
        warehouse_id=txn.to_warehouse_id,
        transaction_type="transfer",
        quantity=txn.quantity,
        note=f"Transfer from warehouse {txn.from_warehouse_id}: {txn.note}",
        created_by=txn.created_by
    )

    db.add_all([transfer_out, transfer_in])
    db.commit()
    db.refresh(transfer_out)
    db.refresh(transfer_in)

    return [transfer_out, transfer_in]


