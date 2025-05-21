# app/routers/alert.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.alert import StockAlertOut, AlertResolve
import sqlalchemy

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
        
        result = db.execute(sqlalchemy.text(query), {
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
        
        result = db.execute(sqlalchemy.text(query), {"alert_id": alert_id})
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        db.commit()
        return {"message": "Alert resolved successfully"}
    except Exception as e:
        print(f"Error in resolve_alert: {e}")
        db.rollback()
        # More user-friendly error
        return {"message": "Unable to resolve alert. Alert may not exist."}

@router.post("/check-stock-levels")
def check_stock_levels(db: Session = Depends(get_db)):
    """
    Check all stock levels against thresholds and create alerts for any issues
    """
    try:
        # First, get all stock items with their thresholds
        query = """
            SELECT 
                s.stock_id, 
                s.product_id, 
                p.name as product_name,
                s.warehouse_id, 
                w.name as warehouse_name,
                s.quantity, 
                COALESCE(p.min_stock_threshold, 5) as threshold
            FROM 
                stock s
            JOIN 
                products p ON s.product_id = p.product_id
            JOIN 
                warehouses w ON s.warehouse_id = w.warehouse_id
        """
        stock_items = db.execute(sqlalchemy.text(query)).mappings().all()
        
        print(f"Found {len(stock_items)} stock items to check")
        print(f"Stock items with zero quantity: {[item['product_name'] for item in stock_items if item['quantity'] == 0]}")
        
        alerts_created = 0
        
        for item in stock_items:
            # Check for zero stock
            if item['quantity'] == 0:
                print(f"Found zero stock for product {item['product_id']} - {item['product_name']}")
                # Check if alert already exists for this item
                existing_query = """
                    SELECT COUNT(*) as count
                    FROM stock_alerts
                    WHERE product_id = :product_id 
                    AND warehouse_id = :warehouse_id
                    AND alert_type = 'out_of_stock'
                    AND is_resolved = FALSE
                """
                existing = db.execute(sqlalchemy.text(existing_query), {
                    "product_id": item['product_id'],
                    "warehouse_id": item['warehouse_id']
                }).scalar()
                
                print(f"Existing alerts for this item: {existing}")
                
                if existing == 0:
                    # Create new out of stock alert
                    insert_query = """
                        INSERT INTO stock_alerts 
                        (product_id, warehouse_id, current_quantity, threshold, alert_type, created_at, is_resolved)
                        VALUES 
                        (:product_id, :warehouse_id, :quantity, :threshold, 'out_of_stock', CURRENT_TIMESTAMP, FALSE)
                    """
                    try:
                        db.execute(sqlalchemy.text(insert_query), {
                            "product_id": item['product_id'],
                            "warehouse_id": item['warehouse_id'],
                            "quantity": item['quantity'],
                            "threshold": item['threshold']
                        })
                        alerts_created += 1
                        print(f"Created out_of_stock alert for product {item['product_id']}")
                    except Exception as e:
                        print(f"Error creating alert: {e}")
            
            # Check for low stock
            elif item['quantity'] < item['threshold']:
                print(f"Found low stock for product {item['product_id']} - {item['product_name']} ({item['quantity']} < {item['threshold']})")
                # Check if alert already exists for this item
                existing_query = """
                    SELECT COUNT(*) as count
                    FROM stock_alerts
                    WHERE product_id = :product_id 
                    AND warehouse_id = :warehouse_id
                    AND alert_type = 'low_stock'
                    AND is_resolved = FALSE
                """
                existing = db.execute(sqlalchemy.text(existing_query), {
                    "product_id": item['product_id'],
                    "warehouse_id": item['warehouse_id']
                }).scalar()
                
                print(f"Existing alerts for this item: {existing}")
                
                if existing == 0:
                    # Create new low stock alert
                    insert_query = """
                        INSERT INTO stock_alerts 
                        (product_id, warehouse_id, current_quantity, threshold, alert_type, created_at, is_resolved)
                        VALUES 
                        (:product_id, :warehouse_id, :quantity, :threshold, 'low_stock', CURRENT_TIMESTAMP, FALSE)
                    """
                    try:
                        db.execute(sqlalchemy.text(insert_query), {
                            "product_id": item['product_id'],
                            "warehouse_id": item['warehouse_id'],
                            "quantity": item['quantity'],
                            "threshold": item['threshold']
                        })
                        alerts_created += 1
                        print(f"Created low_stock alert for product {item['product_id']}")
                    except Exception as e:
                        print(f"Error creating alert: {e}")
        
        # Resolve alerts that no longer apply
        resolve_out_of_stock_query = """
            UPDATE stock_alerts
            SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
            WHERE is_resolved = FALSE
            AND alert_type = 'out_of_stock'
            AND EXISTS (
                SELECT 1 FROM stock s 
                WHERE s.product_id = stock_alerts.product_id 
                AND s.warehouse_id = stock_alerts.warehouse_id 
                AND s.quantity > 0
            )
        """
        
        resolve_low_stock_query = """
            UPDATE stock_alerts
            SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP
            WHERE is_resolved = FALSE
            AND alert_type = 'low_stock'
            AND EXISTS (
                SELECT 1 FROM stock s 
                JOIN products p ON s.product_id = p.product_id
                WHERE s.product_id = stock_alerts.product_id 
                AND s.warehouse_id = stock_alerts.warehouse_id 
                AND s.quantity >= COALESCE(p.min_stock_threshold, 5)
            )
        """
        
        resolved_out = db.execute(sqlalchemy.text(resolve_out_of_stock_query)).rowcount
        resolved_low = db.execute(sqlalchemy.text(resolve_low_stock_query)).rowcount
        
        db.commit()
        return {"message": f"Stock check complete. {alerts_created} new alerts created, {resolved_out + resolved_low} alerts auto-resolved."}
    
    except Exception as e:
        print(f"Error in check_stock_levels: {e}")
        db.rollback()
        return {"message": f"Error checking stock levels: {str(e)}"}

@router.get("/stats")
def get_alert_stats(db: Session = Depends(get_db)):
    """Get alert statistics for dashboard"""
    try:
        stats_query = """
            SELECT
                (SELECT COUNT(*) FROM stock_alerts WHERE is_resolved = FALSE) as total_active,
                (SELECT COUNT(*) FROM stock_alerts WHERE is_resolved = FALSE AND alert_type = 'out_of_stock') as out_of_stock,
                (SELECT COUNT(*) FROM stock_alerts WHERE is_resolved = FALSE AND alert_type = 'low_stock') as low_stock
        """
        
        stats = db.execute(sqlalchemy.text(stats_query)).mappings().first()
        
        return {
            "active_alerts": stats['total_active'] or 0,
            "out_of_stock": stats['out_of_stock'] or 0,
            "low_stock": stats['low_stock'] or 0
        }
    except Exception as e:
        print(f"Error in get_alert_stats: {e}")
        return {
            "active_alerts": 0,
            "out_of_stock": 0,
            "low_stock": 0
        }

@router.post("/create-test-alerts")
def create_test_alerts(db: Session = Depends(get_db)):
    """Create test alerts directly in the database"""
    try:
        # First, clear any existing alerts
        db.execute(sqlalchemy.text("DELETE FROM stock_alerts"))
        
        # Create test out-of-stock alerts for products 1 and 2
        db.execute(sqlalchemy.text("""
            INSERT INTO stock_alerts 
            (product_id, warehouse_id, current_quantity, threshold, alert_type, created_at, is_resolved)
            VALUES 
            (1, 1, 0, 5, 'out_of_stock', CURRENT_TIMESTAMP, FALSE),
            (2, 1, 0, 5, 'out_of_stock', CURRENT_TIMESTAMP, FALSE)
        """))
        
        # Count how many alerts we have now
        count = db.execute(sqlalchemy.text("SELECT COUNT(*) FROM stock_alerts WHERE is_resolved = FALSE")).scalar()
        
        db.commit()
        return {"message": f"Created test alerts. {count} alerts active."}
    except Exception as e:
        db.rollback()
        print(f"Error creating test alerts: {e}")
        return {"error": str(e)}

@router.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    """Test database connection and the stock_alerts table"""
    try:
        # Check if stock_alerts table exists
        table_query = """
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'stock_alerts'
        """
        table = db.execute(sqlalchemy.text(table_query)).scalar()
        
        # Check table structure
        if table:
            columns_query = """
                SELECT COLUMN_NAME 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'stock_alerts'
            """
            columns = [row[0] for row in db.execute(sqlalchemy.text(columns_query)).all()]
            
            # Try to count records
            count_query = "SELECT COUNT(*) FROM stock_alerts"
            count = db.execute(sqlalchemy.text(count_query)).scalar()
            
            # Check stock items with zero quantity
            zero_stock_query = """
                SELECT COUNT(*) FROM stock WHERE quantity = 0
            """
            zero_stock_count = db.execute(sqlalchemy.text(zero_stock_query)).scalar()
            
            return {
                "status": "success",
                "table_exists": bool(table),
                "columns": columns,
                "record_count": count,
                "zero_stock_count": zero_stock_count
            }
        else:
            return {
                "status": "error",
                "message": "stock_alerts table does not exist"
            }
    except Exception as e:
        print(f"Database connection error: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@router.get("/check-stock-table")
def check_stock_table(db: Session = Depends(get_db)):
    """Check the stock table for zero-quantity items"""
    try:
        # Get all stock items with zero quantity
        query = """
            SELECT s.*, p.name as product_name, w.name as warehouse_name
            FROM stock s
            JOIN products p ON s.product_id = p.product_id
            JOIN warehouses w ON s.warehouse_id = w.warehouse_id
            WHERE s.quantity = 0
        """
        zero_items = db.execute(sqlalchemy.text(query)).mappings().all()
        
        # Convert to list of dicts for JSON response
        result = []
        for item in zero_items:
            item_dict = dict(item)
            result.append(item_dict)
        
        return {
            "zero_stock_count": len(result),
            "items": result
        }
    except Exception as e:
        print(f"Error checking stock table: {e}")
        return {"error": str(e)}

@router.post("/mysql-fix")
def mysql_fix(db: Session = Depends(get_db)):
    """Create stock_alerts table with proper MySQL syntax"""
    try:
        # Check if table exists
        table_check = db.execute(sqlalchemy.text("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name = 'stock_alerts'
        """)).scalar()
        
        if table_check == 0:
            # Create table with MySQL syntax
            db.execute(sqlalchemy.text("""
                CREATE TABLE stock_alerts (
                    alert_id INT AUTO_INCREMENT PRIMARY KEY,
                    product_id INT NOT NULL,
                    warehouse_id INT NOT NULL,
                    current_quantity INT NOT NULL,
                    threshold INT NOT NULL,
                    alert_type VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_resolved BOOLEAN DEFAULT FALSE,
                    resolved_at TIMESTAMP NULL,
                    FOREIGN KEY (product_id) REFERENCES products(product_id),
                    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id)
                )
            """))
            table_created = True
        else:
            table_created = False
            
        # Create test alerts
        db.execute(sqlalchemy.text("DELETE FROM stock_alerts"))
        
        db.execute(sqlalchemy.text("""
            INSERT INTO stock_alerts 
            (product_id, warehouse_id, current_quantity, threshold, alert_type, created_at, is_resolved)
            VALUES 
            (1, 1, 0, 5, 'out_of_stock', CURRENT_TIMESTAMP, FALSE),
            (2, 1, 0, 5, 'out_of_stock', CURRENT_TIMESTAMP, FALSE)
        """))
        
        # Count alerts
        count = db.execute(sqlalchemy.text("SELECT COUNT(*) FROM stock_alerts")).scalar()
        
        db.commit()
        
        
        return {
            "success": True,
            "table_created": table_created,
            "alerts_created": count
        }
    except Exception as e:
        db.rollback()
        print(f"Error in mysql_fix: {e}")
        return {"success": False, "error": str(e)}