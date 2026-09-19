package ps107.inventory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import ps107.inventory.exception.InsufficientStockException;
import ps107.inventory.model.DepartmentCategory;
import ps107.inventory.model.PerishableProduct;
import ps107.inventory.model.StandardProduct;
import ps107.inventory.model.Supplier;

class InventoryServiceTest {
    @Test
    void issueStockRejectsNegativeInventory() {
        InventoryService inventory = new InventoryService();
        inventory.addCategory(new DepartmentCategory("ELEC", "Electronics", "Devices"));
        inventory.addSupplier(new Supplier("SUP-01", "Northwave", "orders@example.com"));
        inventory.registerProduct(new StandardProduct("SKU-1", "Mouse", "ELEC", "SUP-01", 5), 2);

        InsufficientStockException exception = assertThrows(
            InsufficientStockException.class,
            () -> inventory.issueStock("SKU-1", 3)
        );

        assertEquals("Insufficient stock for SKU SKU-1: available=2, requested=3", exception.getMessage());
        assertEquals(1, inventory.getProducts().size());
    }

    @Test
    void lowStockThresholdIncludesAtOrBelowReorderLevel() {
        InventoryService inventory = new InventoryService();
        inventory.seedDemoData();

        assertEquals(2, inventory.getLowStockProducts().size());
    }

    @Test
    void reverseIndexesStayInSyncWhenProductChanges() {
        InventoryService inventory = new InventoryService();
        inventory.addCategory(new DepartmentCategory("ELEC", "Electronics", "Devices"));
        inventory.addSupplier(new Supplier("SUP-01", "Northwave", "orders@example.com"));
        inventory.registerProduct(new StandardProduct("SKU-1", "Mouse", "ELEC", "SUP-01", 5), 2);

        inventory.updateProduct(new PerishableProduct("SKU-1", "Mouse Pro", "ELEC", "SUP-01", 4, 30));

        assertEquals(1, inventory.getCategoryIndexSnapshot().get("ELEC").size());
        assertEquals(1, inventory.getSupplierIndexSnapshot().get("SUP-01").size());

        inventory.removeProduct("SKU-1");

        assertFalse(inventory.getCategoryIndexSnapshot().get("ELEC").contains("SKU-1"));
        assertFalse(inventory.getSupplierIndexSnapshot().get("SUP-01").contains("SKU-1"));
    }

    @Test
    void snapshotRoundTripPreservesCatalogAndInventory() throws Exception {
        InventoryService inventory = new InventoryService();
        inventory.seedDemoData();

        Path tempFile = Files.createTempFile("ps107", ".ser");
        inventory.exportSnapshot(tempFile);

        InventoryService restored = new InventoryService();
        restored.importSnapshot(tempFile);

        assertEquals(inventory.getProducts().size(), restored.getProducts().size());
        assertEquals(inventory.getLowStockProducts().size(), restored.getLowStockProducts().size());
    }
}