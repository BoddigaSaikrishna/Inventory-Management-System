import { useState } from "react";
import type { Product, SortField, SortOrder } from "@/types/inventory";
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
    return sortOrder === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-primary" /> : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  const columns: { label: string; field: SortField; align?: string }[] = [
    { label: "ID", field: "id" },
    { label: "Product Name", field: "name" },
    { label: "Category", field: "name" },
    { label: "Qty", field: "quantity", align: "text-right" },
    { label: "Price", field: "price", align: "text-right" },
  ];

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-muted-foreground">
        <p className="text-sm">No products found.</p>
        <p className="text-xs mt-1">Add your first product to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th key={col.label} className={`px-4 py-3 font-medium text-muted-foreground ${col.align ?? "text-left"}`}>
                  <button onClick={() => onSort(col.field)} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
                    {col.label}
                    <SortIcon field={col.field} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Value</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-center">Created</th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr
                key={p.id}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{p.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  <span className={p.quantity <= 10 ? "text-destructive font-semibold" : "text-foreground"}>
                    {p.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-foreground">
                  ₹{p.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  ₹{(p.price * p.quantity).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleDateString()}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Product</DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
