from dataclasses import dataclass
from typing import Optional
from abc import ABC, abstractmethod


@dataclass
class Category:
    id: str
    name: str

    def get_display_name(self) -> str:
        return self.name


@dataclass
class DepartmentCategory(Category):
    department: str = ""


@dataclass
class Supplier:
    id: str
    name: str
    email: str


@dataclass
class Product(ABC):
    sku: str
    name: str
    category_id: str
    supplier_id: str
    reorder_threshold: int

    @abstractmethod
    def get_display_type(self) -> str:
        pass


@dataclass
class StandardProduct(Product):
    def get_display_type(self) -> str:
        return "STANDARD"


@dataclass
class PerishableProduct(Product):
    shelf_life_days: int = 30

    def get_display_type(self) -> str:
        return f"PERISHABLE ({self.shelf_life_days}d)"
