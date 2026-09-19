package ps107.inventory.model;

import java.io.Serializable;

public abstract class Product implements Serializable {
    private static final long serialVersionUID = 1L;

    private final String sku;
    private final String name;
    private final String categoryId;
    private final String supplierId;
    private final int reorderThreshold;

    protected Product(String sku, String name, String categoryId, String supplierId, int reorderThreshold) {
        this.sku = sku;
        this.name = name;
        this.categoryId = categoryId;
        this.supplierId = supplierId;
        this.reorderThreshold = reorderThreshold;
    }

    public String getSku() {
        return sku;
    }

    public String getName() {
        return name;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public String getSupplierId() {
        return supplierId;
    }

    public int getReorderThreshold() {
        return reorderThreshold;
    }

    public abstract String getDisplayType();
}