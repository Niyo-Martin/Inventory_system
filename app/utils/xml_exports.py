import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any, Optional
from xml.dom import minidom

def generate_products_xml(products: List[Dict[str, Any]]) -> str:
    """
    Generate XML string from a list of product dictionaries
    """
    # Create root element
    root = ET.Element("products")
    root.set("generated_at", datetime.now().isoformat())
    root.set("count", str(len(products)))
    
    # Add products
    for product in products:
        product_elem = ET.SubElement(root, "product")
        product_elem.set("id", str(product["product_id"]))
        
        # Add basic product fields
        for field in ["name", "sku", "description", "reorder_level"]:
            if field in product and product[field] is not None:
                field_elem = ET.SubElement(product_elem, field)
                field_elem.text = str(product[field])
        
        # Add price/cost field
        if "price" in product and product["price"] is not None:
            price_elem = ET.SubElement(product_elem, "price")
            price_elem.text = str(product["price"])
        elif "unit_cost" in product and product["unit_cost"] is not None:
            price_elem = ET.SubElement(product_elem, "unit_cost")
            price_elem.text = str(product["unit_cost"])
        
        # Add category if available
        if "category_code" in product and product["category_code"]:
            cat_elem = ET.SubElement(product_elem, "category_code")
            cat_elem.text = product["category_code"]
    
    # Convert to string
    xml_string = ET.tostring(root, encoding='unicode')
    
    # Pretty print
    pretty_xml = minidom.parseString(xml_string).toprettyxml(indent="  ")
    
    return pretty_xml

async def generate_categories_xml(categories: List[Dict[str, Any]]) -> str:
    """
    Generate XML string from a list of category dictionaries
    """
    # Create root element
    root = ET.Element("categories")
    root.set("generated_at", datetime.now().isoformat())
    root.set("count", str(len(categories)))
    
    # Add categories
    for category in categories:
        category_elem = ET.SubElement(root, "category")
        category_elem.set("code", category["code"])
        
        # Add basic category fields
        name_elem = ET.SubElement(category_elem, "name")
        name_elem.text = category["name"]
        
        if "description" in category and category["description"]:
            desc_elem = ET.SubElement(category_elem, "description")
            desc_elem.text = category["description"]
        
        if "parent_id" in category and category["parent_id"]:
            parent_elem = ET.SubElement(category_elem, "parent_id")
            parent_elem.text = str(category["parent_id"])
        
        if "level" in category and category["level"] is not None:
            level_elem = ET.SubElement(category_elem, "level")
            level_elem.text = str(category["level"])
        
        if "path" in category and category["path"]:
            path_elem = ET.SubElement(category_elem, "path")
            path_elem.text = category["path"]
    
    # Convert to string
    xml_string = ET.tostring(root, encoding='unicode')
    
    # Pretty print
    pretty_xml = minidom.parseString(xml_string).toprettyxml(indent="  ")
    
    return pretty_xml

def generate_purchase_orders_xml(purchase_orders, db) -> str:
    """
    Generate XML string from purchase orders
    """
    from app.models.product import Product
    from app.models.supplier import Supplier
    from app.models.warehouse import Warehouse
    from app.models.purchase_order import PurchaseOrderItem
    
    # Create root XML element
    root = ET.Element("purchase_orders")
    root.set("generated_at", datetime.now().isoformat())
    root.set("count", str(len(purchase_orders)))
    
    for po in purchase_orders:
        po_elem = ET.SubElement(root, "purchase_order")
        po_elem.set("id", str(po.po_id))
        
        # Add basic PO fields
        supplier_id_elem = ET.SubElement(po_elem, "supplier_id")
        supplier_id_elem.text = str(po.supplier_id)
        
        # Get supplier name if available
        supplier = db.query(Supplier).filter(Supplier.supplier_id == po.supplier_id).first()
        if supplier:
            supplier_elem = ET.SubElement(po_elem, "supplier")
            supplier_elem.set("id", str(supplier.supplier_id))
            supplier_elem.text = supplier.name
        
        ordered_by_elem = ET.SubElement(po_elem, "ordered_by")
        ordered_by_elem.text = str(po.ordered_by)
        
        status_elem = ET.SubElement(po_elem, "status")
        status_elem.text = po.status
        
        if po.order_date:
            order_date_elem = ET.SubElement(po_elem, "order_date")
            order_date_elem.text = po.order_date.isoformat()
        
        if po.expected_delivery:
            expected_delivery_elem = ET.SubElement(po_elem, "expected_delivery")
            expected_delivery_elem.text = po.expected_delivery.isoformat()
        
        if po.notes:
            notes_elem = ET.SubElement(po_elem, "notes")
            notes_elem.text = po.notes
        
        # Add PO items
        items = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.po_id == po.po_id).all()
        
        if items:
            items_elem = ET.SubElement(po_elem, "items")
            items_elem.set("count", str(len(items)))
            
            for item in items:
                item_elem = ET.SubElement(items_elem, "item")
                item_elem.set("id", str(item.po_item_id))
                
                product_id_elem = ET.SubElement(item_elem, "product_id")
                product_id_elem.text = str(item.product_id)
                
                # Get product details
                product = db.query(Product).filter(Product.product_id == item.product_id).first()
                if product:
                    product_elem = ET.SubElement(item_elem, "product")
                    product_elem.set("id", str(product.product_id))
                    product_elem.set("sku", product.sku)
                    product_elem.text = product.name
                
                quantity_elem = ET.SubElement(item_elem, "quantity")
                quantity_elem.text = str(item.quantity)
                
                unit_cost_elem = ET.SubElement(item_elem, "unit_cost")
                unit_cost_elem.text = str(item.unit_cost)
                
                total_cost_elem = ET.SubElement(item_elem, "total_cost")
                total_cost_elem.text = str(float(item.unit_cost) * item.quantity)
                
                warehouse_id_elem = ET.SubElement(item_elem, "warehouse_id")
                warehouse_id_elem.text = str(item.warehouse_id)
                
                # Get warehouse name
                warehouse = db.query(Warehouse).filter(Warehouse.warehouse_id == item.warehouse_id).first()
                if warehouse:
                    warehouse_elem = ET.SubElement(item_elem, "warehouse")
                    warehouse_elem.set("id", str(warehouse.warehouse_id))
                    warehouse_elem.text = warehouse.name
    
    # Convert to string
    xml_string = ET.tostring(root, encoding='unicode')
    
    # Pretty print for better readability
    pretty_xml = minidom.parseString(xml_string).toprettyxml(indent="  ")
    
    return pretty_xml