import { useState } from "react";
import type { Product } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; quantity: number; price: number; category: string }) => void;
  product?: Product | null;
}

const CATEGORIES = ["Electronics", "Clothing", "Food & Beverages", "Tools", "Office Supplies", "Raw Materials", "Other"];

const ProductFormDialog = ({ open, onClose, onSubmit, product }: ProductFormDialogProps) => {
  const [name, setName] = useState(product?.name ?? "");
  const [quantity, setQuantity] = useState(product?.quantity?.toString() ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? CATEGORIES[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!product;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!quantity || parseInt(quantity) < 0) e.quantity = "Must be ≥ 0";
    if (!price || parseFloat(price) < 0) e.price = "Must be ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      quantity: parseInt(quantity),
      price: parseFloat(price),
      category,
    });
    if (!isEdit) { setName(""); setQuantity(""); setPrice(""); setCategory(CATEGORIES[0]); }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEdit ? "Update Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit ? `Editing product #${product.id}` : "Fill in details to add a product to inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Product Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wireless Mouse" className="bg-muted border-border" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Quantity</Label>
              <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="bg-muted border-border font-mono" />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Price (₹)</Label>
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="bg-muted border-border font-mono" />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {isEdit ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
