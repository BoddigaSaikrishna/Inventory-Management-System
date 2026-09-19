import sys
from models import DepartmentCategory, Supplier, StandardProduct, PerishableProduct
from inventory_service import InventoryService


def main():
    print("=" * 60)
    print("  Python VoiceStock Inventory Management Console Subsystem")
    print("=" * 60)

    service = InventoryService()
    service.seed_demo_data()

    print("\n[+] Demo inventory seeded successfully:")
    for product in service.get_products():
        print("  - " + service.format_product_row(product))

    print("\n[+] Testing Receive Stock (+15 USB-C Cables)...")
    service.receive_stock("SKU-1002", 15)

    print("\n[+] Testing Issue Stock (-5 Wireless Mice)...")
    service.issue_stock("SKU-1001", 5)

    print("\n[+] Updated Inventory Catalog:")
    for product in service.get_products():
        print("  - " + service.format_product_row(product))

    export_path = "inventory_data.json"
    service.export_json(export_path)
    print(f"\n[OK] Exported inventory snapshot to: {export_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
