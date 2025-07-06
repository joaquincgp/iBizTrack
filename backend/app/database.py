from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "ibiztrack"

# Cliente asíncrono para FastAPI
client = AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]

# Colecciones
products_collection = database.get_collection("products")
orders_collection = database.get_collection("orders")

async def init_db():
    """Inicializar la base de datos y crear índices"""
    try:
        # Crear índices para optimizar consultas
        await products_collection.create_index("asin")
        await orders_collection.create_index("order_number")
        print("Base de datos inicializada correctamente")
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")

def get_database():
    """Obtener instancia de la base de datos"""
    return database