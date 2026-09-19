import { useState, useMemo } from "react";
import type { Product, SortField, SortOrder, LowStockReminder } from "@/types/inventory";
import { formatStockInTradeUnits, TRADE_UNITS } from "@/lib/tradeUnits";
import {
  Package,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Search,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Mic,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Volume2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InventoryDashboardProps {
  products: Product[];
  reminders: LowStockReminder[];
  lowStockCount: number;
  outOfStockCount: number;
  totalItemsCount: number;
  todayUpdatesCount: number;
  onOpenInitialSetup: () => void;
  onOpenAddProduct: () => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: number) => void;
  onQuickAddStock: (p: Product) => void;
  onQuickSellStock: (p: Product) => void;
  onResetDemo: () => void;
  onSpeakAlerts: () => void;
}

type StockStatusFilter = "ALL" | "IN_STOCK" | "WATCH" | "LOW_STOCK" | "OUT_OF_STOCK";

export const InventoryDashboard = ({
  products,
  reminders,
  lowStockCount,
  outOfStockCount,
  totalItemsCount,
  todayUpdatesCount,
  onOpenInitialSetup,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickAddStock,
  onQuickSellStock,
  onResetDemo,
  onSpeakAlerts,
}: InventoryDashboardProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const getProductStatus = (p: Product): "OUT_OF_STOCK" | "LOW_STOCK" | "WATCH" | "IN_STOCK" => {
    if (p.quantity <= 0) return "OUT_OF_STOCK";
    if (p.quantity <= p.minStockThreshold) return "LOW_STOCK";
    // Watch status: within 25% above reorder threshold
    if (p.quantity <= p.minStockThreshold * 1.25) return "WATCH";
    return "IN_STOCK";
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.id.toString().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((p) => getProductStatus(p) === statusFilter);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "price") cmp = a.price - b.price;
      else if (sortField === "quantity") cmp = a.quantity - b.quantity;
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else cmp = a.id - b.id;
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [products, search, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 text-emerald-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-emerald-400" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Store Greeting & Tagline Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 p-5 rounded-2xl border border-emerald-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-black text-white tracking-tight">
              Good Morning, <span className="text-emerald-400">Sai General Stores</span>
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Stock
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 font-medium">
            "Speak your business. Manage your stock."
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {reminders.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSpeakAlerts}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs h-9"
            >
              <Volume2 className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              Listen to Shortages ({reminders.length})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onResetDemo}
            className="border-border text-muted-foreground hover:text-white text-xs h-9"
            title="Reset to Sai General Stores 6 core items"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset Demo Data
          </Button>

          <Button
            size="sm"
            onClick={onOpenAddProduct}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9 shadow-md"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Items */}
        <div className="rounded-2xl border border-border bg-slate-900/80 p-4 shadow-md hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Items
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-foreground mt-2 font-mono">
            {totalItemsCount}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            In store catalog
          </span>
        </div>

        {/* Low Stock */}
        <div
          onClick={() => setStatusFilter("LOW_STOCK")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-md transition-all ${
            lowStockCount > 0
              ? "border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/30"
              : "border-border bg-slate-900/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Low Stock
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                lowStockCount > 0
                  ? "bg-amber-500/20 text-amber-400 animate-pulse"
                  : "bg-slate-800 text-muted-foreground"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p
            className={`text-2xl md:text-3xl font-black mt-2 font-mono ${
              lowStockCount > 0 ? "text-amber-400" : "text-foreground"
            }`}
          >
            {lowStockCount}
          </p>
          <span className="text-[11px] text-amber-400/80 mt-0.5 block">
            {lowStockCount > 0 ? "Needs reorder soon" : "Stock healthy"}
          </span>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setStatusFilter("OUT_OF_STOCK")}
          className={`cursor-pointer rounded-2xl border p-4 shadow-md transition-all ${
            outOfStockCount > 0
              ? "border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/30"
              : "border-border bg-slate-900/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Out of Stock
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                outOfStockCount > 0
                  ? "bg-rose-500/20 text-rose-400 animate-bounce"
                  : "bg-slate-800 text-muted-foreground"
              }`}
            >
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <p
            className={`text-2xl md:text-3xl font-black mt-2 font-mono ${
              outOfStockCount > 0 ? "text-rose-400" : "text-foreground"
            }`}
          >
            {outOfStockCount}
          </p>
          <span className="text-[11px] text-rose-400/80 mt-0.5 block">
            {outOfStockCount > 0 ? "Action required" : "Zero empty items"}
          </span>
        </div>

        {/* Today's Updates */}
        <div className="rounded-2xl border border-border bg-slate-900/80 p-4 shadow-md hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Today's Updates
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-foreground mt-2 font-mono">
            {todayUpdatesCount}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Stock actions logged today
          </span>
        </div>
      </div>

      {/* Initial Voice Onboarding Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md shadow-emerald-500/20">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-1.5">
              Let's add what's currently in your store
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </h3>
            <p className="text-xs text-slate-300">
              Speak all your items in one go — e.g., <em>"Rice 135 bags, sugar 50 kg, eggs 13 dozens"</em>
            </p>
          </div>
        </div>

        <Button
          onClick={onOpenInitialSetup}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs md:text-sm h-11 px-5 rounded-xl shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Mic className="mr-2 h-4 w-4" />
          Tap & Tell Us What You Have
        </Button>
      </div>

      {/* Search, Filter Pills & Sorting Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-full font-bold transition-colors shrink-0 ${
                statusFilter === "ALL"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-900 border border-border text-muted-foreground hover:text-white"
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter("IN_STOCK")}
              className={`px-3 py-1.5 rounded-full font-bold transition-colors shrink-0 ${
                statusFilter === "IN_STOCK"
                  ? "bg-emerald-500/30 border border-emerald-400 text-emerald-300 shadow-sm"
                  : "bg-slate-900 border border-border text-muted-foreground hover:text-emerald-300"
              }`}
            >
              🟢 In Stock
            </button>
            <button
              onClick={() => setStatusFilter("WATCH")}
              className={`px-3 py-1.5 rounded-full font-bold transition-colors shrink-0 ${
                statusFilter === "WATCH"
                  ? "bg-yellow-500/30 border border-yellow-400 text-yellow-300 shadow-sm"
                  : "bg-slate-900 border border-border text-muted-foreground hover:text-yellow-300"
              }`}
            >
              🟡 Watch
            </button>
            <button
              onClick={() => setStatusFilter("LOW_STOCK")}
              className={`px-3 py-1.5 rounded-full font-bold transition-colors shrink-0 ${
                statusFilter === "LOW_STOCK"
                  ? "bg-rose-500/30 border border-rose-400 text-rose-300 shadow-sm"
                  : "bg-slate-900 border border-border text-muted-foreground hover:text-rose-300"
              }`}
            >
              🔴 Low Stock
            </button>
          </div>

          {/* Search Input */}
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-slate-900 border-border text-xs text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Catalog Display: Mobile Cards & Desktop Table */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center bg-slate-900/40">
          <p className="text-sm font-semibold text-muted-foreground">
            No products match the selected filter or search.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
            className="text-emerald-400 text-xs mt-1"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table (Hidden on small screens) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-slate-900/80 shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-950/60 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">
                    <button
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Item Name <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <button
                      onClick={() => handleSort("quantity")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Available Stock <SortIcon field="quantity" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Reorder Level</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <button
                      onClick={() => handleSort("price")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Price / Unit <SortIcon field="price" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center w-36">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProducts.map((p) => {
                  const status = getProductStatus(p);
                  const unitConfig = TRADE_UNITS[p.tradeUnit];
                  const stockFormatted = formatStockInTradeUnits(
                    p.quantity,
                    p.baseUnit,
                    p.tradeUnit,
                    p.tradeUnitSize
                  );
                  const reorderTrade = Number((p.minStockThreshold / (p.tradeUnitSize || 1)).toFixed(1));

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-foreground text-sm block">
                          {p.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          ID: #{p.id}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-secondary/80 px-2 py-0.5 text-xs text-secondary-foreground">
                          {p.category}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono">
                        <span
                          className={`font-bold text-sm ${
                            status === "OUT_OF_STOCK"
                              ? "text-rose-400 line-through"
                              : status === "LOW_STOCK"
                              ? "text-rose-400"
                              : status === "WATCH"
                              ? "text-yellow-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {stockFormatted}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {reorderTrade} {unitConfig?.label || p.tradeUnit}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        {status === "IN_STOCK" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                            🟢 In Stock
                          </span>
                        )}
                        {status === "WATCH" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-[11px] font-bold text-yellow-300">
                            🟡 Watch
                          </span>
                        )}
                        {status === "LOW_STOCK" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[11px] font-bold text-rose-400 animate-pulse">
                            🔴 Low Stock
                          </span>
                        )}
                        {status === "OUT_OF_STOCK" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-400">
                            ⚪ Out of Stock
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                        ₹{p.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onQuickAddStock(p)}
                            className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15"
                            title="Quick Add Stock (+1 Unit)"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onQuickSellStock(p)}
                            className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15"
                            title="Quick Sell Stock (-1 Unit)"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditProduct(p)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Edit Reorder Level & Product Details"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteProduct(p.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Visible only on mobile/tablet) */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((p) => {
              const status = getProductStatus(p);
              const unitConfig = TRADE_UNITS[p.tradeUnit];
              const stockFormatted = formatStockInTradeUnits(
                p.quantity,
                p.baseUnit,
                p.tradeUnit,
                p.tradeUnitSize
              );
              const reorderTrade = Number((p.minStockThreshold / (p.tradeUnitSize || 1)).toFixed(1));

              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-border bg-slate-900 p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-foreground">{p.name}</h4>
                      <span className="text-[11px] text-muted-foreground">
                        {p.category} • ID: #{p.id}
                      </span>
                    </div>

                    <div>
                      {status === "IN_STOCK" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                          🟢 In Stock
                        </span>
                      )}
                      {status === "WATCH" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-[10px] font-bold text-yellow-300">
                          🟡 Watch
                        </span>
                      )}
                      {status === "LOW_STOCK" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-bold text-rose-400 animate-pulse">
                          🔴 Low Stock
                        </span>
                      )}
                      {status === "OUT_OF_STOCK" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400">
                          ⚪ Out of Stock
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-2.5 text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Available:</span>
                      <span className={`text-sm font-bold ${status === "LOW_STOCK" || status === "OUT_OF_STOCK" ? "text-rose-400" : "text-emerald-400"}`}>
                        {stockFormatted}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Reorder Alert:</span>
                      <span className="text-sm font-bold text-slate-200">
                        {reorderTrade} {unitConfig?.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      ₹{p.price} / {unitConfig?.label || p.tradeUnit}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickAddStock(p)}
                        className="h-8 px-2.5 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickSellStock(p)}
                        className="h-8 px-2.5 text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                      >
                        <Minus className="h-3.5 w-3.5 mr-1" /> Sell
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEditProduct(p)}
                        className="h-8 w-8 text-muted-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryDashboard;
