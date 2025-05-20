from fastapi import Depends, HTTPException
from app.utils.dependencies import get_current_user

def require_admin(user = Depends(get_current_user)):
    if user.role_id != 1:
        raise HTTPException(status_code=403, detail="Admins only")
    return user

def require_staff(user = Depends(get_current_user)):
    if user.role_id not in [1, 2]:
        raise HTTPException(status_code=403, detail="Admin or staff only")
    return user
