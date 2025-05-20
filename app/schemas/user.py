# app/schemas/user.py
from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str
    

class UserOut(BaseModel):
    user_id: int
    username: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserLogin(BaseModel):
    username: str
    password: str
