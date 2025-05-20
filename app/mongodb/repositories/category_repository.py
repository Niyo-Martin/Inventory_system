from datetime import datetime
from typing import Dict, List, Optional, Any
from bson import ObjectId
from app.mongodb.database import db
from app.mongodb.models.category import (
    Category,
    CategoryAttribute,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CategoryTree
)

class CategoryRepository:
    collection = db.categories
    
    @classmethod
    async def create(cls, data: CreateCategoryRequest, user_id: int) -> str:
        """Create a new category"""
        # Check if code already exists
        existing = await cls.collection.find_one({"code": data.code})
        if existing:
            raise ValueError(f"Category with code '{data.code}' already exists")
        
        # Get parent to set level and path
        level = 0
        path = [data.code]
        
        if data.parent_id:
            parent = await cls.collection.find_one({"_id": ObjectId(data.parent_id)})
            if not parent:
                raise ValueError(f"Parent category with id '{data.parent_id}' not found")
            level = parent["level"] + 1
            path = parent["path"] + [data.code]
        
        # Create category object
        category = Category(
            name=data.name,
            code=data.code,
            description=data.description,
            parent_id=data.parent_id,
            level=level,
            path=path,
            icon=data.icon,
            display_order=data.display_order,
            visible=data.visible,
            attributes=data.attributes or [],
            min_stock_threshold=data.min_stock_threshold,
            default_reorder_level=data.default_reorder_level,
            storage_requirements=data.storage_requirements,
            created_by=user_id,
            updated_by=user_id
        )
        
        # Save to MongoDB
        category_dict = category.model_dump(by_alias=True, exclude={"id"})
        result = await cls.collection.insert_one(category_dict)
        return str(result.inserted_id)
    
    @classmethod
    async def update(cls, category_id: str, data: UpdateCategoryRequest, user_id: int) -> bool:
        """Update an existing category"""
        update_data = data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now()
        update_data["updated_by"] = user_id
        
        result = await cls.collection.update_one(
            {"_id": ObjectId(category_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    @classmethod
    async def delete(cls, category_id: str) -> bool:
        """Delete a category if it has no children"""
        # Check if category has children
        children = await cls.collection.find_one({"parent_id": category_id})
        if children:
            raise ValueError("Cannot delete a category with child categories")
        
        # Check if category has products (would need integration with your SQL DB)
        # This would be a check against your products table in MySQL
        
        result = await cls.collection.delete_one({"_id": ObjectId(category_id)})
        return result.deleted_count > 0
    
    @classmethod
    async def get_by_id(cls, category_id: str) -> Optional[Dict[str, Any]]:
        """Get a category by its ID"""
        result = await cls.collection.find_one({"_id": ObjectId(category_id)})
        if result:
            result["_id"] = str(result["_id"])
            if "parent_id" in result and result["parent_id"]:
                result["parent_id"] = str(result["parent_id"])
        return result
    
    @classmethod
    async def get_by_code(cls, code: str) -> Optional[Dict[str, Any]]:
        """Get a category by its code"""
        result = await cls.collection.find_one({"code": code})
        if result:
            result["_id"] = str(result["_id"])
            if "parent_id" in result and result["parent_id"]:
                result["parent_id"] = str(result["parent_id"])
        return result
    
    @classmethod
    async def get_all(cls) -> List[Dict[str, Any]]:
        """Get all categories"""
        cursor = cls.collection.find()
        categories = await cursor.to_list(length=100)
        
        # Convert ObjectIds to strings for JSON serialization
        for category in categories:
            category["_id"] = str(category["_id"])
            if "parent_id" in category and category["parent_id"]:
                category["parent_id"] = str(category["parent_id"])
        
        return categories
    
    @classmethod
    async def get_all_root_categories(cls) -> List[Dict[str, Any]]:
        """Get all root-level categories"""
        cursor = cls.collection.find({"level": 0}).sort("display_order", 1)
        categories = await cursor.to_list(length=100)
        
        # Convert ObjectIds to strings
        for category in categories:
            category["_id"] = str(category["_id"])
            if "parent_id" in category and category["parent_id"]:
                category["parent_id"] = str(category["parent_id"])
                
        return categories
    
    @classmethod
    async def get_children(cls, parent_id: str) -> List[Dict[str, Any]]:
        """Get all children of a category"""
        cursor = cls.collection.find({"parent_id": parent_id}).sort("display_order", 1)
        categories = await cursor.to_list(length=100)
        
        # Convert ObjectIds to strings
        for category in categories:
            category["_id"] = str(category["_id"])
            if "parent_id" in category and category["parent_id"]:
                category["parent_id"] = str(category["parent_id"])
                
        return categories
    
    @classmethod
    async def get_category_tree(cls) -> List[Dict[str, Any]]:
        """Get the complete category tree starting from roots"""
        # First get all categories
        all_categories = await cls.collection.find().to_list(length=1000)
        
        # Convert ObjectIds to strings
        for category in all_categories:
            category["_id"] = str(category["_id"])
            if "parent_id" in category and category["parent_id"]:
                category["parent_id"] = str(category["parent_id"])
        
        # Convert to a map for quick lookup
        category_map = {str(cat["_id"]): cat for cat in all_categories}
        
        # Root categories
        root_categories = [cat for cat in all_categories if cat["level"] == 0]
        
        # Build tree recursively
        async def build_tree(category):
            category_id = str(category["_id"])
            children = [cat for cat in all_categories if cat.get("parent_id") == category_id]
            
            tree_node = CategoryTree(
                id=category_id,
                name=category["name"],
                code=category["code"],
                description=category.get("description"),
                level=category["level"],
                icon=category.get("icon"),
                visible=category.get("visible", True),
                children=[]
            )
            
            for child in sorted(children, key=lambda c: c.get("display_order", 0)):
                child_tree = await build_tree(child)
                tree_node.children.append(child_tree)
                
            return tree_node
        
        # Build the tree for each root category
        tree = []
        for root in sorted(root_categories, key=lambda c: c.get("display_order", 0)):
            root_tree = await build_tree(root)
            tree.append(root_tree)
            
        return tree
    
    @classmethod
    async def get_category_path(cls, category_id: str) -> List[Dict[str, Any]]:
        """Get the full path from root to the specified category"""
        category = await cls.get_by_id(category_id)
        if not category:
            return []
            
        path = category.get("path", [])
        result = []
        
        for code in path:
            cat = await cls.get_by_code(code)
            if cat:
                result.append({
                    "id": str(cat["_id"]),
                    "name": cat["name"],
                    "code": cat["code"],
                    "level": cat["level"]
                })
                
        return result
    
    @classmethod
    async def add_attribute(cls, category_id: str, attribute: CategoryAttribute, user_id: int) -> bool:
        """Add a new attribute to a category"""
        # Check if attribute already exists
        category = await cls.get_by_id(category_id)
        if not category:
            raise ValueError(f"Category with id '{category_id}' not found")
            
        attributes = category.get("attributes", [])
        if any(attr["name"] == attribute.name for attr in attributes):
            raise ValueError(f"Attribute '{attribute.name}' already exists in this category")
            
        result = await cls.collection.update_one(
            {"_id": ObjectId(category_id)},
            {
                "$push": {"attributes": attribute.model_dump()},
                "$set": {
                    "updated_at": datetime.now(),
                    "updated_by": user_id
                }
            }
        )
        
        return result.modified_count > 0
    
    @classmethod
    async def update_attribute(cls, category_id: str, attribute_name: str, 
                              updated_attribute: CategoryAttribute, user_id: int) -> bool:
        """Update an existing attribute in a category"""
        # First find the attribute index
        category = await cls.get_by_id(category_id)
        if not category or "attributes" not in category:
            raise ValueError(f"Category with id '{category_id}' not found or has no attributes")
            
        attributes = category["attributes"]
        for i, attr in enumerate(attributes):
            if attr["name"] == attribute_name:
                # Found the attribute to update
                result = await cls.collection.update_one(
                    {"_id": ObjectId(category_id)},
                    {
                        "$set": {
                            f"attributes.{i}": updated_attribute.model_dump(),
                            "updated_at": datetime.now(),
                            "updated_by": user_id
                        }
                    }
                )
                return result.modified_count > 0
                
        raise ValueError(f"Attribute '{attribute_name}' not found in category")
    
    @classmethod
    async def remove_attribute(cls, category_id: str, attribute_name: str, user_id: int) -> bool:
        """Remove an attribute from a category"""
        result = await cls.collection.update_one(
            {"_id": ObjectId(category_id)},
            {
                "$pull": {"attributes": {"name": attribute_name}},
                "$set": {
                    "updated_at": datetime.now(),
                    "updated_by": user_id
                }
            }
        )
        
        return result.modified_count > 0
    
    @classmethod
    async def search_categories(cls, query: str) -> List[Dict[str, Any]]:
        """Search categories by name or description"""
        cursor = cls.collection.find({
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"code": {"$regex": query, "$options": "i"}}
            ]
        }).limit(20)
        
        categories = await cursor.to_list(length=20)
        
        # Convert ObjectIds to strings
        for category in categories:
            category["_id"] = str(category["_id"])
            if "parent_id" in category and category["parent_id"]:
                category["parent_id"] = str(category["parent_id"])
                
        return categories