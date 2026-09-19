class InsufficientStockError(Exception):
    """Raised when trying to issue more stock than currently available."""
    def __init__(self, sku: str, current_stock: int, requested_qty: int):
        self.sku = sku
        self.current_stock = current_stock
        self.requested_qty = requested_qty
        super().__init__(
            f"Insufficient stock for SKU '{sku}': requested {requested_qty}, but only {current_stock} available."
        )
