package ps107.inventory;

import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Scanner;
import ps107.inventory.exception.InsufficientStockException;
import ps107.inventory.model.DepartmentCategory;
import ps107.inventory.model.PerishableProduct;
import ps107.inventory.model.Product;
import ps107.inventory.model.StandardProduct;
import ps107.inventory.model.Supplier;

public final class Main {
    private static final Path SNAPSHOT_PATH = Path.of("java-console", "data", "inventory-snapshot.ser");

    private Main() {
    }

    public static void main(String[] args) {
        InventoryService inventory = new InventoryService();
        Scanner scanner = new Scanner(System.in);

        boolean running = true;
        while (running) {
            printMenu();
            String choice = scanner.nextLine().trim();

            try {
                switch (choice) {
                    case "1" -> addCategory(scanner, inventory);
                    case "2" -> addSupplier(scanner, inventory);
                    case "3" -> registerProduct(scanner, inventory);
                    case "4" -> receiveStock(scanner, inventory);
                    case "5" -> issueStock(scanner, inventory);
                    case "6" -> listCatalog(inventory);
                    case "7" -> showLowStock(inventory);
                    case "8" -> saveSnapshot(inventory);
                    case "9" -> loadSnapshot(inventory);
                    case "10" -> showIndexes(inventory);
                    case "11" -> updateProduct(scanner, inventory);
                    case "12" -> removeProduct(scanner, inventory);
                    case "13" -> seedDemoData(inventory);
                    case "0" -> running = false;
                    default -> System.out.println("Invalid option. Try again.");
                }
            } catch (RuntimeException ex) {
                System.out.println("Error: " + ex.getMessage());
            }
        }

        System.out.println("Inventory console closed.");
    }

    private static void printMenu() {
        System.out.println();
        System.out.println("=== PS-107 Inventory Management System ===");
        System.out.println("1. Add category");
        System.out.println("2. Add supplier");
        System.out.println("3. Register product");
        System.out.println("4. Receive stock");
        System.out.println("5. Issue stock");
        System.out.println("6. List catalog");
        System.out.println("7. Low-stock alerts");
        System.out.println("8. Export snapshot");
        System.out.println("9. Import snapshot");
        System.out.println("10. Show indexes");
        System.out.println("11. Update product");
        System.out.println("12. Remove product");
        System.out.println("13. Seed demo data");
        System.out.println("0. Exit");
        System.out.print("Choose an option: ");
    }

    private static void addCategory(Scanner scanner, InventoryService inventory) {
        System.out.print("Category id: ");
        String id = scanner.nextLine().trim();
        System.out.print("Category name: ");
        String name = scanner.nextLine().trim();
        System.out.print("Description: ");
        String description = scanner.nextLine().trim();

        inventory.addCategory(new DepartmentCategory(id, name, description));
        System.out.println("Category saved.");
    }

    private static void addSupplier(Scanner scanner, InventoryService inventory) {
        System.out.print("Supplier id: ");
        String id = scanner.nextLine().trim();
        System.out.print("Supplier name: ");
        String name = scanner.nextLine().trim();
        System.out.print("Contact email: ");
        String email = scanner.nextLine().trim();

        inventory.addSupplier(new Supplier(id, name, email));
        System.out.println("Supplier saved.");
    }

    private static void registerProduct(Scanner scanner, InventoryService inventory) {
        System.out.print("Product type (1 = standard, 2 = perishable): ");
        String type = scanner.nextLine().trim();

        System.out.print("SKU: ");
        String sku = scanner.nextLine().trim();
        System.out.print("Product name: ");
        String name = scanner.nextLine().trim();
        System.out.print("Category id: ");
        String categoryId = scanner.nextLine().trim();
        System.out.print("Supplier id: ");
        String supplierId = scanner.nextLine().trim();
        System.out.print("Reorder threshold: ");
        int threshold = parseInt(scanner.nextLine().trim());
        System.out.print("Opening stock: ");
        int openingStock = parseInt(scanner.nextLine().trim());

        Product product;
        if ("2".equals(type)) {
            System.out.print("Shelf life in days: ");
            int shelfLifeDays = parseInt(scanner.nextLine().trim());
            product = new PerishableProduct(sku, name, categoryId, supplierId, threshold, shelfLifeDays);
        } else {
            product = new StandardProduct(sku, name, categoryId, supplierId, threshold);
        }

        inventory.registerProduct(product, openingStock);
        System.out.println("Product registered.");
    }

    private static void receiveStock(Scanner scanner, InventoryService inventory) {
        System.out.print("SKU: ");
        String sku = scanner.nextLine().trim();
        System.out.print("Quantity received: ");
        int quantity = parseInt(scanner.nextLine().trim());

        inventory.receiveStock(sku, quantity);
        System.out.println("Stock received.");
    }

    private static void issueStock(Scanner scanner, InventoryService inventory) {
        System.out.print("SKU: ");
        String sku = scanner.nextLine().trim();
        System.out.print("Quantity issued: ");
        int quantity = parseInt(scanner.nextLine().trim());

        try {
            inventory.issueStock(sku, quantity);
            System.out.println("Stock issued.");
        } catch (InsufficientStockException ex) {
            System.out.println(ex.getMessage());
        }
    }

    private static void listCatalog(InventoryService inventory) {
        List<Product> products = inventory.getProducts();
        if (products.isEmpty()) {
            System.out.println("No products registered.");
            return;
        }

        for (Product product : products) {
            System.out.println(inventory.formatProductRow(product));
        }
    }

    private static void showIndexes(InventoryService inventory) {
        System.out.println("Category index:");
        inventory.getCategoryIndexSnapshot().forEach((categoryId, skus) ->
            System.out.println("  " + categoryId + " -> " + skus)
        );

        System.out.println("Supplier index:");
        inventory.getSupplierIndexSnapshot().forEach((supplierId, skus) ->
            System.out.println("  " + supplierId + " -> " + skus)
        );
    }

    private static void updateProduct(Scanner scanner, InventoryService inventory) {
        System.out.print("SKU to update: ");
        String sku = scanner.nextLine().trim();
        Product existing = inventory.getProduct(sku);
        if (existing == null) {
            System.out.println("Unknown SKU.");
            return;
        }

        System.out.print("New name [" + existing.getName() + "]: ");
        String name = blankToDefault(scanner.nextLine(), existing.getName());
        System.out.print("New category id [" + existing.getCategoryId() + "]: ");
        String categoryId = blankToDefault(scanner.nextLine(), existing.getCategoryId());
        System.out.print("New supplier id [" + existing.getSupplierId() + "]: ");
        String supplierId = blankToDefault(scanner.nextLine(), existing.getSupplierId());
        System.out.print("New reorder threshold [" + existing.getReorderThreshold() + "]: ");
        int threshold = parseOptionalInt(scanner.nextLine(), existing.getReorderThreshold());

        Product updated = existing instanceof PerishableProduct perishable
            ? new PerishableProduct(sku, name, categoryId, supplierId, threshold, perishable.getShelfLifeDays())
            : new StandardProduct(sku, name, categoryId, supplierId, threshold);

        inventory.updateProduct(updated);
        System.out.println("Product updated.");
    }

    private static void removeProduct(Scanner scanner, InventoryService inventory) {
        System.out.print("SKU to remove: ");
        String sku = scanner.nextLine().trim();
        inventory.removeProduct(sku);
        System.out.println("Product removed if it existed.");
    }

    private static void showLowStock(InventoryService inventory) {
        List<Product> alerts = inventory.getLowStockProducts();
        if (alerts.isEmpty()) {
            System.out.println("No products are below the reorder threshold.");
            return;
        }

        System.out.println("Low-stock alerts:");
        for (Product product : alerts) {
            System.out.println(inventory.formatProductRow(product));
        }
    }

    private static void saveSnapshot(InventoryService inventory) {
        inventory.exportSnapshot(SNAPSHOT_PATH);
        System.out.println("Snapshot saved to " + SNAPSHOT_PATH.toString());
    }

    private static void loadSnapshot(InventoryService inventory) {
        inventory.importSnapshot(SNAPSHOT_PATH);
        System.out.println("Snapshot loaded from " + SNAPSHOT_PATH.toString());
    }

    private static void seedDemoData(InventoryService inventory) {
        inventory.seedDemoData();
        System.out.println("Demo data loaded.");
    }

    private static int parseInt(String input) {
        return Integer.parseInt(input.toLowerCase(Locale.ROOT).trim());
    }

    private static int parseOptionalInt(String input, int fallback) {
        String trimmed = input.trim();
        return trimmed.isEmpty() ? fallback : Integer.parseInt(trimmed);
    }

    private static String blankToDefault(String input, String fallback) {
        String trimmed = input.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }
}