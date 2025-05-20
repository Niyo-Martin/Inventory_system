from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductOut
from app.database import get_db
from typing import List, Optional
from app.utils.permissions import require_admin, require_staff
from app.models.purchase_order import PurchaseOrder

router = APIRouter()

@router.post("/", response_model=ProductOut)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[ProductOut])
async def get_all_products(
    category_code: Optional[str] = Query(None, description="Filter products by MongoDB category code"),
    db: Session = Depends(get_db)
):
    """
    Get all products with optional category filtering.
    If category_code is provided, only products in that category will be returned.
    """
    query = db.query(Product)
    
    # Apply category filter if provided
    if category_code:
        # Optional validation - check if category exists
        try:
            from app.mongodb.database import db as mongo_db
            category = await mongo_db.categories.find_one({"code": category_code})
            if not category:
                # If category doesn't exist, return empty list instead of error
                # to maintain backward compatibility
                return []
        except ImportError:
            # If MongoDB not available, just continue with filtering
            pass
        
        # Filter products by category_code
        query = query.filter(Product.category_code == category_code)
    
    return query.all()

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, updated: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in updated.dict().items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), user = Depends(require_admin)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"detail": "Product deleted successfully"}

@router.post("/{po_id}/receive")
def receive_po(po_id: int, db: Session = Depends(get_db), user = Depends(require_staff)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.po_id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po.status != "pending":
        raise HTTPException(status_code=400, detail="PO already processed")
    
    # Additional logic for receiving PO would go here
    return {"detail": "PO received successfully"}