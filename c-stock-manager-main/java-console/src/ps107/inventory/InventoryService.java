package ps107.inventory;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import ps107.inventory.exception.InsufficientStockException;
import ps107.inventory.model.Category;
import ps107.inventory.model.DepartmentCategory;
import ps107.inventory.model.PerishableProduct;
import ps107.inventory.model.Product;
import ps107.inventory.model.StandardProduct;
import ps107.inventory.model.Supplier;

public final class InventoryService {
    private final Map<String, Product> productsBySku = new LinkedHashMap<>();
    private final Map<String, Integer> quantityBySku = new LinkedHashMap<>();
    private final Map<String, Category> categoriesById = new LinkedHashMap<>();
    private final Map<String, Supplier> suppliersById = new LinkedHashMap<>();
    private final Map<String, Set<String>> categoryToSkus = new LinkedHashMap<>();
    private final Map<String, Set<String>> supplierToSkus = new LinkedHashMap<>();

    public synchronized void addCategory(Category category) {
        requireText(category.getId(), "Category id is required.");
        requireText(category.getName(), "Category name is required.");
        categoriesById.put(category.getId(), category);
        categoryToSkus.computeIfAbsent(category.getId(), ignored -> new LinkedHashSet<>());
    }

    public synchronized void addSupplier(Supplier supplier) {
        requireText(supplier.getId(), "Supplier id is required.");
        requireText(supplier.getName(), "Supplier name is required.");
        suppliersById.put(supplier.getId(), supplier);
        supplierToSkus.computeIfAbsent(supplier.getId(), ignored -> new LinkedHashSet<>());
    }

    public synchronized void registerProduct(Product product, int openingStock) {
        requireText(product.getSku(), "SKU is required.");
        requireText(product.getName(), "Product name is required.");
        if (!categoriesById.containsKey(product.getCategoryId())) {
            throw new IllegalArgumentException("Unknown category: " + product.getCategoryId());
        }
        if (!suppliersById.containsKey(product.getSupplierId())) {
            throw new IllegalArgumentException("Unknown supplier: " + product.getSupplierId());
        }
        if (openingStock < 0) {
            throw new IllegalArgumentException("Opening stock cannot be negative.");
        }

        productsBySku.put(product.getSku(), product);
        quantityBySku.put(product.getSku(), openingStock);
        categoryToSkus.computeIfAbsent(product.getCategoryId(), ignored -> new LinkedHashSet<>()).add(product.getSku());
        supplierToSkus.computeIfAbsent(product.getSupplierId(), ignored -> new LinkedHashSet<>()).add(product.getSku());
    }

    public synchronized void updateProduct(Product product) {
        requireText(product.getSku(), "SKU is required.");
        ensureProductExists(product.getSku());
        if (!categoriesById.containsKey(product.getCategoryId())) {
            throw new IllegalArgumentException("Unknown category: " + product.getCategoryId());
        }
        if (!suppliersById.containsKey(product.getSupplierId())) {
            throw new IllegalArgumentException("Unknown supplier: " + product.getSupplierId());
        }

        Product previous = productsBySku.get(product.getSku());
        if (previous != null) {
            categoryToSkus.getOrDefault(previous.getCategoryId(), new LinkedHashSet<>()).remove(previous.getSku());
            supplierToSkus.getOrDefault(previous.getSupplierId(), new LinkedHashSet<>()).remove(previous.getSku());
        }

        productsBySku.put(product.getSku(), product);
        categoryToSkus.computeIfAbsent(product.getCategoryId(), ignored -> new LinkedHashSet<>()).add(product.getSku());
        supplierToSkus.computeIfAbsent(product.getSupplierId(), ignored -> new LinkedHashSet<>()).add(product.getSku());
    }

    public synchronized void removeProduct(String sku) {
        requireText(sku, "SKU is required.");
        Product removed = productsBySku.remove(sku);
        quantityBySku.remove(sku);
        if (removed == null) {
            return;
        }
        categoryToSkus.getOrDefault(removed.getCategoryId(), new LinkedHashSet<>()).remove(sku);
        supplierToSkus.getOrDefault(removed.getSupplierId(), new LinkedHashSet<>()).remove(sku);
    }

    public synchronized void receiveStock(String sku, int quantity) {
        validateStockInput(sku, quantity);
        ensureProductExists(sku);
        quantityBySku.put(sku, currentQuantity(sku) + quantity);
    }

    public synchronized void issueStock(String sku, int quantity) throws InsufficientStockException {
        validateStockInput(sku, quantity);
        ensureProductExists(sku);

        int current = currentQuantity(sku);
        if (quantity > current) {
            throw new InsufficientStockException(sku, current, quantity);
        }
        quantityBySku.put(sku, current - quantity);
    }

    public synchronized List<Product> getProducts() {
        return List.copyOf(productsBySku.values());
    }

    public synchronized Product getProduct(String sku) {
        return productsBySku.get(sku);
    }

    public synchronized List<Product> getProductsByCategory(String categoryId) {
        return categoryToSkus.getOrDefault(categoryId, Set.of()).stream()
            .map(productsBySku::get)
            .filter(product -> product != null)
            .collect(Collectors.toList());
    }

    public synchronized List<Product> getProductsBySupplier(String supplierId) {
        return supplierToSkus.getOrDefault(supplierId, Set.of()).stream()
            .map(productsBySku::get)
            .filter(product -> product != null)
            .collect(Collectors.toList());
    }

    public synchronized List<Category> getCategories() {
        return List.copyOf(categoriesById.values());
    }

    public synchronized List<Supplier> getSuppliers() {
        return List.copyOf(suppliersById.values());
    }

    public synchronized List<Product> getLowStockProducts() {
        return productsBySku.values().stream()
            .filter(product -> currentQuantity(product.getSku()) <= product.getReorderThreshold())
            .sorted((left, right) -> Integer.compare(currentQuantity(left.getSku()), currentQuantity(right.getSku())))
            .collect(Collectors.toList());
    }

    public synchronized Map<String, Set<String>> getCategoryIndexSnapshot() {
        return snapshotIndex(categoryToSkus);
    }

    public synchronized Map<String, Set<String>> getSupplierIndexSnapshot() {
        return snapshotIndex(supplierToSkus);
    }

    public synchronized String formatProductRow(Product product) {
        int quantity = currentQuantity(product.getSku());
        Category category = categoriesById.get(product.getCategoryId());
        Supplier supplier = suppliersById.get(product.getSupplierId());
        return String.format(
            "%s | %-18s | category=%s | supplier=%s | stock=%d | reorder=%d | type=%s%s",
            product.getSku(),
            product.getName(),
            category == null ? product.getCategoryId() : category.getName(),
            supplier == null ? product.getSupplierId() : supplier.getName(),
            quantity,
            product.getReorderThreshold(),
            product.getDisplayType(),
            quantity <= product.getReorderThreshold() ? " | LOW STOCK" : ""
        );
    }

    public synchronized void exportSnapshot(Path path) {
        try {
            Path parent = path.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            InventorySnapshot snapshot = InventorySnapshot.fromService(this);
            SnapshotIO.write(path, snapshot);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to export snapshot: " + ex.getMessage(), ex);
        }
    }

    public synchronized void importSnapshot(Path path) {
        try {
            InventorySnapshot snapshot = SnapshotIO.read(path);
            clear();
            for (Category category : snapshot.categories()) {
                addCategory(category);
            }
            for (Supplier supplier : snapshot.suppliers()) {
                addSupplier(supplier);
            }
            for (Product product : snapshot.products()) {
                registerProduct(product, snapshot.quantityBySku().getOrDefault(product.getSku(), 0));
            }
        } catch (IOException | ClassNotFoundException ex) {
            throw new IllegalStateException("Unable to import snapshot: " + ex.getMessage(), ex);
        }
    }

    public synchronized void seedDemoData() {
        clear();
        addCategory(new DepartmentCategory("ELEC", "Electronics", "Devices and accessories"));
        addCategory(new DepartmentCategory("GROC", "Groceries", "Fast moving consumer goods"));
        addSupplier(new Supplier("SUP-01", "Northwave Traders", "orders@northwave.example"));
        addSupplier(new Supplier("SUP-02", "FreshRoute", "sales@freshroute.example"));
        registerProduct(new StandardProduct("SKU-1001", "Wireless Mouse", "ELEC", "SUP-01", 10), 42);
        registerProduct(new PerishableProduct("SKU-2001", "Organic Milk", "GROC", "SUP-02", 25, 14), 18);
        registerProduct(new StandardProduct("SKU-1002", "USB-C Cable", "ELEC", "SUP-01", 15), 9);
    }

    synchronized Map<String, Integer> quantitySnapshot() {
        return new LinkedHashMap<>(quantityBySku);
    }

    synchronized Collection<Product> productSnapshot() {
        return new ArrayList<>(productsBySku.values());
    }

    synchronized Collection<Category> categorySnapshot() {
        return new ArrayList<>(categoriesById.values());
    }

    synchronized Collection<Supplier> supplierSnapshot() {
        return new ArrayList<>(suppliersById.values());
    }

    private void clear() {
        productsBySku.clear();
        quantityBySku.clear();
        categoriesById.clear();
        suppliersById.clear();
        categoryToSkus.clear();
        supplierToSkus.clear();
    }

    private int currentQuantity(String sku) {
        return quantityBySku.getOrDefault(sku, 0);
    }

    private void ensureProductExists(String sku) {
        if (!productsBySku.containsKey(sku)) {
            throw new IllegalArgumentException("Unknown SKU: " + sku);
        }
    }

    private static void validateStockInput(String sku, int quantity) {
        requireText(sku, "SKU is required.");
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero.");
        }
    }

    private static void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private static Map<String, Set<String>> snapshotIndex(Map<String, Set<String>> source) {
        Map<String, Set<String>> snapshot = new LinkedHashMap<>();
        for (Map.Entry<String, Set<String>> entry : source.entrySet()) {
            snapshot.put(entry.getKey(), Set.copyOf(entry.getValue()));
        }
        return snapshot;
    }
}