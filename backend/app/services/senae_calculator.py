from typing import Dict, Any
# from backend.app.models.order import SenaeCategory
from app.models.order import SenaeCategory


class SenaeCalculator:
    """Calculadora de tarifas SENAE según las categorías B, C y D"""

    @staticmethod
    def calculate_category_b_tariff(value: float, weight: float, importations_count: int = 1) -> Dict[str, Any]:
        """
        Categoría B: Paquetes hasta 4 Kg y US$ 400
        - Hasta 5 importaciones: $1.200 por destinatario al año
        - Hasta 12 importaciones: $2.400 por remitente migrante al año
        - Arancel: $42 por importación
        - Libre de tributos
        """
        if weight > 4 or value > 400:
            raise ValueError("Producto no califica para categoría B (máximo 4kg y $400)")

        tariff = 42.0  # Arancel fijo

        # Límites anuales
        if importations_count <= 5:
            annual_limit = 1200
        elif importations_count <= 12:
            annual_limit = 2400
        else:
            raise ValueError("Excede el límite de 12 importaciones anuales para categoría B")

        return {
            "category": "B",
            "base_value": value,
            "weight": weight,
            "tariff": tariff,
            "iva": 0,
            "fodinfa": 0,
            "adv": 0,
            "total_taxes": tariff,
            "total_cost": value + tariff,
            "importations_count": importations_count,
            "annual_limit": annual_limit,
            "free_of_tributes": True
        }

    @staticmethod
    def calculate_category_c_tariff(value: float, weight: float) -> Dict[str, Any]:
        """
        Categoría C: Paquetes hasta 50 kg y $2.000
        - Requiere Documento de Control Previo según el producto (excepto INEN)
        - Arancel: Depende del producto
        - IVA: 12%
        - FODINFA: 0.5%
        """
        if weight > 50 or value > 2000:
            raise ValueError("Producto no califica para categoría C (máximo 50kg y $2.000)")

        # Arancel variable según producto (simulamos 10% promedio)
        tariff_rate = 0.10
        tariff = value * tariff_rate

        # IVA 12%
        iva_rate = 0.12
        iva = (value + tariff) * iva_rate

        # FODINFA 0.5%
        fodinfa_rate = 0.005
        fodinfa = value * fodinfa_rate

        total_taxes = tariff + iva + fodinfa

        return {
            "category": "C",
            "base_value": value,
            "weight": weight,
            "tariff": tariff,
            "tariff_rate": tariff_rate,
            "iva": iva,
            "iva_rate": iva_rate,
            "fodinfa": fodinfa,
            "fodinfa_rate": fodinfa_rate,
            "adv": 0,
            "total_taxes": total_taxes,
            "total_cost": value + total_taxes,
            "requires_control_document": True
        }

    @staticmethod
    def calculate_category_d_tariff(value: float, weight: float, product_type: str = "textiles") -> Dict[str, Any]:
        """
        Categoría D: Prendas de vestir, textiles y calzado hasta 20 kg y $2.000
        - Requieren INEN (excepto primera vez al año con monto hasta $500)
        - Textiles: 10% ADV + US$5.5 x Kg
        - Calzado: 10% ADV + US$6 x par
        - IVA: 12%
        - FODINFA: 0.5%
        """
        if weight > 20 or value > 2000:
            raise ValueError("Producto no califica para categoría D (máximo 20kg y $2.000)")

        # ADV 10%
        adv_rate = 0.10
        adv = value * adv_rate

        # Tarifa específica según tipo de producto
        if product_type.lower() == "textiles":
            specific_tariff = 5.5 * weight
        elif product_type.lower() == "calzado":
            # Asumimos 1 par por kg para simplificar
            pairs = max(1, int(weight))
            specific_tariff = 6.0 * pairs
        else:
            specific_tariff = 5.5 * weight  # Default textiles

        total_tariff = adv + specific_tariff

        # IVA 12%
        iva_rate = 0.12
        iva = (value + total_tariff) * iva_rate

        # FODINFA 0.5%
        fodinfa_rate = 0.005
        fodinfa = value * fodinfa_rate

        total_taxes = total_tariff + iva + fodinfa

        # Verificar si requiere INEN
        requires_inen = value > 500

        return {
            "category": "D",
            "base_value": value,
            "weight": weight,
            "product_type": product_type,
            "adv": adv,
            "adv_rate": adv_rate,
            "specific_tariff": specific_tariff,
            "total_tariff": total_tariff,
            "iva": iva,
            "iva_rate": iva_rate,
            "fodinfa": fodinfa,
            "fodinfa_rate": fodinfa_rate,
            "total_taxes": total_taxes,
            "total_cost": value + total_taxes,
            "requires_inen": requires_inen,
            "inen_exemption_limit": 500
        }

    @staticmethod
    def calculate_tariff(category: SenaeCategory, value: float, weight: float, **kwargs) -> Dict[str, Any]:
        """Método principal para calcular tarifas según categoría"""
        try:
            if category == SenaeCategory.B:
                return SenaeCalculator.calculate_category_b_tariff(
                    value, weight, kwargs.get('importations_count', 1)
                )
            elif category == SenaeCategory.C:
                return SenaeCalculator.calculate_category_c_tariff(value, weight)
            elif category == SenaeCategory.D:
                return SenaeCalculator.calculate_category_d_tariff(
                    value, weight, kwargs.get('product_type', 'textiles')
                )
            else:
                raise ValueError(f"Categoría SENAE no válida: {category}")
        except Exception as e:
            return {
                "error": str(e),
                "category": category,
                "base_value": value,
                "weight": weight
            }

    @staticmethod
    def determine_category(value: float, weight: float, product_type: str = "") -> SenaeCategory:
        """Determinar automáticamente la categoría SENAE más apropiada"""
        product_type_lower = product_type.lower()

        # Categoría D para textiles y calzado
        if any(keyword in product_type_lower for keyword in ["textile", "ropa", "vestir", "calzado", "zapato"]):
            if weight <= 20 and value <= 2000:
                return SenaeCategory.D

        # Categoría B para productos pequeños y económicos
        if weight <= 4 and value <= 400:
            return SenaeCategory.B

        # Categoría C para el resto
        if weight <= 50 and value <= 2000:
            return SenaeCategory.C

        # Por defecto, categoría C
        return SenaeCategory.C