# app/routers/stock.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import requests

from app.database import get_db
from app.models.stock import Stock
from app.schemas.stock import StockCreate, StockOut

router = APIRouter()

def check_stock_alerts():
    """Helper function to trigger stock alert check"""
    try:
        print("Triggering stock alert check...")
        # Make a request to our own API endpoint to check stock levels
        response = requests.post("http://localhost:8000/alerts/check-stock-levels")
        print(f"Alert check response: {response.status_code}, {response.text}")
        return response.json()
    except Exception as e:
        print(f"Failed to check stock levels: {e}")
        return {"error": str(e)}

# app/routers/stock.py (continued)
def debug_stock_status(db: Session):
    """Debug function to check current stock status"""
    try:
        # Check if we have any zero-quantity stock
        zero_stock_query = """
            SELECT s.stock_id, s.product_id, p.name as product_name, 
                   s.warehouse_id, w.name as warehouse_name, s.quantity
            FROM stock s
            JOIN products p ON s.product_id = p.product_id
            JOIN warehouses w ON s.warehouse_id = w.warehouse_id
            WHERE s.quantity = 0
        """
        zero_stock = db.execute(zero_stock_query).mappings().all()
        print(f"Found {len(zero_stock)} items with zero stock:")
        for item in zero_stock:
            print(f"  - Stock ID: {item['stock_id']}, Product: {item['product_name']}, Warehouse: {item['warehouse_name']}")
        
        # Check if we have any existing alerts
        alerts_query = """
            SELECT COUNT(*) as count FROM stock_alerts WHERE is_resolved = FALSE
        """
        alert_count = db.execute(alerts_query).scalar()
        print(f"Current unresolved alerts: {alert_count}")
        
        # Check product thresholds
        threshold_query = """
            SELECT p.product_id, p.name, p.min_stock_threshold
            FROM products p
            LIMIT 5
        """
        thresholds = db.execute(threshold_query).mappings().all()
        print("Product thresholds:")
        for item in thresholds:
            print(f"  - Product {item['product_id']} ({item['name']}): {item['min_stock_threshold'] or 'None'}")
            
        return {
            "zero_stock_count": len(zero_stock),
            "alert_count": alert_count
        }
    except Exception as e:
        print(f"Error in debug_stock_status: {e}")
        return {"error": str(e)}

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
    
    # Debug current stock status
    debug_stock_status(db)
    
    # Check for alerts after adding stock
    result = check_stock_alerts()
    print(f"Alert check result: {result}")
    
    return db_stock

@router.get("/", response_model=List[StockOut])
def get_all_stock(db: Session = Depends(get_db)):
    return db.query(Stock).all()

@router.put("/{stock_id}", response_model=StockOut)
def update_stock_quantity(stock_id: int, update: StockCreate, db: Session = Depends(get_db)):
    stock = db.query(Stock).filter(Stock.stock_id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock record not found")
    
    print(f"Updating stock ID {stock_id} from quantity {stock.quantity} to {update.quantity}")
    
    for key, value in update.dict().items():
        setattr(stock, key, value)

    db.commit()
    db.refresh(stock)
    
    # Debug current stock status
    debug_stock_status(db)
    
    # Check for alerts after updating stock
    result = check_stock_alerts()
    print(f"Alert check result: {result}")
    
    return stock

@router.get("/debug-stock-status")
def api_debug_stock_status(db: Session = Depends(get_db)):
    """Endpoint to debug current stock status"""
    return debug_stock_status(db)

@router.post("/force-check-alerts")
def force_check_alerts(db: Session = Depends(get_db)):
    """Endpoint to force check alerts"""
    # First debug the stock status
    status = debug_stock_status(db)
    
    # Now attempt to directly create alerts for zero stock items
    try:
        simple_query = """
            SELECT stock_id, product_id, warehouse_id, quantity
            FROM stock
            WHERE quantity = 0
        """
        zero_stock = db.execute(simple_query).mappings().all()
        
        print(f"Found {len(zero_stock)} items with zero stock using simple query")
        alerts_created = 0
        
        for item in zero_stock:
            # Insert alerts directly without checking for existing ones
            insert_query = """
                INSERT INTO stock_alerts 
                (product_id, warehouse_id, current_quantity, threshold, alert_type, created_at, is_resolved)
                VALUES 
                (:product_id, :warehouse_id, 0, 5, 'out_of_stock', CURRENT_TIMESTAMP, FALSE)
            """
            try:
                db.execute(insert_query, {
                    "product_id": item['product_id'],
                    "warehouse_id": item['warehouse_id']
                })
                alerts_created += 1
                print(f"Created test alert for product {item['product_id']}")
            except Exception as e:
                print(f"Error creating test alert: {e}")
        
        db.commit()
        
        # Check how many alerts exist now
        count_query = "SELECT COUNT(*) FROM stock_alerts WHERE is_resolved = FALSE"
        current_count = db.execute(count_query).scalar()
        
        return {
            "status": status,
            "alerts_created": alerts_created,
            "current_alert_count": current_count
        }
    except Exception as e:
        print(f"Error in force_check_alerts: {e}")
        db.rollback()
        return {"error": str(e)}

@router.get("/product/{product_id}", response_model=List[StockOut])
def get_stock_by_product(product_id: int, db: Session = Depends(get_db)):
    return db.query(Stock).filter(Stock.product_id == product_id).all()

@router.get("/warehouse/{warehouse_id}", response_model=List[StockOut])
def get_stock_by_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    return db.query(Stock).filter(Stock.warehouse_id == warehouse_id).all()
    