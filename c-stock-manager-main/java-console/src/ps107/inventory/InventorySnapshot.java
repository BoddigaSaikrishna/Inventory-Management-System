package ps107.inventory;

import java.io.Serializable;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import ps107.inventory.model.Category;
import ps107.inventory.model.Product;
import ps107.inventory.model.Supplier;

public record InventorySnapshot(
    List<Category> categories,
    List<Supplier> suppliers,
    List<Product> products,
    Map<String, Integer> quantityBySku
) implements Serializable {
    private static final long serialVersionUID = 1L;

    public InventorySnapshot {
        categories = List.copyOf(categories);
        suppliers = List.copyOf(suppliers);
        products = List.copyOf(products);
        quantityBySku = Map.copyOf(quantityBySku);
    }

    public static InventorySnapshot fromService(InventoryService service) {
        return new InventorySnapshot(
            List.copyOf(service.categorySnapshot()),
            List.copyOf(service.supplierSnapshot()),
            List.copyOf(service.productSnapshot()),
            new LinkedHashMap<>(service.quantitySnapshot())
        );
    }
}