from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, product, stock, transaction, purchase_order, report
from app.routers import return_, supplier
from app.routers import alert
from fastapi.responses import JSONResponse
from bson import ObjectId
import sqlalchemy
import contextlib
from app.routers import xml_export


app = FastAPI()

# Create tables before the app starts
@app.on_event("startup")
def create_tables():
    # Create tables that don't exist yet
    Base.metadata.create_all(bind=engine)
    
    # For debugging, print the tables that were created
    inspector = sqlalchemy.inspect(engine)
    tables = inspector.get_table_names()
    print(f"Database tables: {tables}")
    
    # Explicitly check and create stock_alerts if needed
    with contextlib.closing(engine.connect()) as conn:
        # Use MySQL syntax (AUTO_INCREMENT instead of AUTOINCREMENT)
        conn.execute(sqlalchemy.text("""
            CREATE TABLE IF NOT EXISTS stock_alerts (
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
        conn.commit()
        
        # Check if stock_alerts exists in the table list
        has_table = "stock_alerts" in inspector.get_table_names()
        
        if has_table:
            print("stock_alerts table exists")
        else:
            print("WARNING: Failed to create stock_alerts table")

# Add this custom JSON response class for handling MongoDB ObjectId
class CustomJSONResponse(JSONResponse):
    def render(self, content):
        def convert_objectid(obj):
            if isinstance(obj, ObjectId):
                return str(obj)
            elif isinstance(obj, dict):
                return {key: convert_objectid(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_objectid(item) for item in obj]
            return obj
            
        return super().render(convert_objectid(content))

# Use the custom response class as default
app.default_response_class = CustomJSONResponse

origins = [
    "http://localhost:5173",   # ✅ React dev server
    "http://127.0.0.1:5173"    # ✅ Some systems use 127.0.0.1 instead of localhost
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # 👈 Must match frontend exactly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Inventory API is running!"}

# ✅ Include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(product.router, prefix="/products", tags=["Products"])
app.include_router(stock.router, prefix="/stock", tags=["Stock"])
app.include_router(transaction.router, prefix="/transactions", tags=["Transactions"])
app.include_router(purchase_order.router, prefix="/purchase-orders", tags=["Purchase Orders"])
app.include_router(report.router, prefix="/reports", tags=["Reports"])
app.include_router(return_.router, prefix="/returns", tags=["Returns"])
app.include_router(supplier.router)  # Router already has prefix="/suppliers"
app.include_router(alert.router, prefix="/alerts", tags=["Alerts"])
app.include_router(xml_export.router)

# Conditionally load MongoDB-related components
try:
    # Import MongoDB components
    from app.mongodb.database import db
    
    # Only register MongoDB-related routes if connection is successful
    if db is not None:
        try:
            # Import the categories router
            from app.routers import categories
            app.include_router(categories.router)
            print("Category routes registered successfully")
            
            # Set up indexes if DB connection is available
            @app.on_event("startup")
            async def startup_db_client():
                try:
                    # Create indexes for better query performance
                    await db.categories.create_index("code", unique=True)
                    await db.categories.create_index("parent_id")
                    await db.categories.create_index("level")
                    await db.categories.create_index("path")
                    print("MongoDB indexes created successfully")
                except Exception as e:
                    print(f"Error creating MongoDB indexes: {e}")
                    # App will continue without indexes
        except ImportError as e:
            print(f"Could not import categories router: {e}")
    else:
        print("MongoDB connection not available, skipping category routes")
except ImportError:
    print("MongoDB support not configured, running with SQL database only")