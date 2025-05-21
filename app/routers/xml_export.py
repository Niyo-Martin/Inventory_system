from fastapi import APIRouter, Depends, HTTPException, Response, File, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.supplier import Supplier
from app.models.warehouse import Warehouse
from app.utils.xml_exports import generate_products_xml, generate_categories_xml, generate_purchase_orders_xml
from app.utils.xml_imports import parse_products_xml, parse_purchase_orders_xml
from app.utils.xml_schemas import validate_products_xml, validate_purchase_orders_xml
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.schemas.product import ProductCreate
# Remove the problematic import
# from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderItemCreate
# Import only what's available
from app.schemas.purchase_order import PurchaseOrderCreate
from typing import List, Optional
import xml.etree.ElementTree as ET
from datetime import datetime

router = APIRouter(
    prefix="/xml",
    tags=["XML Exports"]
)

# Product XML export endpoint
@router.get("/products", 
    response_class=Response,
    responses={
        200: {
            "content": {"application/xml": {}},
            "description": "Export products as XML"
        }
    }
)
def export_products_xml(
    category_code: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export products as XML"""
    query = db.query(Product)
    
    # Apply category filter if provided
    if category_code:
        query = query.filter(Product.category_code == category_code)
    
    products = query.all()
    
    # Convert SQLAlchemy objects to dictionaries
    product_dicts = [
        {
            "product_id": p.product_id,
            "name": p.name,
            "sku": p.sku,
            "description": p.description,
            "price": float(p.price) if hasattr(p, 'price') else float(p.unit_cost) if hasattr(p, 'unit_cost') else 0.0,
            "category_code": p.category_code if hasattr(p, 'category_code') else None,
            "reorder_level": p.reorder_level,
            "min_stock_threshold": p.min_stock_threshold if hasattr(p, 'min_stock_threshold') else p.reorder_level
        }
        for p in products
    ]
    
    xml_content = generate_products_xml(product_dicts)
    
    return Response(
        content=xml_content,
        media_type="application/xml"
    )

# Product XML import endpoint
@router.post("/products/import")
async def import_products_xml(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import products from XML file"""
    # Check file extension
    if not file.filename.endswith('.xml'):
        raise HTTPException(status_code=400, detail="File must be XML format")
    
    # Read the file
    contents = await file.read()
    xml_content = contents.decode('utf-8')
    
    try:
        # Validate XML against schema
        validate_products_xml(xml_content)
        
        # Parse XML to product dictionaries
        products = parse_products_xml(xml_content)
        
        # Process and save each product
        created_products = []
        skipped_products = []
        
        for product_data in products:
            # Check if product with this SKU already exists
            existing = db.query(Product).filter(Product.sku == product_data.get('sku')).first()
            
            if existing:
                skipped_products.append(product_data.get('sku'))
                continue
            
            # Create and validate ProductCreate schema
            try:
                product_create = ProductCreate(**product_data)
                
                # Save to database
                db_product = Product(**product_create.dict())
                db.add(db_product)
                created_products.append(product_data.get('sku'))
            except Exception as e:
                skipped_products.append(f"{product_data.get('sku')} (Error: {str(e)})")
        
        db.commit()
        
        return {
            "message": f"Import complete. {len(created_products)} products created, {len(skipped_products)} skipped.",
            "created": created_products,
            "skipped": skipped_products
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Categories XML export endpoint
@router.get("/categories",
    response_class=Response,
    responses={
        200: {
            "content": {"application/xml": {}},
            "description": "Export categories as XML"
        }
    }
)
async def export_categories_xml(
    current_user: User = Depends(get_current_user)
):
    """Export product categories as XML"""
    from app.mongodb.repositories.category_repository import CategoryRepository
    
    categories = await CategoryRepository.get_all()
    xml_content = await generate_categories_xml(categories)
    
    return Response(
        content=xml_content,
        media_type="application/xml"
    )

# Purchase Orders XML export endpoint
@router.get("/purchase-orders", 
    response_class=Response,
    responses={
        200: {
            "content": {"application/xml": {}},
            "description": "Export purchase orders as XML"
        }
    }
)
def export_purchase_orders_xml(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export purchase orders as XML"""
    purchase_orders = db.query(PurchaseOrder).all()
    xml_content = generate_purchase_orders_xml(purchase_orders, db)
    
    return Response(
        content=xml_content,
        media_type="application/xml"
    )

# Purchase Orders XML import endpoint
@router.post("/purchase-orders/import")
async def import_purchase_orders_xml(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import purchase orders from XML file"""
    # Check file extension
    if not file.filename.endswith('.xml'):
        raise HTTPException(status_code=400, detail="File must be XML format")
    
    # Read the file
    contents = await file.read()
    xml_content = contents.decode('utf-8')
    
    try:
        # Validate XML against schema
        validate_purchase_orders_xml(xml_content)
        
        # Parse XML to purchase order dictionaries
        purchase_orders = parse_purchase_orders_xml(xml_content)
        
        # Process and save each purchase order
        created_pos = []
        skipped_pos = []
        
        for po_data in purchase_orders:
            try:
                # Extract items from PO data
                items_data = po_data.pop('items', [])
                
                # Create PO using the model directly
                po = PurchaseOrder(**po_data)
                db.add(po)
                db.flush()  # Get PO ID
                
                # Create PO items directly using the model
                for item_data in items_data:
                    item_data['po_id'] = po.po_id
                    po_item = PurchaseOrderItem(**item_data)
                    db.add(po_item)
                
                created_pos.append(po.po_id)
            except Exception as e:
                skipped_pos.append(f"PO for supplier {po_data.get('supplier_id')} (Error: {str(e)})")
        
        db.commit()
        
        return {
            "message": f"Import complete. {len(created_pos)} purchase orders created, {len(skipped_pos)} skipped.",
            "created": created_pos,
            "skipped": skipped_pos
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))