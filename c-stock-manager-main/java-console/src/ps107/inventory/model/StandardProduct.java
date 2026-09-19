package ps107.inventory.model;

public final class StandardProduct extends Product {
    private static final long serialVersionUID = 1L;

    public StandardProduct(String sku, String name, String categoryId, String supplierId, int reorderThreshold) {
        super(sku, name, categoryId, supplierId, reorderThreshold);
    }

    @Override
    public String getDisplayType() {
        return "standard";
    }
}