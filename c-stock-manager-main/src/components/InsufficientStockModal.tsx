import { useState, useEffect } from "react";
import { AlertTriangle, X, Check, ArrowRight } from "lucide-react";
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
import type { ParsedVoiceIntent } from "@/types/inventory";

interface InsufficientStockModalProps {
  open: boolean;
  intent: ParsedVoiceIntent | null;
  onClose: () => void;
  onConfirmAdjusted: (adjustedIntent: ParsedVoiceIntent) => void;
}

export const InsufficientStockModal = ({
  open,
  intent,
  onClose,
  onConfirmAdjusted,
}: InsufficientStockModalProps) => {
  const [isChangingQty, setIsChangingQty] = useState(false);
  const [adjustedQuantity, setAdjustedQuantity] = useState<string>("");

  useEffect(() => {
    if (intent?.insufficientStock) {
      setAdjustedQuantity(intent.insufficientStock.availableTradeUnits.toString());
      setIsChangingQty(false);
    }
  }, [intent]);

  if (!intent || !intent.insufficientStock) return null;

  const { availableTradeUnits, requestedTradeUnits, unitLabel } = intent.insufficientStock;
  const productName = intent.matchedProduct?.name || intent.productName || "Item";

  const handleConfirmMaxAvailable = () => {
    const qty = availableTradeUnits;
    if (qty <= 0) {
      onClose();
      return;
    }
    const adjusted: ParsedVoiceIntent = {
      ...intent,
      quantity: qty,
      insufficientStock: undefined,
      feedbackMessage: `Sold all available ${qty} ${unitLabel} of ${productName}.`,
    };
    onConfirmAdjusted(adjusted);
    onClose();
  };

  const handleConfirmCustom = () => {
    const qty = parseFloat(adjustedQuantity);
    if (isNaN(qty) || qty <= 0) return;
    if (qty > availableTradeUnits) {
      window.alert(`Quantity cannot exceed available stock (${availableTradeUnits} ${unitLabel})`);
      return;
    }
    const adjusted: ParsedVoiceIntent = {
      ...intent,
      quantity: qty,
      insufficientStock: undefined,
      feedbackMessage: `Sold ${qty} ${unitLabel} of ${productName}.`,
    };
    onConfirmAdjusted(adjusted);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-2 border-rose-500/50 text-foreground sm:max-w-md shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-rose-300">
                ⚠️ Not Enough Stock
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Stock Protection Guard — preventing negative inventory
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Warning Message Card */}
        <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 p-4 space-y-3">
          <p className="text-sm font-semibold text-rose-200 leading-relaxed">
            You have only <span className="font-bold text-amber-300 underline">{availableTradeUnits} {unitLabel}</span> of{" "}
            <span className="font-bold text-white">{productName}</span> in stock.
          </p>
          <p className="text-xs text-rose-300/80">
            You asked to remove <span className="font-bold text-rose-400">{requestedTradeUnits} {unitLabel}</span>.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-rose-500/20">
            <div className="bg-slate-900/80 p-2.5 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Available Stock:</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {availableTradeUnits} {unitLabel}
              </span>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg">
              <span className="text-muted-foreground block text-[11px]">Requested:</span>
              <span className="text-base font-bold text-rose-400 font-mono line-through">
                {requestedTradeUnits} {unitLabel}
              </span>
            </div>
          </div>
        </div>

        {isChangingQty ? (
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs text-foreground font-semibold">
                Enter adjusted quantity to sell (Max: {availableTradeUnits} {unitLabel}):
              </Label>
              <Input
                type="number"
                min="0.1"
                max={availableTradeUnits}
                step="any"
                value={adjustedQuantity}
                onChange={(e) => setAdjustedQuantity(e.target.value)}
                className="bg-slate-950 border-emerald-500/40 text-foreground font-mono text-base"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingQty(false)}
                className="flex-1 text-xs"
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmCustom}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Confirm {adjustedQuantity} {unitLabel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {availableTradeUnits > 0 && (
              <Button
                onClick={handleConfirmMaxAvailable}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs h-10 shadow-md"
              >
                <Check className="mr-1.5 h-4 w-4" />
                Sell Available {availableTradeUnits} {unitLabel} Instead
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-border hover:bg-slate-800 text-xs"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsChangingQty(true)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-foreground text-xs"
              >
                <ArrowRight className="mr-1 h-3.5 w-3.5" />
                Change Quantity
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InsufficientStockModal;
