import random
from typing import List, Dict, Any
#from backend.app.models.product import Product
from app.models.product import Product


class AmazonService:
    """Servicio mock para simular la API de Amazon"""

    @staticmethod
    def _generate_mock_products() -> List[Dict[str, Any]]:
        """Generar productos mock para pruebas"""
        products = [
            {
                "asin": "B08N5WRWNW",
                "title": "Echo Dot (4th Gen) - Smart speaker with Alexa",
                "price": 49.99,
                "weight": 0.34,
                "dimensions": {"length": 10, "width": 10, "height": 9},
                "image_url": "https://m.media-amazon.com/images/I/71JB6hM6Z6L._AC_SX679_.jpg",
                "category": "Electronics",
                "description": "Smart speaker with Alexa voice control",
                "availability": True
            },
            {
                "asin": "B08C1W5N87",
                "title": "Fire TV Stick 4K with Alexa Voice Remote",
                "price": 39.99,
                "weight": 0.3,
                "dimensions": {"length": 14, "width": 2, "height": 1},
                "image_url": "https://images-na.ssl-images-amazon.com/images/I/51TjJOTfslL._AC_SL1000_.jpg",
                "category": "Electronics",
                "description": "Streaming device with 4K Ultra HD and Alexa",
                "availability": True
            },
            {
                "asin": "B07FZ8S74R",
                "title": "Kindle Paperwhite (8 GB) – Now with a 6.8\" display",
                "price": 139.99,
                "weight": 0.205,
                "dimensions": {"length": 17.4, "width": 12.5, "height": 0.81},
                "image_url": "https://images-na.ssl-images-amazon.com/images/I/71YAqiMWOWL._AC_SL1500_.jpg",
                "category": "Electronics",
                "description": "E-reader with adjustable warm light",
                "availability": True
            },
            {
                "asin": "B0B7BP6CJN",
                "title": "Apple AirPods Pro (2nd Generation)",
                "price": 249.99,
                "weight": 0.061,
                "dimensions": {"length": 4.5, "width": 4.5, "height": 2.1},
                "image_url": "https://images-na.ssl-images-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg",
                "category": "Electronics",
                "description": "Wireless earbuds with Active Noise Cancelling",
                "availability": True
            },
            {
                "asin": "B08GYKNCCP",
                "title": "Nike Air Max 90 Sneakers",
                "price": 89.99,
                "weight": 0.8,
                "dimensions": {"length": 30, "width": 12, "height": 8},
                "image_url": "https://m.media-amazon.com/images/I/41jeqX2rAhL._AC_SY695_.jpg",
                "category": "Footwear",
                "description": "Classic athletic sneakers",
                "availability": True
            },
            {
                "asin": "B089DGWXPH",
                "title": "Levi's 501 Original Fit Jeans",
                "price": 59.99,
                "weight": 0.6,
                "dimensions": {"length": 35, "width": 25, "height": 3},
                "image_url": "https://m.media-amazon.com/images/I/71njFOSKoyL._AC_SX679_.jpg",
                "category": "Clothing",
                "description": "Classic straight-leg jeans",
                "availability": True
            },
            {
                "asin": "B08KHF4LN2",
                "title": "Sony WH-1000XM4 Wireless Headphones",
                "price": 349.99,
                "weight": 0.254,
                "dimensions": {"length": 20, "width": 18, "height": 8},
                "image_url": "https://images-na.ssl-images-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg",
                "category": "Electronics",
                "description": "Noise cancelling wireless headphones",
                "availability": True
            },
            {
                "asin": "B07VGRJDFY",
                "title": "Champion Powerblend Fleece Hoodie",
                "price": 34.99,
                "weight": 0.5,
                "dimensions": {"length": 30, "width": 25, "height": 5},
                "image_url": "https://m.media-amazon.com/images/I/81H45R8GmcL._AC_SX679_.jpg",
                "category": "Clothing",
                "description": "Comfortable fleece hoodie",
                "availability": True
            },
            {
                "asin": "B07ZPKN6YR",
                "title": "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
                "price": 79.99,
                "weight": 5.3,
                "dimensions": {"length": 33, "width": 31, "height": 32},
                "image_url": "https://m.media-amazon.com/images/I/71thcs5a-WL._AC_SX679_.jpg",
                "category": "Kitchen",
                "description": "Multi-use electric pressure cooker",
                "availability": True
            },
            {
                "asin": "B083DRCQXG",
                "title": "Adidas Ultraboost 22 Running Shoes",
                "price": 179.99,
                "weight": 0.9,
                "dimensions": {"length": 31, "width": 13, "height": 9},
                "image_url": "https://m.media-amazon.com/images/I/518e9jsDGVL._AC_SY695_.jpg",
                "category": "Footwear",
                "description": "High-performance running shoes",
                "availability": True
            }
        ]
        return products

    @staticmethod
    async def search_products(query: str, category: str = None, limit: int = 10) -> List[Product]:
        """Buscar productos en Amazon (simulado)"""
        mock_products = AmazonService._generate_mock_products()

        # Filtrar por query
        if query:
            filtered_products = [
                p for p in mock_products
                if query.lower() in p["title"].lower() or
                   query.lower() in p["category"].lower() or
                   query.lower() in p["description"].lower()
            ]
        else:
            filtered_products = mock_products

        # Filtrar por categoría
        if category:
            filtered_products = [
                p for p in filtered_products
                if category.lower() in p["category"].lower()
            ]

        # Limitar resultados
        filtered_products = filtered_products[:limit]

        # Convertir a objetos Product
        products = []
        for product_data in filtered_products:
            product = Product(**product_data)
            products.append(product)

        return products

    @staticmethod
    async def get_product_by_asin(asin: str) -> Product:
        """Obtener producto por ASIN (simulado)"""
        mock_products = AmazonService._generate_mock_products()

        for product_data in mock_products:
            if product_data["asin"] == asin:
                return Product(**product_data)

        # Si no se encuentra, generar uno aleatorio
        return Product(
            asin=asin,
            title=f"Producto Mock {asin}",
            price=round(random.uniform(10, 500), 2),
            weight=round(random.uniform(0.1, 10), 2),
            dimensions={"length": 10, "width": 10, "height": 10},
            image_url="https://via.placeholder.com/300x300",
            category="Mock Category",
            description="Producto generado para pruebas",
            availability=True
        )

    @staticmethod
    async def get_trending_products(limit: int = 5) -> List[Product]:
        """Obtener productos en tendencia (simulado)"""
        mock_products = AmazonService._generate_mock_products()

        # Seleccionar productos aleatorios
        selected_products = random.sample(mock_products, min(limit, len(mock_products)))

        products = []
        for product_data in selected_products:
            product = Product(**product_data)
            products.append(product)

        return products

    @staticmethod
    async def get_product_details(asin: str) -> Dict[str, Any]:
        """Obtener detalles completos del producto"""
        product = await AmazonService.get_product_by_asin(asin)

        return {
            "product": product,
            "shipping_info": {
                "estimated_delivery": "5-7 días hábiles",
                "shipping_cost": 15.00,
                "carrier": "Amazon Global"
            },
            "additional_info": {
                "warranty": "1 año",
                "return_policy": "30 días",
                "customer_rating": round(random.uniform(3.5, 5.0), 1),
                "reviews_count": random.randint(50, 5000)
            }
        }