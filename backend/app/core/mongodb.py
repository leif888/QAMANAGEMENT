"""
MongoDB Connection Configuration
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from typing import Optional


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database = None


# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "qa_management")

# Global MongoDB instance
mongodb = MongoDB()


async def connect_to_mongo():
    """Create database connection"""
    mongodb.client = AsyncIOMotorClient(MONGODB_URL)
    mongodb.database = mongodb.client[DATABASE_NAME]
    print(f"Connected to MongoDB at {MONGODB_URL}")


async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()
        print("Disconnected from MongoDB")


def get_database():
    """Get database instance"""
    return mongodb.database


# Synchronous client for non-async operations
def get_sync_database():
    """Get synchronous database instance"""
    client = MongoClient(MONGODB_URL)
    return client[DATABASE_NAME]


# Collection names
TRADE_TEMPLATES_COLLECTION = "trade_templates"
TEST_CASE_FILES_COLLECTION = "test_case_files"
