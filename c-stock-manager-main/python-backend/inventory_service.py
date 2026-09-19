import json
from pathlib import Path
from typing import Dict, List, Optional, Set
from models import Category, DepartmentCategory, Supplier, Product, StandardProduct, PerishableProduct
from exceptions import InsufficientStockError


class InventoryService:
    def __init__(self):
        self._products: Dict[str, Product] = {}
        self._quantities: Dict[str, int] = {}
        self._categories: Dict[str, Category] = {}
        self._suppliers: Dict[str, Supplier] = {}
        self._category_skus: Dict[str, Set[str]] = {}
        self._supplier_skus: Dict[str, Set[str]] = {}

    def add_category(self, category: Category) -> None:
        if not category.id or not category.name:
            raise ValueError("Category ID and name are required.")
        self._categories[category.id] = category
        if category.id not in self._category_skus:
            self._category_skus[category.id] = set()

    def add_supplier(self, supplier: Supplier) -> None:
        if not supplier.id or not supplier.name:
            raise ValueError("Supplier ID and name are required.")
        self._suppliers[supplier.id] = supplier
        if supplier.id not in self._supplier_skus:
            self._supplier_skus[supplier.id] = set()

    def register_product(self, product: Product, opening_stock: int = 0) -> None:
        if not product.sku or not product.name:
            raise ValueError("SKU and name are required.")
        if product.category_id not in self._categories:
            raise ValueError(f"Unknown category: {product.category_id}")
        if product.supplier_id not in self._suppliers:
            raise ValueError(f"Unknown supplier: {product.supplier_id}")
        if opening_stock < 0:
            raise ValueError("Opening stock cannot be negative.")

        self._products[product.sku] = product
        self._quantities[product.sku] = opening_stock
        self._category_skus.setdefault(product.category_id, set()).add(product.sku)
        self._supplier_skus.setdefault(product.supplier_id, set()).add(product.sku)

    def receive_stock(self, sku: str, quantity: int) -> None:
        self._ensure_product_exists(sku)
        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")
        self._quantities[sku] = self.get_quantity(sku) + quantity

    def issue_stock(self, sku: str, quantity: int) -> None:
        self._ensure_product_exists(sku)
        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")
        current = self.get_quantity(sku)
        if quantity > current:
            raise InsufficientStockError(sku, current, quantity)
        self._quantities[sku] = current - quantity

    def get_quantity(self, sku: str) -> int:
        return self._quantities.get(sku, 0)

    def get_products(self) -> List[Product]:
        return list(self._products.values())

    def get_product(self, sku: str) -> Optional[Product]:
        return self._products.get(sku)

    def get_products_by_category(self, category_id: str) -> List[Product]:
        skus = self._category_skus.get(category_id, set())
        return [self._products[sku] for sku in skus if sku in self._products]

    def get_products_by_supplier(self, supplier_id: str) -> List[Product]:
        skus = self._supplier_skus.get(supplier_id, set())
        return [self._products[sku] for sku in skus if sku in self._products]

    def get_low_stock_products(self) -> List[Product]:
        low_stock = [
            p for p in self._products.values()
            if self.get_quantity(p.sku) <= p.reorder_threshold
        ]
        return sorted(low_stock, key=lambda p: self.get_quantity(p.sku))

    def format_product_row(self, product: Product) -> str:
        qty = self.get_quantity(product.sku)
        cat = self._categories.get(product.category_id)
        sup = self._suppliers.get(product.supplier_id)
        cat_name = cat.name if cat else product.category_id
        sup_name = sup.name if sup else product.supplier_id
        low_flag = " | LOW STOCK" if qty <= product.reorder_threshold else ""
        return (
            f"{product.sku} | {product.name:<18} | category={cat_name} | "
            f"supplier={sup_name} | stock={qty} | reorder={product.reorder_threshold} | "
            f"type={product.get_display_type()}{low_flag}"
        )

    def seed_demo_data(self) -> None:
        self.clear()
        self.add_category(DepartmentCategory("ELEC", "Electronics", "Devices and accessories"))
        self.add_category(DepartmentCategory("GROC", "Groceries", "Fast moving consumer goods"))
        self.add_supplier(Supplier("SUP-01", "Northwave Traders", "orders@northwave.example"))
        self.add_supplier(Supplier("SUP-02", "FreshRoute", "sales@freshroute.example"))
        self.register_product(StandardProduct("SKU-1001", "Wireless Mouse", "ELEC", "SUP-01", 10), 42)
        self.register_product(PerishableProduct("SKU-2001", "Organic Milk", "GROC", "SUP-02", 25, 14), 18)
        self.register_product(StandardProduct("SKU-1002", "USB-C Cable", "ELEC", "SUP-01", 15), 9)

    def export_json(self, filepath: str) -> None:
        data = {
            "categories": [{"id": c.id, "name": c.name} for c in self._categories.values()],
            "suppliers": [{"id": s.id, "name": s.name, "email": s.email} for s in self._suppliers.values()],
            "products": [
                {
                    "sku": p.sku,
                    "name": p.name,
                    "category_id": p.category_id,
                    "supplier_id": p.supplier_id,
                    "reorder_threshold": p.reorder_threshold,
                    "quantity": self.get_quantity(p.sku),
                    "type": "perishable" if isinstance(p, PerishableProduct) else "standard",
                    "shelf_life_days": getattr(p, "shelf_life_days", None)
                }
                for p in self._products.values()
            ]
        }
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def clear(self) -> None:
        self._products.clear()
        self._quantities.clear()
        self._categories.clear()
        self._suppliers.clear()
        self._category_skus.clear()
        self._supplier_skus.clear()

    def _ensure_product_exists(self, sku: str) -> None:
        if sku not in self._products:
            raise ValueError(f"Unknown SKU: '{sku}'")
