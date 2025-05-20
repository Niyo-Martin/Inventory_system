from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your_jwt_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Fix for empty ACCESS_TOKEN_EXPIRE_MINUTES
token_expire_str = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
if token_expire_str and token_expire_str.strip():
    try:
        ACCESS_TOKEN_EXPIRE_MINUTES = int(token_expire_str)
    except ValueError:
        print(f"Warning: Invalid ACCESS_TOKEN_EXPIRE_MINUTES value: '{token_expire_str}', using default value of 30")
        ACCESS_TOKEN_EXPIRE_MINUTES = 30
else:
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None