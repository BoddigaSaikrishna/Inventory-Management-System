import { useState, useEffect } from "react";
import { Check, Edit3, Volume2, AlertCircle, Package, ArrowRight } from "lucide-react";
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
import { Product, ParsedVoiceIntent, TradeUnitKey, ActionType } from "@/types/inventory";
import { TRADE_UNITS } from "@/lib/tradeUnits";

interface VoiceCommandModalProps {
  open: boolean;
  intent: ParsedVoiceIntent | null;
  products: Product[];
  onClose: () => void;
  onConfirm: (finalIntent: ParsedVoiceIntent) => void;
  onSpeakResponse: (text: string) => void;
}

const VoiceCommandModal = ({
  open,
  intent,
  products,
  onClose,
  onConfirm,
  onSpeakResponse,
}: VoiceCommandModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [action, setAction] = useState<ActionType>("ADD");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [tradeUnit, setTradeUnit] = useState<TradeUnitKey>("bag");
  const [rawText, setRawText] = useState<string>("");

  const noProductMatched = !intent?.matchedProduct;

  useEffect(() => {
    if (intent) {
      setAction(intent.action !== "UNKNOWN" ? intent.action : "ADD");
      // IMPORTANT: Do NOT default to products[0] when no product matched —
      // that causes the Basmati Rice default bug. Leave null so user must pick.
      setSelectedProductId(intent.matchedProduct ? intent.matchedProduct.id : null);
      setQuantity(intent.quantity ? intent.quantity.toString() : "1");
      setTradeUnit(intent.tradeUnit || (intent.matchedProduct?.tradeUnit ?? "bag"));
      setRawText(intent.rawText);
      // Force editing mode open when no product was recognized
      setIsEditing(!intent.matchedProduct);
    }
  }, [intent, products]);

  if (!intent) return null;

  // Never fall back to products[0] — only use what the user explicitly selected or what NLP matched
  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? intent.matchedProduct ?? null;

  const handleConfirm = () => {
    // Block execution if no product is selected
    if (!selectedProduct) return;

    const qtyNum = parseFloat(quantity) || 1;
    const unitSize = selectedProduct.tradeUnitSize ?? 1;
    const baseQty = qtyNum * unitSize;

    const unitLabel = TRADE_UNITS[tradeUnit]?.hindiLabel.split(" ")[0] || tradeUnit;
    const prodName = selectedProduct.name;

    let feedback = "";
    if (action === "ADD") feedback = `${qtyNum} ${unitLabel} ${prodName} added to stock.`;
    else if (action === "REMOVE") feedback = `${qtyNum} ${unitLabel} ${prodName} deducted from stock.`;
    else if (action === "SET") feedback = `${prodName} stock set to ${qtyNum} ${unitLabel}.`;
    else feedback = `Confirmed action on ${prodName}.`;

    const finalIntent: ParsedVoiceIntent = {
      rawText: rawText || intent.rawText,
      action,
      matchedProduct: selectedProduct,
      productName: selectedProduct.name,
      quantity: qtyNum,
      tradeUnit,
      baseQuantityCalculated: baseQty,
      confidence: 1.0,
      language: intent.language,
      feedbackMessage: feedback,
    };

    onSpeakResponse(feedback);
    onConfirm(finalIntent);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border border-emerald-500/30 text-foreground sm:max-w-md shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Confirm Voice Action
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review or correct parsed voice command before updating inventory.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Transcribed Speech Snippet */}
        <div className="rounded-xl bg-slate-950/70 border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Spoken Transcript
          </p>
          <p className="text-sm font-medium text-emerald-300 mt-0.5 italic">
            "{rawText}"
          </p>
        </div>

        {/* Parsed Summary Card */}
        {!isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-emerald-950/30 border border-emerald-500/20 p-4">
              <div className="space-y-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  action === "ADD" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                  action === "REMOVE" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                  "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}>
                  {action === "ADD" ? "➕ ADD STOCK" : action === "REMOVE" ? "➖ REMOVE STOCK" : "⚙️ SET STOCK"}
                </span>
                <p className="text-lg font-bold text-foreground mt-1">
                  {selectedProduct?.name || "Product"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Trade Unit: <span className="font-semibold text-emerald-300">{quantity} {TRADE_UNITS[tradeUnit]?.label}</span>
                  {selectedProduct && selectedProduct.tradeUnitSize > 1 && (
                    <span> ({parseFloat(quantity) * selectedProduct.tradeUnitSize} {selectedProduct.baseUnit})</span>
                  )}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="mr-1 h-3.5 w-3.5" />
                Edit
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedProduct}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold disabled:opacity-50"
              >
                <Check className="mr-1.5 h-4 w-4" />
                Confirm & Execute
              </Button>
            </div>
          </div>
        ) : (
          /* Editable Form — shown automatically when product could not be identified */
          <div className="space-y-3 pt-1">

            {/* Amber banner when no product was auto-matched */}
            {noProductMatched && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-950/40 border border-amber-500/30 px-3 py-2.5 text-xs text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Product not recognized from speech.</strong> Please select the correct product from the dropdown below.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Action</Label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as ActionType)}
                  className="w-full h-9 rounded-md border border-border bg-slate-950 px-2.5 text-xs text-foreground"
                >
                  <option value="ADD">➕ Add Stock (Aaya)</option>
                  <option value="REMOVE">➖ Deduct Stock (Becha)</option>
                  <option value="SET">⚙️ Set Fixed Stock</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className={`text-xs font-semibold ${!selectedProductId ? "text-amber-400" : "text-muted-foreground"}`}>
                  {!selectedProductId ? "⚠️ Select Product (Required)" : "Select Product"}
                </Label>
                <select
                  value={selectedProductId ?? ""}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className={`w-full h-9 rounded-md border px-2.5 text-xs text-foreground bg-slate-950 ${
                    !selectedProductId
                      ? "border-amber-500/60 ring-1 ring-amber-500/40"
                      : "border-border"
                  }`}
                >
                  <option value="" disabled>
                    — Select a product —
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-slate-950 border-border text-foreground font-mono h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Trade Unit</Label>
                <select
                  value={tradeUnit}
                  onChange={(e) => setTradeUnit(e.target.value as TradeUnitKey)}
                  className="w-full h-9 rounded-md border border-border bg-slate-950 px-2.5 text-xs text-foreground"
                >
                  {Object.entries(TRADE_UNITS).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={!selectedProductId}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold disabled:opacity-50"
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                {selectedProductId ? "Save & Execute" : "Select Product First"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VoiceCommandModal;
