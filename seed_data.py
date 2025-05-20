from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.stock import Stock
from app.models.transaction import Transaction
from app.models.purchase_order import PurchaseOrder
from app.models.user import User
from app.utils.hashing import hash_password

from datetime import datetime

db: Session = SessionLocal()

try:
    # Helper function
    def get_or_create(model, db_session, search_by: dict, defaults: dict):
        instance = db_session.query(model).filter_by(**search_by).first()
        if instance:
            return instance
        else:
            params = {**search_by, **defaults}
            instance = model(**params)
            db_session.add(instance)
            db_session.commit()
            db_session.refresh(instance)
            return instance

    # Insert categories
    categories = [
        {"name": "Electronics", "description": "Electronic devices"},
        {"name": "Clothing", "description": "Apparel and garments"},
        {"name": "Furniture", "description": "Home and office furniture"},
        {"name": "Books", "description": "Educational and leisure books"},
        {"name": "Sports", "description": "Sports equipment and accessories"},
    ]
    for cat in categories:
        get_or_create(Category, db, {"name": cat["name"]}, {"description": cat["description"]})

    # Insert suppliers
    suppliers = [
        {"name": "ABC Supplies", "contact_info": "abc@example.com"},
        {"name": "Global Traders", "contact_info": "global@example.com"},
        {"name": "FastTech", "contact_info": "fasttech@example.com"},
        {"name": "FashionHub", "contact_info": "fashion@example.com"},
        {"name": "SportsWorld", "contact_info": "sports@example.com"},
    ]
    for supp in suppliers:
        get_or_create(Supplier, db, {"name": supp["name"]}, {"contact_info": supp["contact_info"]})

    # Insert warehouses
    warehouses = [
        {"name": "Main Warehouse", "location": "City Center"},
        {"name": "Backup Storage", "location": "North Zone"},
        {"name": "Outlet Storage", "location": "South Zone"},
        {"name": "Distribution Hub", "location": "East Zone"},
        {"name": "West Storage", "location": "West Zone"},
    ]
    for ware in warehouses:
        get_or_create(Warehouse, db, {"name": ware["name"]}, {"location": ware["location"]})

    # Insert products
    products = [
        {"name": "Laptop", "description": "Gaming laptop", "price": 1200, "category_id": 1, "supplier_id": 3},
        {"name": "T-shirt", "description": "Cotton T-shirt", "price": 20, "category_id": 2, "supplier_id": 4},
        {"name": "Desk", "description": "Wooden desk", "price": 150, "category_id": 3, "supplier_id": 2},
        {"name": "Novel", "description": "Fiction novel", "price": 15, "category_id": 4, "supplier_id": 2},
        {"name": "Basketball", "description": "Official size", "price": 30, "category_id": 5, "supplier_id": 5},
    ]
    for prod in products:
        get_or_create(Product, db, {"name": prod["name"]}, {
            "description": prod["description"],
            "price": prod["price"],
            "category_id": prod["category_id"],
            "supplier_id": prod["supplier_id"],
        })

    # Insert stock entries
    stocks = [
        {"product_id": 1, "warehouse_id": 1, "quantity": 50},
        {"product_id": 2, "warehouse_id": 2, "quantity": 100},
        {"product_id": 3, "warehouse_id": 3, "quantity": 30},
        {"product_id": 4, "warehouse_id": 4, "quantity": 75},
        {"product_id": 5, "warehouse_id": 5, "quantity": 20},
    ]
    for stock in stocks:
        get_or_create(Stock, db, {
            "product_id": stock["product_id"],
            "warehouse_id": stock["warehouse_id"]
        }, {
            "quantity": stock["quantity"]
        })

    # Insert transactions
    transactions = [
        {"product_id": 1, "warehouse_id": 1, "transaction_type": "in", "quantity": 10, "timestamp": datetime.utcnow(), "note": "Restock"},
        {"product_id": 2, "warehouse_id": 2, "transaction_type": "out", "quantity": 5, "timestamp": datetime.utcnow(), "note": "Sold"},
        {"product_id": 3, "warehouse_id": 3, "transaction_type": "in", "quantity": 15, "timestamp": datetime.utcnow(), "note": "New stock arrival"},
        {"product_id": 4, "warehouse_id": 4, "transaction_type": "out", "quantity": 3, "timestamp": datetime.utcnow(), "note": "Damaged goods"},
        {"product_id": 5, "warehouse_id": 5, "transaction_type": "in", "quantity": 8, "timestamp": datetime.utcnow(), "note": "Supplier delivery"},
    ]
    for txn in transactions:
        db.add(Transaction(**txn))
    db.commit()

    # Insert purchase orders
    purchase_orders = [
        {"product_id": 1, "quantity": 20, "supplier_id": 3, "status": "pending", "created_at": datetime.utcnow()},
        {"product_id": 2, "quantity": 50, "supplier_id": 4, "status": "completed", "created_at": datetime.utcnow()},
        {"product_id": 3, "quantity": 15, "supplier_id": 2, "status": "pending", "created_at": datetime.utcnow()},
        {"product_id": 4, "quantity": 10, "supplier_id": 2, "status": "completed", "created_at": datetime.utcnow()},
        {"product_id": 5, "quantity": 25, "supplier_id": 5, "status": "pending", "created_at": datetime.utcnow()},
    ]
    for po in purchase_orders:
        db.add(PurchaseOrder(**po))
    db.commit()

    # Insert admin user
    admin = db.query(User).filter_by(username="admin").first()
    if not admin:
        new_admin = User(username="admin", password_hash=hash_password("admin123"))
        db.add(new_admin)
        db.commit()

    print("✅ Database seeded successfully!")

except Exception as e:
    print(f"❌ Error while seeding: {e}")
    db.rollback()
finally:
    db.close()
    print("✅ Database connection closed.")
