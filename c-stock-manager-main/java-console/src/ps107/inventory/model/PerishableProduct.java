package ps107.inventory.model;

public final class PerishableProduct extends Product {
    private static final long serialVersionUID = 1L;

    private final int shelfLifeDays;

    public PerishableProduct(String sku, String name, String categoryId, String supplierId, int reorderThreshold, int shelfLifeDays) {
        super(sku, name, categoryId, supplierId, reorderThreshold);
        this.shelfLifeDays = shelfLifeDays;
    }

    public int getShelfLifeDays() {
        return shelfLifeDays;
    }

    @Override
    public String getDisplayType() {
        return "perishable";
    }
}