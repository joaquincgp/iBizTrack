from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import uuid
from bson import ObjectId
from backend.app.models.order import Order, OrderResponse, OrderItem, OrderStatus, TariffCalculation
from backend.app.services.senae_calculator import SenaeCalculator
from backend.app.services.amazon_service import AmazonService
from backend.app.database import orders_collection

router = APIRouter()


def order_helper(order) -> dict:
    """Helper para convertir documentos de MongoDB"""
    return {
        "id": str(order["_id"]),
        "order_number": order["order_number"],
        "customer_name": order["customer_name"],
        "customer_email": order["customer_email"],
        "customer_cedula": order["customer_cedula"],
        "items": order["items"],
        "shipping_address": order["shipping_address"],
        "notes": order.get("notes", ""),
        "status": order["status"],
        "total_value": order["total_value"],
        "total_weight": order["total_weight"],
        "total_tariffs": order["total_tariffs"],
        "created_at": order["created_at"],
        "updated_at": order["updated_at"]
    }


@router.post("/", response_model=OrderResponse)
async def create_order(order: Order):
    """Crear nueva orden de compra"""
    try:
        # Generar número de orden único
        order_number = f"IBT-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

        # Calcular totales y tarifas para cada item
        total_value = 0
        total_weight = 0
        total_tariffs = {
            "total_tariff": 0,
            "total_iva": 0,
            "total_fodinfa": 0,
            "total_adv": 0,
            "total_taxes": 0
        }

        processed_items = []

        for item in order.items:
            # Calcular tarifa para cada item
            item_total_value = item.unit_price * item.quantity
            item_total_weight = (item.weight or 1.0) * item.quantity

            tariff_calculation = SenaeCalculator.calculate_tariff(
                item.senae_category,
                item_total_value,
                item_total_weight,
                product_type="textiles" if item.senae_category.value == "D" else "general"
            )

            # Actualizar item con cálculo de tarifa
            processed_item = item.dict()
            processed_item["tariff_calculation"] = tariff_calculation
            processed_items.append(processed_item)

            # Sumar a totales
            total_value += item_total_value
            total_weight += item_total_weight

            if "total_tariff" in tariff_calculation:
                total_tariffs["total_tariff"] += tariff_calculation.get("total_tariff", 0)
            if "tariff" in tariff_calculation:
                total_tariffs["total_tariff"] += tariff_calculation.get("tariff", 0)

            total_tariffs["total_iva"] += tariff_calculation.get("iva", 0)
            total_tariffs["total_fodinfa"] += tariff_calculation.get("fodinfa", 0)
            total_tariffs["total_adv"] += tariff_calculation.get("adv", 0)

        # Calcular total de impuestos
        total_tariffs["total_taxes"] = (
                total_tariffs["total_tariff"] +
                total_tariffs["total_iva"] +
                total_tariffs["total_fodinfa"] +
                total_tariffs["total_adv"]
        )

        # Crear documento de orden
        order_doc = {
            "order_number": order_number,
            "customer_name": order.customer_name,
            "customer_email": order.customer_email,
            "customer_cedula": order.customer_cedula,
            "items": processed_items,
            "shipping_address": order.shipping_address,
            "notes": order.notes,
            "status": OrderStatus.DRAFT.value,
            "total_value": round(total_value, 2),
            "total_weight": round(total_weight, 2),
            "total_tariffs": total_tariffs,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        # Insertar en base de datos
        result = await orders_collection.insert_one(order_doc)

        # Obtener orden creada
        new_order = await orders_collection.find_one({"_id": result.inserted_id})

        return OrderResponse(**order_helper(new_order))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear orden: {str(e)}")


@router.get("/", response_model=List[OrderResponse])
async def get_orders(
        status: Optional[str] = Query(None, description="Filtrar por estado"),
        customer_email: Optional[str] = Query(None, description="Filtrar por email del cliente"),
        limit: int = Query(10, ge=1, le=100, description="Límite de resultados"),
        skip: int = Query(0, ge=0, description="Omitir resultados")
):
    """Obtener órdenes con filtros opcionales"""
    try:
        # Construir filtro
        filter_query = {}
        if status:
            filter_query["status"] = status
        if customer_email:
            filter_query["customer_email"] = customer_email

        # Ejecutar consulta
        cursor = orders_collection.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
        orders = await cursor.to_list(length=limit)

        return [OrderResponse(**order_helper(order)) for order in orders]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener órdenes: {str(e)}")


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(order_id: str):
    """Obtener orden por ID"""
    try:
        order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        return OrderResponse(**order_helper(order))

    except Exception as e:
        if "not a valid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID de orden inválido")
        raise HTTPException(status_code=500, detail=f"Error al obtener orden: {str(e)}")


@router.get("/number/{order_number}", response_model=OrderResponse)
async def get_order_by_number(order_number: str):
    """Obtener orden por número de orden"""
    try:
        order = await orders_collection.find_one({"order_number": order_number})
        if not order:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        return OrderResponse(**order_helper(order))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener orden: {str(e)}")


@router.put("/{order_id}/status")
async def update_order_status(order_id: str, status: OrderStatus):
    """Actualizar estado de la orden"""
    try:
        result = await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {
                    "status": status.value,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        # Obtener orden actualizada
        updated_order = await orders_collection.find_one({"_id": ObjectId(order_id)})
        return OrderResponse(**order_helper(updated_order))

    except Exception as e:
        if "not a valid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID de orden inválido")
        raise HTTPException(status_code=500, detail=f"Error al actualizar orden: {str(e)}")


@router.delete("/{order_id}")
async def delete_order(order_id: str):
    """Eliminar orden"""
    try:
        result = await orders_collection.delete_one({"_id": ObjectId(order_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        return {"message": "Orden eliminada exitosamente"}

    except Exception as e:
        if "not a valid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="ID de orden inválido")
        raise HTTPException(status_code=500, detail=f"Error al eliminar orden: {str(e)}")


@router.post("/calculate-bulk-tariff")
async def calculate_bulk_tariff(items: List[dict]):
    """Calcular tarifas para múltiples productos"""
    try:
        calculations = []
        total_tariffs = {
            "total_tariff": 0,
            "total_iva": 0,
            "total_fodinfa": 0,
            "total_adv": 0,
            "total_taxes": 0
        }

        for item in items:
            tariff_calculation = SenaeCalculator.calculate_tariff(
                item["senae_category"],
                item["total_value"],
                item["total_weight"],
                product_type=item.get("product_type", "general")
            )

            calculations.append({
                "item": item,
                "tariff_calculation": tariff_calculation
            })

            # Sumar a totales
            if "total_tariff" in tariff_calculation:
                total_tariffs["total_tariff"] += tariff_calculation.get("total_tariff", 0)
            if "tariff" in tariff_calculation:
                total_tariffs["total_tariff"] += tariff_calculation.get("tariff", 0)

            total_tariffs["total_iva"] += tariff_calculation.get("iva", 0)
            total_tariffs["total_fodinfa"] += tariff_calculation.get("fodinfa", 0)
            total_tariffs["total_adv"] += tariff_calculation.get("adv", 0)

        total_tariffs["total_taxes"] = (
                total_tariffs["total_tariff"] +
                total_tariffs["total_iva"] +
                total_tariffs["total_fodinfa"] +
                total_tariffs["total_adv"]
        )

        return {
            "items_calculations": calculations,
            "total_tariffs": total_tariffs
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al calcular tarifas: {str(e)}")