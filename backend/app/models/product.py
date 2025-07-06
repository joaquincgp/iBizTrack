from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class Product(BaseModel):
    asin: str = Field(..., description="Amazon ASIN")
    title: str = Field(..., description="Título del producto")
    price: float = Field(..., description="Precio en USD")
    weight: Optional[float] = Field(None, description="Peso en kg")
    dimensions: Optional[dict] = Field(None, description="Dimensiones del producto")
    image_url: Optional[str] = Field(None, description="URL de la imagen")
    category: Optional[str] = Field(None, description="Categoría del producto")
    description: Optional[str] = Field(None, description="Descripción del producto")
    availability: Optional[bool] = Field(True, description="Disponibilidad")

    class Config:
        json_schema_extra = {
            "example": {
                "asin": "B08N5WRWNW",
                "title": "Echo Dot (4th Gen)",
                "price": 49.99,
                "weight": 0.34,
                "dimensions": {"length": 10, "width": 10, "height": 9},
                "image_url": "https://example.com/image.jpg",
                "category": "Electronics",
                "description": "Smart speaker with Alexa",
                "availability": True
            }
        }


class ProductResponse(BaseModel):
    id: str
    asin: str
    title: str
    price: float
    weight: Optional[float]
    dimensions: Optional[dict]
    image_url: Optional[str]
    category: Optional[str]
    description: Optional[str]
    availability: bool
    senae_category: Optional[str] = None
    calculated_tariff: Optional[dict] = None


class ProductSearch(BaseModel):
    query: str = Field(..., description="Término de búsqueda")
    category: Optional[str] = Field(None, description="Categoría específica")
    min_price: Optional[float] = Field(None, description="Precio mínimo")
    max_price: Optional[float] = Field(None, description="Precio máximo")