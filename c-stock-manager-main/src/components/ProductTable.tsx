import { useState } from "react";
import type { Product, SortField, SortOrder } from "@/types/inventory";
import { formatStockInTradeUnits, TRADE_UNITS } from "@/lib/tradeUnits";
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProductTableProps {
  products: Product[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const ProductTable = ({ products, sortField, sortOrder, onSort, onEdit, onDelete }: ProductTableProps) => {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    return sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowDown className="h-3.5 w-3.5 text-emerald-400" />;
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/20 bg-gradient-to-b from-slate-900/60 to-slate-950/60 py-20 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <Box className="h-8 w-8 text-emerald-400/60" />
        </div>
        <p className="text-lg font-bold text-foreground">Your inventory is empty</p>
        <p className="text-sm text-muted-foreground mt-1">
          आपकी दुकान का स्टॉक यहाँ दिखेगा • మీ స్టాక్ ఇక్కడ కనిపిస్తుంది
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-left max-w-md w-full">
          <div className="bg-slate-800/60 border border-border rounded-xl p-3">
            <p className="font-semibold text-emerald-400 mb-1">🎙️ Voice</p>
            <p className="text-muted-foreground">Tap the mic and say:<br /><span className="text-foreground italic">"Add 5 bags rice"</span></p>
          </div>
          <div className="bg-slate-800/60 border border-border rounded-xl p-3">
            <p className="font-semibold text-emerald-400 mb-1">➕ Manual</p>
            <p className="text-muted-foreground">Click <strong className="text-foreground">Add Product</strong> button above to create your first item.</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-slate-900/80 shadow-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-slate-950/60 text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">
                <button onClick={() => onSort("id")} className="inline-flex items-center gap-1 hover:text-foreground">
                  ID <SortIcon field="id" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                <button onClick={() => onSort("name")} className="inline-flex items-center gap-1 hover:text-foreground">
                  Item Name <SortIcon field="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-right font-semibold">
                <button onClick={() => onSort("quantity")} className="inline-flex items-center gap-1 hover:text-foreground">
                  Stock Level (Trade Units) <SortIcon field="quantity" />
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">
                <button onClick={() => onSort("price")} className="inline-flex items-center gap-1 hover:text-foreground">
                  Price / Trade Unit <SortIcon field="price" />
                </button>
              </th>
              <th className="px-4 py-3 text-right font-semibold">Total Valuation</th>
              <th className="px-4 py-3 text-center w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {products.map((p) => {
              const isLowStock = p.quantity <= p.minStockThreshold;
              const unitConfig = TRADE_UNITS[p.tradeUnit];
              const stockFormatted = formatStockInTradeUnits(
                p.quantity,
                p.baseUnit,
                p.tradeUnit,
                p.tradeUnitSize
              );
              const tradeUnitsCount = p.tradeUnitSize > 0 ? p.quantity / p.tradeUnitSize : p.quantity;
              const totalProductValuation = p.price * tradeUnitsCount;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{p.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{p.name}</span>
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-md bg-secondary/80 px-2 py-0.5 text-xs text-secondary-foreground">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={`font-bold ${isLowStock ? "text-amber-400" : "text-emerald-400"}`}>
                      {stockFormatted}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground font-medium">
                    ₹{p.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    <span className="text-[10px] text-muted-foreground font-normal block">
                      per {unitConfig?.label || p.tradeUnit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                    ₹{totalProductValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(p)}>
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-slate-900 border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Product</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Are you sure you want to delete <strong className="text-foreground">{deleteTarget?.name}</strong> (#{deleteTarget?.id})?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteTarget) { onDelete(deleteTarget.id); setDeleteTarget(null); } }} className="flex-1">Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductTable;
