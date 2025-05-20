# app/mongodb/database.py
from typing import Annotated, Any, ClassVar, Optional, TypeVar, Generic, Type
from pydantic import BaseModel, ConfigDict, BeforeValidator, Field
from bson import ObjectId
import motor.motor_asyncio
from pymongo.collection import Collection
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get MongoDB connection string from environment variables
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/inventory_system")
DB_NAME = MONGO_URI.split("/")[-1].split("?")[0]  # Extract DB name from URI

try:
    # Initialize the MongoDB client
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    print(f"MongoDB connection initialized to database: {DB_NAME}")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    db = None

# Define a proper ObjectId field validator for Pydantic v2
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

# Define the PyObjectId type using Pydantic v2 annotations
PyObjectId = Annotated[ObjectId, BeforeValidator(validate_object_id)]

# Base MongoDB model for Pydantic v2
class MongoBaseModel(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        populate_by_name=True,
        from_attributes=True,  # Replaces orm_mode=True
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

# Helper function to get database connection
async def get_database():
    return db

# Generic repository for MongoDB collections
T = TypeVar('T', bound=MongoBaseModel)

class MongoRepository(Generic[T]):
    collection_name: ClassVar[str]
    model_class: ClassVar[Type[T]]
    
    @classmethod
    def get_collection(cls) -> Collection:
        return db[cls.collection_name]
    
    @classmethod
    async def find_one(cls, filter_dict: dict) -> Optional[T]:
        collection = cls.get_collection()
        result = await collection.find_one(filter_dict)
        if result:
            return cls.model_class.model_validate(result)
        return None
    
    @classmethod
    async def find_many(cls, filter_dict: dict = None) -> list[T]:
        filter_dict = filter_dict or {}
        collection = cls.get_collection()
        cursor = collection.find(filter_dict)
        results = await cursor.to_list(length=100)
        return [cls.model_class.model_validate(doc) for doc in results]
    
    @classmethod
    async def create(cls, data: dict) -> T:
        collection = cls.get_collection()
        result = await collection.insert_one(data)
        created_doc = await collection.find_one({"_id": result.inserted_id})
        return cls.model_class.model_validate(created_doc)
    
    @classmethod
    async def update(cls, id: str, data: dict) -> Optional[T]:
        collection = cls.get_collection()
        result = await collection.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$set": data},
            return_document=True
        )
        if result:
            return cls.model_class.model_validate(result)
        return None
    
    @classmethod
    async def delete(cls, id: str) -> bool:
        collection = cls.get_collection()
        result = await collection.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0