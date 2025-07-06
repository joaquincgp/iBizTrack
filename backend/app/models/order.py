from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class SenaeCategory(str, Enum):
    B = "B"
    C = "C"
    D = "D"


class OrderStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class OrderItem(BaseModel):
    product_asin: str = Field(..., description="ASIN del producto")
    product_title: str = Field(..., description="Título del producto")
    quantity: int = Field(..., gt=0, description="Cantidad")
    unit_price: float = Field(..., gt=0, description="Precio unitario en USD")
    weight: Optional[float] = Field(None, description="Peso unitario en kg")
    senae_category: SenaeCategory = Field(..., description="Categoría SENAE")
    tariff_calculation: Optional[Dict] = Field(None, description="Cálculo de tarifas")


class Order(BaseModel):
    customer_name: str = Field(..., description="Nombre del cliente")
    customer_email: str = Field(..., description="Email del cliente")
    customer_cedula: str = Field(..., description="Cédula del cliente")
    items: List[OrderItem] = Field(..., description="Productos del pedido")
    shipping_address: str = Field(..., description="Dirección de envío")
    notes: Optional[str] = Field(None, description="Notas adicionales")

    class Config:
        json_schema_extra = {
            "example": {
                "customer_name": "Juan Pérez",
                "customer_email": "juan@email.com",
                "customer_cedula": "1234567890",
                "items": [
                    {
                        "product_asin": "B08N5WRWNW",
                        "product_title": "Echo Dot (4th Gen)",
                        "quantity": 2,
                        "unit_price": 49.99,
                        "weight": 0.34,
                        "senae_category": "B"
                    }
                ],
                "shipping_address": "Av. Amazonas 123, Quito, Ecuador",
                "notes": "Entrega en horas de oficina"
            }
        }


class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_email: str
    customer_cedula: str
    items: List[OrderItem]
    shipping_address: str
    notes: Optional[str]
    status: OrderStatus
    total_value: float
    total_weight: float
    total_tariffs: Dict
    created_at: datetime
    updated_at: datetime


class TariffCalculation(BaseModel):
    senae_category: SenaeCategory
    product_value: float
    weight: float
    tariff_details: Dict
    total_tariff: float