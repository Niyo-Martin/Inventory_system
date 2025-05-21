# app/utils/xml_imports.py
from lxml import etree
from typing import Dict, List, Any
import json

def xml_to_dict(element):
    """Convert an XML element to a dictionary"""
    result = {}
    
    # Process attributes
    for key, value in element.attrib.items():
        result[key] = value
    
    # Process children
    for child in element:
        # Check if this is a list container (plural element name)
        if child.tag.endswith('s') and all(c.tag == child.tag[:-1] for c in child):
            # This is a list container
            list_items = []
            for subchild in child:
                list_items.append(xml_to_dict(subchild))
            result[child.tag] = list_items
        else:
            # Check if element has children or just text
            if len(child) > 0:
                child_dict = xml_to_dict(child)
                result[child.tag] = child_dict
            else:
                # Handle empty elements vs text elements
                if child.text is None:
                    result[child.tag] = ""
                else:
                    result[child.tag] = child.text.strip()
    
    # Handle element text (if no children and has text)
    if len(element) == 0 and element.text is not None and element.text.strip():
        return element.text.strip()
    
    return result

def parse_products_xml(xml_content: str) -> List[Dict[str, Any]]:
    """Parse products from XML content"""
    try:
        root = etree.fromstring(xml_content.encode('utf-8'))
        
        products = []
        for product_elem in root.xpath("//product"):
            product_dict = xml_to_dict(product_elem)
            
            # Convert string numbers to proper types
            if "price" in product_dict:
                try:
                    product_dict["price"] = float(product_dict["price"])
                except (ValueError, TypeError):
                    pass
                    
            if "reorder_level" in product_dict:
                try:
                    product_dict["reorder_level"] = int(product_dict["reorder_level"])
                except (ValueError, TypeError):
                    pass
            
            products.append(product_dict)
            
        return products
    except etree.XMLSyntaxError as e:
        raise ValueError(f"Invalid XML format: {str(e)}")