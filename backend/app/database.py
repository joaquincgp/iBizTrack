from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

# Cargar variables del entorno
load_dotenv()

# URL y nombre de la base
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "ibiztrack"

# Cliente Mongo
client = AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]

# Colecciones
products_collection = database.get_collection("products")
orders_collection = database.get_collection("orders")

# Crear índices
async def init_db():
    try:
        await products_collection.create_index("asin")
        await orders_collection.create_index("order_number")
        print("Base de datos inicializada correctamente")
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")

def get_database():
    return database
