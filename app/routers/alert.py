# app/routers/alert.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.alert import StockAlertOut, AlertResolve

router = APIRouter()

@router.get("/")
def get_alerts(
    resolved: bool = False, 
    product_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get all alerts with optional filtering"""
    try:
        query = """
            SELECT 
                a.*, 
                p.name as product_name, 
                w.name as warehouse_name 
            FROM 
                stock_alerts a
            JOIN 
                products p ON a.product_id = p.product_id
            JOIN 
                warehouses w ON a.warehouse_id = w.warehouse_id
            WHERE 
                a.is_resolved = :resolved
                AND (:product_id IS NULL OR a.product_id = :product_id)
                AND (:warehouse_id IS NULL OR a.warehouse_id = :warehouse_id)
            ORDER BY 
                a.created_at DESC
        """
        
        result = db.execute(query, {
            "resolved": resolved,
            "product_id": product_id,
            "warehouse_id": warehouse_id
        }).mappings().all()
        
        return list(result)
    except Exception as e:
        print(f"Error in get_alerts: {e}")
        # Return empty list instead of error
        return []

@router.put("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Mark an alert as resolved"""
    try:
        query = """
            UPDATE stock_alerts 
            SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
            WHERE alert_id = :alert_id
        """
        
        result = db.execute(query, {"alert_id": alert_id})
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        db.commit()
        return {"message": "Alert resolved successfully"}
    except Exception as e:
        print(f"Error in resolve_alert: {e}")
        db.rollback()
        # More user-friendly error
        return {"message": "Unable to resolve alert. Alert may not exist."}
        