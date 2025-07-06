from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.app.models.product import Product, ProductResponse, ProductSearch
from backend.app.services.amazon_service import AmazonService
from backend.app.services.senae_calculator import SenaeCalculator
from backend.app.database import products_collection

router = APIRouter()


@router.get("/search", response_model=List[ProductResponse])
async def search_products(
        q: str = Query(..., description="Término de búsqueda"),
        category: Optional[str] = Query(None, description="Categoría"),
        limit: int = Query(10, ge=1, le=50, description="Límite de resultados")
):
    """Buscar productos en Amazon"""
    try:
        products = await AmazonService.search_products(q, category, limit)

        # Enriquecer con cálculos SENAE
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
    """Obtener productos en tendencia"""
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


@router.get("/{asin}", response_model=ProductResponse)
async def get_product_by_asin(asin: str):
    """Obtener producto por ASIN"""
    try:
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
        product = await AmazonService.get_product_by_asin(asin)

        # Usar peso personalizado si se proporciona
        weight = custom_weight or product.weight or 1.0

        # Convertir categoría string a enum
        from backend.app.models.order import SenaeCategory
        category_enum = SenaeCategory(senae_category.upper())

        tariff_calculation = SenaeCalculator.calculate_tariff(
            category_enum,
            product.price,
            weight,
            product_type=product_type or product.category or "general"
        )

        return {
            "product": product,
            "senae_category": senae_category.upper(),
            "weight_used": weight,
            "tariff_calculation": tariff_calculation
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al calcular tarifa: {str(e)}")