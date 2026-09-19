package ps107.inventory.exception;

public final class InsufficientStockException extends Exception {
    public InsufficientStockException(String sku, int available, int requested) {
        super("Insufficient stock for SKU " + sku + ": available=" + available + ", requested=" + requested);
    }
}