import xml.etree.ElementTree as ET
from typing import List, Dict, Any
from datetime import datetime

def parse_products_xml(xml_content: str) -> List[Dict[str, Any]]:
    """
    Parse products XML and return a list of product dictionaries
    """
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError:
        raise ValueError("Invalid XML format")
    
    products = []
    
    for product_elem in root.findall(".//product"):
        product_data = {}
        
        # Extract product attributes
        product_id = product_elem.get("id")
        if product_id:
            product_data["product_id"] = int(product_id)
        
        # Extract child elements
        for field in ["name", "sku", "description", "category_code"]:
            field_elem = product_elem.find(field)
            if field_elem is not None and field_elem.text:
                product_data[field] = field_elem.text
        
        # Extract numeric fields
        for field in ["price", "unit_cost"]:
            field_elem = product_elem.find(field)
            if field_elem is not None and field_elem.text:
                try:
                    product_data[field] = float(field_elem.text)
                except ValueError:
                    pass  # Skip invalid numeric values
        
        for field in ["reorder_level", "min_stock_threshold"]:
            field_elem = product_elem.find(field)
            if field_elem is not None and field_elem.text:
                try:
                    product_data[field] = int(field_elem.text)
                except ValueError:
                    pass  # Skip invalid numeric values
        
        # Only add products with required fields
        if "name" in product_data and "sku" in product_data:
            products.append(product_data)
    
    return products

def parse_purchase_orders_xml(xml_content: str) -> List[Dict[str, Any]]:
    """
    Parse purchase orders XML and return a list of purchase order dictionaries
    """
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError:
        raise ValueError("Invalid XML format")
    
    purchase_orders = []
    
    for po_elem in root.findall(".//purchase_order"):
        po_data = {}
        
        # Extract basic PO fields
        supplier_id_elem = po_elem.find("supplier_id")
        if supplier_id_elem is not None and supplier_id_elem.text:
            po_data["supplier_id"] = int(supplier_id_elem.text)
        else:
            continue  # Skip POs without supplier ID
        
        ordered_by_elem = po_elem.find("ordered_by")
        if ordered_by_elem is not None and ordered_by_elem.text:
            po_data["ordered_by"] = int(ordered_by_elem.text)
        
        status_elem = po_elem.find("status")
        if status_elem is not None and status_elem.text:
            po_data["status"] = status_elem.text
        else:
            po_data["status"] = "pending"  # Default status
        
        order_date_elem = po_elem.find("order_date")
        if order_date_elem is not None and order_date_elem.text:
            try:
                po_data["order_date"] = datetime.fromisoformat(order_date_elem.text).date()
            except ValueError:
                po_data["order_date"] = datetime.now().date()
        else:
            po_data["order_date"] = datetime.now().date()
        
        expected_delivery_elem = po_elem.find("expected_delivery")
        if expected_delivery_elem is not None and expected_delivery_elem.text:
            try:
                po_data["expected_delivery"] = datetime.fromisoformat(expected_delivery_elem.text).date()
            except ValueError:
                pass
        
        notes_elem = po_elem.find("notes")
        if notes_elem is not None and notes_elem.text:
            po_data["notes"] = notes_elem.text
        
        # Extract PO items
        items_elem = po_elem.find("items")
        if items_elem is not None:
            items = []
            
            for item_elem in items_elem.findall("item"):
                item_data = {}
                
                product_id_elem = item_elem.find("product_id")
                if product_id_elem is not None and product_id_elem.text:
                    item_data["product_id"] = int(product_id_elem.text)
                else:
                    continue  # Skip items without product ID
                
                quantity_elem = item_elem.find("quantity")
                if quantity_elem is not None and quantity_elem.text:
                    try:
                        item_data["quantity"] = int(quantity_elem.text)
                    except ValueError:
                        item_data["quantity"] = 1
                else:
                    item_data["quantity"] = 1  # Default quantity
                
                unit_cost_elem = item_elem.find("unit_cost")
                if unit_cost_elem is not None and unit_cost_elem.text:
                    try:
                        item_data["unit_cost"] = float(unit_cost_elem.text)
                    except ValueError:
                        item_data["unit_cost"] = 0.0
                else:
                    item_data["unit_cost"] = 0.0  # Default unit cost
                
                warehouse_id_elem = item_elem.find("warehouse_id")
                if warehouse_id_elem is not None and warehouse_id_elem.text:
                    item_data["warehouse_id"] = int(warehouse_id_elem.text)
                else:
                    continue  # Skip items without warehouse ID
                
                items.append(item_data)
            
            po_data["items"] = items
        
        # Only add POs with items
        if "items" in po_data and po_data["items"]:
            purchase_orders.append(po_data)
    
    return purchase_orders