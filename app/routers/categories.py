from fastapi import APIRouter, HTTPException, Depends, Query, Body, Path
from typing import List, Optional
from app.mongodb.models.category import (
    Category,
    CategoryAttribute,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CategoryTree
)
from app.mongodb.repositories.category_repository import CategoryRepository
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/categories",
    tags=["Product Categories"]
)

# Create a new category
# Get all categories
@router.get("/")
async def get_all_categories(
    current_user: User = Depends(get_current_user)
):
    categories = await CategoryRepository.get_all()
    return categories


#####
@router.post("/", response_model=dict)
async def create_category(
    data: CreateCategoryRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        category_id = await CategoryRepository.create(data, current_user.user_id)
        return {
            "message": "Category created successfully",
            "category_id": category_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Update a category
@router.put("/{category_id}", response_model=dict)
async def update_category(
    category_id: str = Path(..., description="The ID of the category to update"),
    data: UpdateCategoryRequest = Body(...),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check if category exists
        category = await CategoryRepository.get_by_id(category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        success = await CategoryRepository.update(category_id, data, current_user.user_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update category")
        
        return {"message": "Category updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Delete a category
@router.delete("/{category_id}", response_model=dict)
async def delete_category(
    category_id: str = Path(..., description="The ID of the category to delete"),
    current_user: User = Depends(get_current_user)
):
    try:
        # Check if category exists
        category = await CategoryRepository.get_by_id(category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        success = await CategoryRepository.delete(category_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete category")
        
        return {"message": "Category deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Get a category by ID
@router.get("/{category_id}")
async def get_category(
    category_id: str = Path(..., description="The ID of the category"),
    current_user: User = Depends(get_current_user)
):
    category = await CategoryRepository.get_by_id(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category

# Get all root categories
@router.get("/roots")
async def get_root_categories(
    current_user: User = Depends(get_current_user)
):
    categories = await CategoryRepository.get_all_root_categories()
    return categories

# Get children of a category
@router.get("/{category_id}/children")
async def get_category_children(
    category_id: str = Path(..., description="The ID of the parent category"),
    current_user: User = Depends(get_current_user)
):
    # Verify parent exists
    parent = await CategoryRepository.get_by_id(category_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent category not found")
    
    children = await CategoryRepository.get_children(category_id)
    return children

# Get full category tree
@router.get("/tree")
async def get_category_tree(
    current_user: User = Depends(get_current_user)
):
    tree = await CategoryRepository.get_category_tree()
    return tree

# Get category path (breadcrumbs)
@router.get("/{category_id}/path")
async def get_category_path(
    category_id: str = Path(..., description="The ID of the category"),
    current_user: User = Depends(get_current_user)
):
    path = await CategoryRepository.get_category_path(category_id)
    if not path:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return path

# Add an attribute to a category
@router.post("/{category_id}/attributes", response_model=dict)
async def add_category_attribute(
    category_id: str = Path(..., description="The ID of the category"),
    attribute: CategoryAttribute = Body(...),
    current_user: User = Depends(get_current_user)
):
    try:
        success = await CategoryRepository.add_attribute(category_id, attribute, current_user.user_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to add attribute")
        
        return {"message": "Attribute added successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Update a category attribute
@router.put("/{category_id}/attributes/{attribute_name}", response_model=dict)
async def update_category_attribute(
    category_id: str = Path(..., description="The ID of the category"),
    attribute_name: str = Path(..., description="The name of the attribute to update"),
    attribute: CategoryAttribute = Body(...),
    current_user: User = Depends(get_current_user)
):
    try:
        success = await CategoryRepository.update_attribute(
            category_id, attribute_name, attribute, current_user.user_id
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update attribute")
        
        return {"message": "Attribute updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Remove a category attribute
@router.delete("/{category_id}/attributes/{attribute_name}", response_model=dict)
async def remove_category_attribute(
    category_id: str = Path(..., description="The ID of the category"),
    attribute_name: str = Path(..., description="The name of the attribute to remove"),
    current_user: User = Depends(get_current_user)
):
    try:
        success = await CategoryRepository.remove_attribute(
            category_id, attribute_name, current_user.user_id
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to remove attribute")
        
        return {"message": "Attribute removed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Search categories
@router.get("/search")
async def search_categories(
    q: str = Query(..., min_length=2, description="Search query"),
    current_user: User = Depends(get_current_user)
):
    results = await CategoryRepository.search_categories(q)
    return results