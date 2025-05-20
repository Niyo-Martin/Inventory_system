from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderOut
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.stock import Stock
from app.database import get_db
from datetime import date
from typing import Optional, List

router = APIRouter()

@router.post("/", response_model=PurchaseOrderOut)
def create_po(po_data: PurchaseOrderCreate, db: Session = Depends(get_db)):
    """Create a new purchase order"""
    # Create the main purchase order
    po = PurchaseOrder(
        supplier_id=po_data.supplier_id,
        ordered_by=po_data.ordered_by if hasattr(po_data, 'ordered_by') and po_data.ordered_by else 1,  # Default to user ID 1 if not provided
        expected_delivery=po_data.expected_delivery,
        notes=po_data.notes,
        order_date=date.today(),
        status="pending"  # Ensure status is set
    )
    db.add(po)
    db.commit()
    db.refresh(po)

    # Add purchase order items
    for item in po_data.items:
        po_item = PurchaseOrderItem(
            po_id=po.po_id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            warehouse_id=item.warehouse_id if hasattr(item, 'warehouse_id') and item.warehouse_id else 1  # Default warehouse
        )
        db.add(po_item)

    db.commit()
    return po

@router.get("/", response_model=List[PurchaseOrderOut])
def get_purchase_orders(
    limit: Optional[int] = None,
    skip: int = 0,
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all purchase orders with optional filtering"""
    query = db.query(PurchaseOrder)
    
    # Apply filters if provided
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    if status:
        query = query.filter(PurchaseOrder.status == status)
    
    # Order by most recent first
    query = query.order_by(PurchaseOrder.order_date.desc())
    
    # Apply pagination
    query = query.offset(skip)
    if limit:
        query = query.limit(limit)
    
    return query.all()

@router.get("/{po_id}", response_model=PurchaseOrderOut)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    """Get a specific purchase order by ID"""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.po_id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po

@router.put("/{po_id}/status")
def update_po_status(
    po_id: int, 
    new_status: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update purchase order status"""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.po_id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Valid statuses
    valid_statuses = ["pending", "approved", "shipped", "received", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    old_status = po.status
    po.status = new_status
    
    # Add to history (if you implement history tracking)
    # This would require creating a POStatusHistory table
    
    db.commit()
    return {
        "message": f"Purchase order status updated from {old_status} to {new_status}",
        "po_id": po_id,
        "old_status": old_status,
        "new_status": new_status
    }

@router.post("/{po_id}/receive")
def receive_po(po_id: int, db: Session = Depends(get_db)):
    """Receive a purchase order and update inventory"""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.po_id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    if po.status != "pending":
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot receive PO with status '{po.status}'. Only pending orders can be received."
        )

    # Get all items for this PO
    items = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id == po_id).all()
    
    if not items:
        raise HTTPException(status_code=400, detail="No items found for this purchase order")
    
    # Update inventory for each item
    for item in items:
        stock = db.query(Stock).filter(
            Stock.product_id == item.product_id,
            Stock.warehouse_id == item.warehouse_id
        ).first()

        if not stock:
            # Create new stock entry if it doesn't exist
            stock = Stock(
                product_id=item.product_id, 
                warehouse_id=item.warehouse_id, 
                quantity=0
            )
            db.add(stock)

        # Add received quantity to existing stock
        stock.quantity += item.quantity

    # Update PO status to received
    po.status = "received"
    db.commit()
    
    return {
        "message": f"Purchase order #{po_id} received and inventory updated.",
        "po_id": po_id,
        "items_received": len(items),
        "status": "received"
    }

@router.get("/{po_id}/history")
def get_po_history(po_id: int, db: Session = Depends(get_db)):
    """Get the status change history for a purchase order"""
    try:
        # Check if PO exists first
        po = db.query(PurchaseOrder).filter(PurchaseOrder.po_id == po_id).first()
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        
        # Try to get the history from po_status_history table if it exists
        try:
            query = """
                SELECT 
                    h.*,
                    u.username as changed_by_name
                FROM 
                    po_status_history h
                LEFT JOIN
                    users u ON h.changed_by = u.user_id
                WHERE 
                    h.po_id = :po_id
                ORDER BY 
                    h.changed_at
            """
            
            history = db.execute(query, {"po_id": po_id}).mappings().all()
            
            if history:
                return list(history)
                
        except Exception as e:
            # If history table doesn't exist or query fails, continue to fallback
            print(f"History table query failed: {e}")
        
        # Fallback: Return initial state if no history table exists
        return [{
            "history_id": 0,
            "po_id": po_id,
            "old_status": None,
            "new_status": po.status,
            "changed_by": None,
            "changed_by_name": "System",
            "changed_at": po.order_date.isoformat() if hasattr(po, 'order_date') and po.order_date else None,
            "notes": "Initial state - History tracking not yet implemented"
        }]
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle any other unexpected errors
        print(f"Error in get_po_history: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Internal server error while retrieving purchase order history"
        )

@router.delete("/{po_id}")
def delete_purchase_order(po_id: int, db: Session = Depends(get_db)):
    """Delete a purchase order (only if status is pending)"""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.po_id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    if po.status != "pending":
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete PO with status '{po.status}'. Only pending orders can be deleted."
        )
    
    # Delete associated items first
    db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id == po_id).delete()
    
    # Delete the purchase order
    db.delete(po)
    db.commit()
    
    return {"message": f"Purchase order #{po_id} deleted successfully"}

@router.get("/{po_id}/items")
def get_po_items(po_id: int, db: Session = Depends(get_db)):
    """Get all items for a specific purchase order"""
    po = db.query(PurchaseOrder).filter(PurchaseOrder.po_id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    items = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id == po_id).all()
    return items