import unittest
from models import DepartmentCategory, Supplier, StandardProduct, PerishableProduct
from exceptions import InsufficientStockError
from inventory_service import InventoryService


class TestInventoryService(unittest.TestCase):
    def setUp(self):
        self.service = InventoryService()
        self.service.seed_demo_data()

    def test_seed_demo_data(self):
        products = self.service.get_products()
        self.assertEqual(len(products), 3)

    def test_receive_stock(self):
        self.service.receive_stock("SKU-1001", 10)
        self.assertEqual(self.service.get_quantity("SKU-1001"), 52)

    def test_issue_stock_success(self):
        self.service.issue_stock("SKU-1001", 10)
        self.assertEqual(self.service.get_quantity("SKU-1001"), 32)

    def test_issue_stock_insufficient(self):
        with self.assertRaises(InsufficientStockError):
            self.service.issue_stock("SKU-1001", 100)

    def test_low_stock_products(self):
        low_stock = self.service.get_low_stock_products()
        self.assertTrue(any(p.sku == "SKU-1002" for p in low_stock))

    def test_add_custom_product(self):
        cat = DepartmentCategory("FOOD", "Food Items", "Edibles")
        sup = Supplier("SUP-03", "Desi Grains", "contact@desigrains.example")
        prod = StandardProduct("SKU-3001", "Basmati Rice 10kg", "FOOD", "SUP-03", 5)

        self.service.add_category(cat)
        self.service.add_supplier(sup)
        self.service.register_product(prod, 20)

        self.assertEqual(self.service.get_quantity("SKU-3001"), 20)


if __name__ == "__main__":
    unittest.main()
