# app/routers/report.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List
from app.database import get_db

router = APIRouter()

@router.get("/stock-summary")
def stock_summary(db: Session = Depends(get_db)):
    """Get stock summary from view"""
    try:
        result = db.execute("SELECT * FROM view_stock_summary").mappings().all()
        return list(result)
    except Exception as e:
        print(f"Error in stock summary: {e}")
        return []

@router.get("/valuation")
def inventory_valuation(
    warehouse_id: Optional[int] = None,
    low_stock_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get inventory valuation with optional filtering"""
    try:
        result = db.execute(
            "CALL sp_inventory_valuation(:warehouse_id, :low_stock_only)",
            {
                "warehouse_id": warehouse_id,
                "low_stock_only": low_stock_only
            }
        ).mappings().all()
        return list(result)
    except Exception as e:
        print(f"Error in inventory valuation: {e}")
        # Fallback to using the view directly if stored procedure fails
        try:
            query = "SELECT * FROM view_inventory_valuation"
            if warehouse_id is not None:
                query += f" WHERE warehouse_id = {warehouse_id}"
            result = db.execute(query).mappings().all()
            return list(result)
        except Exception as fallback_e:
            print(f"Fallback error: {fallback_e}")
            return []

@router.get("/movement")
def product_movement(
    product_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get product movement with optional filtering"""
    try:
        result = db.execute(
            "CALL sp_product_movement(:product_id, :start_date, :end_date)",
            {
                "product_id": product_id,
                "start_date": start_date,
                "end_date": end_date
            }
        ).mappings().all()
        return list(result)
    except Exception as e:
        print(f"Error in product movement: {e}")
        # Fallback to view
        try:
            result = db.execute("SELECT * FROM view_product_movement").mappings().all()
            return list(result)
        except Exception as fallback_e:
            print(f"Fallback error: {fallback_e}")
            return []

@router.get("/stock-status")
def stock_status(
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    status: Optional[str] = Query(None, description="Filter by stock status: 'LOW_STOCK', 'OUT_OF_STOCK', or 'OK'"),
    db: Session = Depends(get_db)
):
    """Get stock status with optional filtering"""
    try:
        result = db.execute(
            "CALL sp_stock_status(:category_id, :supplier_id, :status)",
            {
                "category_id": category_id,
                "supplier_id": supplier_id,
                "status": status
            }
        ).mappings().all()
        return list(result)
    except Exception as e:
        print(f"Error in stock status: {e}")
        # Fallback to basic query if procedure fails
        try:
            query = """
                SELECT 
                    s.stock_id,
                    p.product_id,
                    p.name,
                    p.sku,
                    s.quantity,
                    p.reorder_level,
                    CASE 
                        WHEN s.quantity = 0 THEN 'OUT_OF_STOCK'
                        WHEN s.quantity <= p.reorder_level THEN 'LOW_STOCK'
                        ELSE 'OK'
                    END AS stock_status
                FROM 
                    stock s
                JOIN 
                    products p ON p.product_id = s.product_id
                JOIN 
                    warehouses w ON w.warehouse_id = s.warehouse_id
                WHERE 1=1
            """
            params = {}
            
            if status:
                if status == 'LOW_STOCK':
                    query += " AND s.quantity <= p.reorder_level AND s.quantity > 0"
                elif status == 'OUT_OF_STOCK':
                    query += " AND s.quantity = 0"
                elif status == 'OK':
                    query += " AND s.quantity > p.reorder_level"

            if category_id:
                query += " AND p.category_id = :category_id"
                params['category_id'] = category_id
                
            if supplier_id:
                query += " AND p.supplier_id = :supplier_id"
                params['supplier_id'] = supplier_id
                
            result = db.execute(query, params).mappings().all()
            return list(result)
        except Exception as fallback_e:
            print(f"Fallback error: {fallback_e}")
            return []

@router.get("/purchase-orders")
def purchase_order_analysis(
    supplier_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get purchase order analysis with optional filtering"""
    try:
        result = db.execute(
            "CALL sp_purchase_order_analysis(:supplier_id, :start_date, :end_date, :status)",
            {
                "supplier_id": supplier_id,
                "start_date": start_date,
                "end_date": end_date,
                "status": status
            }
        ).mappings().all()
        return list(result)
    except Exception as e:
        print(f"Error in purchase order analysis: {e}")
        # Fallback query if procedure fails
        try:
            query = """
                SELECT
                    po.po_id,
                    s.name AS supplier_name,
                    po.order_date,
                    po.expected_delivery,
                    po.status,
                    COUNT(poi.po_item_id) AS item_count,
                    COALESCE(SUM(poi.quantity * poi.unit_cost), 0) AS total_value,
                    u.username AS ordered_by
                FROM
                    purchase_orders po
                JOIN
                    suppliers s ON po.supplier_id = s.supplier_id
                LEFT JOIN
                    purchase_order_items poi ON po.po_id = poi.po_id
                LEFT JOIN
                    users u ON po.ordered_by = u.user_id
                WHERE 1=1
            """
            params = {}
            
            if supplier_id:
                query += " AND po.supplier_id = :supplier_id"
                params['supplier_id'] = supplier_id
                
            if start_date:
                query += " AND po.order_date >= :start_date"
                params['start_date'] = start_date
                
            if end_date:
                query += " AND po.order_date <= :end_date"
                params['end_date'] = end_date
                
            if status:
                query += " AND po.status = :status"
                params['status'] = status
            
            query += " GROUP BY po.po_id, s.name, po.order_date, po.expected_delivery, po.status, u.username"
            query += " ORDER BY po.order_date DESC"
            
            result = db.execute(query, params).mappings().all()
            return list(result)
        except Exception as fallback_e:
            print(f"Fallback error: {fallback_e}")
            return []

@router.get("/daily-flow")
def daily_flow(db: Session = Depends(get_db)):
    """Get daily flow from view"""
    try:
        result = db.execute("SELECT * FROM view_daily_flow").mappings().all()
        return list(result)
    except Exception as e:
        print(f"Error in daily flow: {e}")
        return []