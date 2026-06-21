import { useState, useMemo } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import type { Product, SortField, SortOrder } from "@/types/inventory";
import LoginScreen from "@/components/LoginScreen";
import StatsCards from "@/components/StatsCards";
import ProductTable from "@/components/ProductTable";
import ProductFormDialog from "@/components/ProductFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  LogOut,
  AlertTriangle,
} from "lucide-react";

const LOW_STOCK_THRESHOLD = 10;

const Dashboard = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    sortProducts,
    getLowStock,
    totalValue,
    totalItems,
    productCount,
  } = useInventory();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

  const lowStock = getLowStock(LOW_STOCK_THRESHOLD);

  const displayProducts = useMemo(() => {
    let list = sortProducts(sortField, sortOrder);
    if (showLowStock) {
      list = list.filter((p) => p.quantity <= LOW_STOCK_THRESHOLD);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.id.toString().includes(q)
      );
    }
    return list;
  }, [products, sortField, sortOrder, search, showLowStock, sortProducts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Inventory<span className="text-gradient-brand">Pro</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Signed in as <span className="font-mono text-foreground/80">{user}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl p-4 space-y-6">
        {/* Stats */}
        <StatsCards
          productCount={productCount}
          totalValue={totalValue}
          totalItems={totalItems}
          lowStockCount={lowStock.length}
        />

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, category, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showLowStock ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLowStock(!showLowStock)}
              className={showLowStock ? "" : ""}
            >
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              Low Stock ({lowStock.length})
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Table */}
        <ProductTable
          products={displayProducts}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          onEdit={setEditProduct}
          onDelete={deleteProduct}
        />

        {/* Product count */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Showing {displayProducts.length} of {productCount} product{productCount !== 1 ? "s" : ""}
        </p>
      </main>

      {/* Add dialog */}
      <ProductFormDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(data) => addProduct(data)}
      />

      {/* Edit dialog */}
      {editProduct && (
        <ProductFormDialog
          open={!!editProduct}
          onClose={() => setEditProduct(null)}
          product={editProduct}
          onSubmit={(data) => updateProduct(editProduct.id, data)}
        />
      )}
    </div>
  );
};

export default Dashboard;
