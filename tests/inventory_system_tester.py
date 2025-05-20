import requests
import json
import time
from datetime import datetime, date

class InventorySystemTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.auth_token = None
        self.test_data = {}
        self.results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {details}")
        
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with auth handling"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if self.auth_token:
            headers['Authorization'] = f"Bearer {self.auth_token}"
            
        if data:
            headers['Content-Type'] = 'application/json'
            data = json.dumps(data)
            
        try:
            response = requests.request(method, url, data=data, headers=headers, params=params)
            return response
        except Exception as e:
            return None
            
    def test_auth_flow(self):
        """Test authentication system"""
        print("\n🔐 Testing Authentication...")
        
        # Test registration
        user_data = {
            "username": f"testuser_{int(time.time())}",
            "password": "testpass123"
        }
        
        response = self.make_request("POST", "/auth/register", user_data)
        if response and response.status_code == 200:
            self.log_test("User Registration", True, "User created successfully")
            self.test_data['user'] = user_data
        else:
            self.log_test("User Registration", False, f"Failed: {response.text if response else 'No response'}")
            return False
            
        # Test login
        response = self.make_request("POST", "/auth/login", {
            "username": user_data['username'],
            "password": user_data['password']
        })
        
        if response and response.status_code == 200:
            token_data = response.json()
            self.auth_token = token_data['access_token']
            self.log_test("User Login", True, "Token received")
        else:
            self.log_test("User Login", False, f"Failed: {response.text if response else 'No response'}")
            return False
            
        # Test profile access
        response = self.make_request("GET", "/auth/me")
        if response and response.status_code == 200:
            self.log_test("Profile Access", True, "Profile retrieved with token")
        else:
            self.log_test("Profile Access", False, "Cannot access profile")
            
        return True
        
    def test_supplier_management(self):
        """Test supplier CRUD operations"""
        print("\n🏢 Testing Supplier Management...")
        
        # Create supplier
        supplier_data = {
            "name": "Test Supplier Co.",
            "contact_person": "John Doe",
            "email": "john@testsupplier.com",
            "phone": "+1234567890",
            "address": "123 Test Street"
        }
        
        response = self.make_request("POST", "/suppliers", supplier_data)
        if response and response.status_code == 200:
            supplier = response.json()
            self.test_data['supplier_id'] = supplier['supplier_id']
            self.log_test("Create Supplier", True, f"Created supplier ID: {supplier['supplier_id']}")
        else:
            self.log_test("Create Supplier", False, f"Failed: {response.text if response else 'No response'}")
            return False
            
        # Get all suppliers
        response = self.make_request("GET", "/suppliers")
        if response and response.status_code == 200:
            suppliers = response.json()
            self.log_test("List Suppliers", True, f"Retrieved {len(suppliers)} suppliers")
        else:
            self.log_test("List Suppliers", False, "Failed to retrieve suppliers")
            
        # Get specific supplier
        response = self.make_request("GET", f"/suppliers/{self.test_data['supplier_id']}")
        if response and response.status_code == 200:
            self.log_test("Get Supplier Details", True, "Supplier details retrieved")
        else:
            self.log_test("Get Supplier Details", False, "Failed to get supplier details")
            
        return True
        
    def test_product_management(self):
        """Test product CRUD operations"""
        print("\n📦 Testing Product Management...")
        
        # Create product
        product_data = {
            "name": "Test Product",
            "sku": f"TEST-{int(time.time())}",
            "description": "A test product for system testing",
            "category_id": 1,  # Assuming category exists
            "supplier_id": self.test_data.get('supplier_id', 1),
            "cost": 10.50,
            "price": 15.75,
            "reorder_level": 10
        }
        
        response = self.make_request("POST", "/products", product_data)
        if response and response.status_code == 200:
            product = response.json()
            self.test_data['product_id'] = product['product_id']
            self.log_test("Create Product", True, f"Created product ID: {product['product_id']}")
        else:
            self.log_test("Create Product", False, f"Failed: {response.text if response else 'No response'}")
            return False
            
        # Get all products
        response = self.make_request("GET", "/products")
        if response and response.status_code == 200:
            products = response.json()
            self.log_test("List Products", True, f"Retrieved {len(products)} products")
        else:
            self.log_test("List Products", False, "Failed to retrieve products")
            
        # Update product
        update_data = {"name": "Updated Test Product", "price": 20.00}
        response = self.make_request("PUT", f"/products/{self.test_data['product_id']}", {**product_data, **update_data})
        if response and response.status_code == 200:
            self.log_test("Update Product", True, "Product updated successfully")
        else:
            self.log_test("Update Product", False, "Failed to update product")
            
        return True
        
    def test_stock_management(self):
        """Test stock operations"""
        print("\n📊 Testing Stock Management...")
        
        # Add stock
        stock_data = {
            "product_id": self.test_data.get('product_id', 1),
            "warehouse_id": 1,  # Assuming warehouse exists
            "quantity": 100
        }
        
        response = self.make_request("POST", "/stock", stock_data)
        if response and response.status_code == 200:
            stock = response.json()
            self.test_data['stock_id'] = stock['stock_id']
            self.log_test("Add Stock", True, f"Added stock ID: {stock['stock_id']}")
        else:
            self.log_test("Add Stock", False, f"Failed: {response.text if response else 'No response'}")
            return False
            
        # Get all stock
        response = self.make_request("GET", "/stock")
        if response and response.status_code == 200:
            stocks = response.json()
            self.log_test("List Stock", True, f"Retrieved {len(stocks)} stock entries")
        else:
            self.log_test("List Stock", False, "Failed to retrieve stock")
            
        return True
        
    def test_transaction_flow(self):
        """Test transaction operations"""
        print("\n💰 Testing Transactions...")
        
        # Create inbound transaction
        txn_data = {
            "product_id": self.test_data.get('product_id', 1),
            "warehouse_id": 1,
            "transaction_type": "in",
            "quantity": 50,
            "note": "Test inbound transaction",
            "created_by": 1
        }
        
        response = self.make_request("POST", "/transactions", txn_data)
        if response and response.status_code == 200:
            self.log_test("Inbound Transaction", True, "Created inbound transaction")
        else:
            self.log_test("Inbound Transaction", False, f"Failed: {response.text if response else 'No response'}")
            
        # Create outbound transaction
        txn_data['transaction_type'] = "out"
        txn_data['quantity'] = 25
        txn_data['note'] = "Test outbound transaction"
        
        response = self.make_request("POST", "/transactions", txn_data)
        if response and response.status_code == 200:
            self.log_test("Outbound Transaction", True, "Created outbound transaction")
        else:
            self.log_test("Outbound Transaction", False, "Failed to create outbound transaction")
            
        # List transactions
        response = self.make_request("GET", "/transactions")
        if response and response.status_code == 200:
            transactions = response.json()
            self.log_test("List Transactions", True, f"Retrieved {len(transactions)} transactions")
        else:
            self.log_test("List Transactions", False, "Failed to retrieve transactions")
            
        return True
        
    def test_purchase_order_flow(self):
        """Test complete purchase order workflow"""
        print("\n🛒 Testing Purchase Orders...")
        
        # Create purchase order
        po_data = {
            "supplier_id": self.test_data.get('supplier_id', 1),
            "expected_delivery": (date.today()).isoformat(),
            "notes": "Test purchase order",
            "items": [
                {
                    "product_id": self.test_data.get('product_id', 1),
                    "quantity": 100,
                    "unit_cost": 10.00,
                    "warehouse_id": 1
                }
            ]
        }
        
        response = self.make_request("POST", "/purchase-orders", po_data)
        if response and response.status_code == 200:
            po = response.json()
            self.test_data['po_id'] = po['po_id']
            self.log_test("Create Purchase Order", True, f"Created PO ID: {po['po_id']}")
        else:
            self.log_test("Create Purchase Order", False, f"Failed: {response.text if response else 'No response'}")
            return False
            
        # List purchase orders
        response = self.make_request("GET", "/purchase-orders")
        if response and response.status_code == 200:
            pos = response.json()
            self.log_test("List Purchase Orders", True, f"Retrieved {len(pos)} POs")
        else:
            self.log_test("List Purchase Orders", False, "Failed to retrieve POs")
            
        # Update PO status
        response = self.make_request("PUT", f"/purchase-orders/{self.test_data['po_id']}/status?new_status=approved")
        if response and response.status_code == 200:
            self.log_test("Update PO Status", True, "PO status updated to approved")
        else:
            self.log_test("Update PO Status", False, "Failed to update PO status")
            
        return True
        
    def test_reports_system(self):
        """Test reporting functionality"""
        print("\n📈 Testing Reports...")
        
        # Test stock summary
        response = self.make_request("GET", "/reports/stock-summary")
        if response and response.status_code == 200:
            self.log_test("Stock Summary Report", True, "Report generated successfully")
        else:
            self.log_test("Stock Summary Report", False, "Failed to generate report")
            
        # Test inventory valuation
        response = self.make_request("GET", "/reports/valuation")
        if response and response.status_code == 200:
            self.log_test("Inventory Valuation Report", True, "Valuation report generated")
        else:
            self.log_test("Inventory Valuation Report", False, "Failed to generate valuation")
            
        # Test stock status
        response = self.make_request("GET", "/reports/stock-status")
        if response and response.status_code == 200:
            self.log_test("Stock Status Report", True, "Stock status report generated")
        else:
            self.log_test("Stock Status Report", False, "Failed to generate stock status")
            
        return True
        
    def test_alerts_system(self):
        """Test alerts functionality"""
        print("\n🚨 Testing Alerts...")
        
        # Get all alerts
        response = self.make_request("GET", "/alerts")
        if response and response.status_code == 200:
            alerts = response.json()
            self.log_test("Get Alerts", True, f"Retrieved {len(alerts)} alerts")
        else:
            self.log_test("Get Alerts", False, "Failed to retrieve alerts")
            
        return True
        
    def test_returns_system(self):
        """Test returns functionality"""
        print("\n↩️ Testing Returns...")
        
        # Create return from customer
        return_data = {
            "product_id": self.test_data.get('product_id', 1),
            "warehouse_id": 1,
            "quantity": 5,
            "return_type": "from_customer",
            "reason": "Testing return system",
            "notes": "Test return from customer"
        }
        
        response = self.make_request("POST", "/returns", return_data)
        if response and response.status_code == 200:
            self.log_test("Customer Return", True, "Return processed successfully")
        else:
            self.log_test("Customer Return", False, f"Failed: {response.text if response else 'No response'}")
            
        # List all returns
        response = self.make_request("GET", "/returns")
        if response and response.status_code == 200:
            returns = response.json()
            self.log_test("List Returns", True, f"Retrieved {len(returns)} returns")
        else:
            self.log_test("List Returns", False, "Failed to retrieve returns")
            
        return True
        
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Comprehensive System Testing...\n")
        
        # Run tests in logical order
        test_methods = [
            self.test_auth_flow,
            self.test_supplier_management,
            self.test_product_management,
            self.test_stock_management,
            self.test_transaction_flow,
            self.test_purchase_order_flow,
            self.test_reports_system,
            self.test_alerts_system,
            self.test_returns_system
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ Error in {test_method.__name__}: {str(e)}")
                
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "0%")
        
        if failed_tests > 0:
            print("\nFailed Tests:")
            for result in self.results:
                if not result['success']:
                    print(f"- {result['test']}: {result['details']}")

# Usage example
if __name__ == "__main__":
    # Run tests
    tester = InventorySystemTester("http://localhost:8000")
    tester.run_all_tests()
    
    # Save results to file
    with open('test_results.json', 'w') as f:
        json.dump(tester.results, f, indent=2)