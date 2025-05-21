import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional

def validate_products_xml(xml_content: str) -> bool:
    """
    Basic validation for products XML
    Returns True if valid, raises ValueError if not
    """
    try:
        # Parse XML
        root = ET.fromstring(xml_content)
        
        # Check root element name
        if root.tag != "products":
            raise ValueError("Root element must be 'products'")
        
        # Check if there are product elements
        products = root.findall("product")
        if not products:
            raise ValueError("No product elements found")
        
        # Validate each product has required elements
        for product in products:
            name = product.find("name")
            sku = product.find("sku")
            
            if name is None or not name.text:
                raise ValueError("Product missing 'name' element")
            
            if sku is None or not sku.text:
                raise ValueError("Product missing 'sku' element")
        
        return True
    except ET.ParseError as e:
        raise ValueError(f"Invalid XML format: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error validating XML: {str(e)}")

def validate_purchase_orders_xml(xml_content: str) -> bool:
    """
    Basic validation for purchase orders XML
    Returns True if valid, raises ValueError if not
    """
    try:
        # Parse XML
        root = ET.fromstring(xml_content)
        
        # Check root element name
        if root.tag != "purchase_orders":
            raise ValueError("Root element must be 'purchase_orders'")
        
        # Check if there are purchase_order elements
        orders = root.findall("purchase_order")
        if not orders:
            raise ValueError("No purchase_order elements found")
        
        # Validate each purchase order has required elements
        for po in orders:
            # Check supplier_id element
            supplier_id = po.find("supplier_id")
            if supplier_id is None or not supplier_id.text:
                raise ValueError("Purchase order missing 'supplier_id' element")
            
            # Check items element
            items = po.find("items")
            if items is None:
                raise ValueError("Purchase order missing 'items' element")
            
            # Check item elements
            item_elements = items.findall("item")
            if not item_elements:
                raise ValueError("No item elements found in purchase order")
            
            # Validate each item has required elements
            for item in item_elements:
                product_id = item.find("product_id")
                quantity = item.find("quantity")
                warehouse_id = item.find("warehouse_id")
                
                if product_id is None or not product_id.text:
                    raise ValueError("Item missing 'product_id' element")
                
                if quantity is None or not quantity.text:
                    raise ValueError("Item missing 'quantity' element")
                
                if warehouse_id is None or not warehouse_id.text:
                    raise ValueError("Item missing 'warehouse_id' element")
        
        return True
    except ET.ParseError as e:
        raise ValueError(f"Invalid XML format: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error validating XML: {str(e)}")