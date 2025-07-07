from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.product import Product, ProductResponse, ProductSearch
from app.services.amazon_service import AmazonService
from app.services.senae_calculator import SenaeCalculator
from app.database import products_collection
from app.models.order import SenaeCategory
import datetime

router = APIRouter()


def product_helper(product) -> dict:
    """Helper para convertir documentos de MongoDB"""
    return {
        "id": str(product["_id"]),
        "asin": product["asin"],
        "title": product["title"],
        "price": product["price"],
        "weight": product.get("weight"),
        "dimensions": product.get("dimensions"),
        "image_url": product.get("image_url"),
        "category": product.get("category"),
        "description": product.get("description"),
        "availability": product.get("availability", True),
        "senae_category": product.get("senae_category"),
        "calculated_tariff": product.get("calculated_tariff")
    }


async def save_product_to_db(product: Product, senae_category: str, tariff_calculation: dict):
    """Guardar producto en MongoDB"""
    try:
        # Verificar si el producto ya existe
        existing_product = await products_collection.find_one({"asin": product.asin})

        product_doc = {
            "asin": product.asin,
            "title": product.title,
            "price": product.price,
            "weight": product.weight,
            "dimensions": product.dimensions,
            "image_url": product.image_url,
            "category": product.category,
            "description": product.description,
            "availability": product.availability,
            "senae_category": senae_category,
            "calculated_tariff": tariff_calculation,
            "created_at": datetime.datetime.utcnow(),
            "updated_at": datetime.datetime.utcnow()
        }

        if existing_product:
            # Actualizar producto existente
            await products_collection.update_one(
                {"asin": product.asin},
                {"$set": {**product_doc, "updated_at": datetime.datetime.utcnow()}}
            )
        else:
            # Insertar nuevo producto
            await products_collection.insert_one(product_doc)

        return True
    except Exception as e:
        print(f"Error guardando producto en DB: {e}")
        return False


@router.get("/search", response_model=List[ProductResponse])
async def search_products(
        q: str = Query(..., description="Término de búsqueda"),
        category: Optional[str] = Query(None, description="Categoría"),
        limit: int = Query(10, ge=1, le=50, description="Límite de resultados")
):
    """Buscar productos en Amazon y guardar en MongoDB"""
    try:
        # Buscar productos en el servicio mock de Amazon
        products = await AmazonService.search_products(q, category, limit)

        # Enriquecer con cálculos SENAE y guardar en DB
        response_products = []
        for product in products:
            # Determinar categoría SENAE automáticamente
            senae_category = SenaeCalculator.determine_category(
                product.price,
                product.weight or 1.0,
                product.category or ""
            )

            # Calcular tarifa
            tariff_calculation = SenaeCalculator.calculate_tariff(
                senae_category,
                product.price,
                product.weight or 1.0,
                product_type=product.category or "general"
            )

            # Guardar en MongoDB
            await save_product_to_db(product, senae_category.value, tariff_calculation)

            response_product = ProductResponse(
                id=product.asin,
                asin=product.asin,
                title=product.title,
                price=product.price,
                weight=product.weight,
                dimensions=product.dimensions,
                image_url=product.image_url,
                category=product.category,
                description=product.description,
                availability=product.availability,
                senae_category=senae_category.value,
                calculated_tariff=tariff_calculation
            )
            response_products.append(response_product)

        return response_products

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al buscar productos: {str(e)}")


@router.get("/trending", response_model=List[ProductResponse])
async def get_trending_products(limit: int = Query(5, ge=1, le=20)):
    """Obtener productos en tendencia y guardar en MongoDB"""
    try:
        products = await AmazonService.get_trending_products(limit)

        response_products = []
        for product in products:
            senae_category = SenaeCalculator.determine_category(
                product.price,
                product.weight or 1.0,
                product.category or ""
            )

            tariff_calculation = SenaeCalculator.calculate_tariff(
                senae_category,
                product.price,
                product.weight or 1.0,
                product_type=product.category or "general"
            )

            # Guardar en MongoDB
            await save_product_to_db(product, senae_category.value, tariff_calculation)

            response_product = ProductResponse(
                id=product.asin,
                asin=product.asin,
                title=product.title,
                price=product.price,
                weight=product.weight,
                dimensions=product.dimensions,
                image_url=product.image_url,
                category=product.category,
                description=product.description,
                availability=product.availability,
                senae_category=senae_category.value,
                calculated_tariff=tariff_calculation
            )
            response_products.append(response_product)

        return response_products

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener productos trending: {str(e)}")


@router.get("/saved", response_model=List[ProductResponse])
async def get_saved_products(
        limit: int = Query(20, ge=1, le=100),
        skip: int = Query(0, ge=0),
        category: Optional[str] = Query(None, description="Filtrar por categoría")
):
    """Obtener productos guardados en MongoDB"""
    try:
        # Construir filtro
        filter_query = {}
        if category:
            filter_query["category"] = {"$regex": category, "$options": "i"}

        # Ejecutar consulta
        cursor = products_collection.find(filter_query).sort("updated_at", -1).skip(skip).limit(limit)
        products = await cursor.to_list(length=limit)

        return [ProductResponse(**product_helper(product)) for product in products]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener productos guardados: {str(e)}")


@router.get("/{asin}", response_model=ProductResponse)
async def get_product_by_asin(asin: str):
    """Obtener producto por ASIN (primero desde DB, luego desde Amazon)"""
    try:
        # Buscar primero en la base de datos
        product_doc = await products_collection.find_one({"asin": asin})

        if product_doc:
            return ProductResponse(**product_helper(product_doc))

        # Si no está en DB, buscar en Amazon mock
        product = await AmazonService.get_product_by_asin(asin)

        senae_category = SenaeCalculator.determine_category(
            product.price,
            product.weight or 1.0,
            product.category or ""
        )

        tariff_calculation = SenaeCalculator.calculate_tariff(
            senae_category,
            product.price,
            product.weight or 1.0,
            product_type=product.category or "general"
        )

        # Guardar en MongoDB
        await save_product_to_db(product, senae_category.value, tariff_calculation)

        response_product = ProductResponse(
            id=product.asin,
            asin=product.asin,
            title=product.title,
            price=product.price,
            weight=product.weight,
            dimensions=product.dimensions,
            image_url=product.image_url,
            category=product.category,
            description=product.description,
            availability=product.availability,
            senae_category=senae_category.value,
            calculated_tariff=tariff_calculation
        )

        return response_product

    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Producto no encontrado: {str(e)}")


@router.post("/calculate-tariff")
async def calculate_custom_tariff(
        asin: str,
        senae_category: str,
        custom_weight: Optional[float] = None,
        product_type: Optional[str] = None
):
    """Calcular tarifa personalizada para un producto"""
    try:
        # Buscar producto en DB primero
        product_doc = await products_collection.find_one({"asin": asin})

        if product_doc:
            product_price = product_doc["price"]
            product_weight = custom_weight or product_doc.get("weight", 1.0)
            product_category = product_type or product_doc.get("category", "general")
        else:
            # Buscar en Amazon mock
            product = await AmazonService.get_product_by_asin(asin)
            product_price = product.price
            product_weight = custom_weight or product.weight or 1.0
            product_category = product_type or product.category or "general"

        # Convertir categoría string a enum
        category_enum = SenaeCategory(senae_category.upper())

        tariff_calculation = SenaeCalculator.calculate_tariff(
            category_enum,
            product_price,
            product_weight,
            product_type=product_category
        )

        return {
            "asin": asin,
            "senae_category": senae_category.upper(),
            "weight_used": product_weight,
            "price_used": product_price,
            "tariff_calculation": tariff_calculation
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al calcular tarifa: {str(e)}")


@router.post("/bulk-save")
async def bulk_save_products():
    """Guardar todos los productos mock en la base de datos"""
    try:
        # Obtener productos trending para guardar inicialmente
        products = await AmazonService.get_trending_products(20)

        saved_count = 0
        for product in products:
            senae_category = SenaeCalculator.determine_category(
                product.price,
                product.weight or 1.0,
                product.category or ""
            )

            tariff_calculation = SenaeCalculator.calculate_tariff(
                senae_category,
                product.price,
                product.weight or 1.0,
                product_type=product.category or "general"
            )

            success = await save_product_to_db(product, senae_category.value, tariff_calculation)
            if success:
                saved_count += 1

        return {
            "message": f"Se guardaron {saved_count} productos en la base de datos",
            "total_processed": len(products)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar productos: {str(e)}")