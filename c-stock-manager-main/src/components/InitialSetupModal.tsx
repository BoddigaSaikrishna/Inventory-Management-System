import { useState } from "react";
import { Mic, MicOff, PackageCheck, Sparkles, Trash2, Plus, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Product, LanguageCode, TradeUnitKey, BaseUnit } from "@/types/inventory";
import { TRADE_UNITS } from "@/lib/tradeUnits";
import { parseCompoundVoiceIntents } from "@/lib/nlpParser";
import { speechService, isSpeechRecognitionSupported } from "@/lib/speech";

interface InitialSetupModalProps {
  open: boolean;
  existingProducts: Product[];
  currentLanguage: LanguageCode;
  onClose: () => void;
  onSaveSetup: (items: Array<{
    name: string;
    category: string;
    quantity: number; // base units
    baseUnit: BaseUnit;
    tradeUnit: TradeUnitKey;
    tradeUnitSize: number;
    price: number;
    minStockThreshold: number;
    reorderQuantity: number;
  }>) => void;
  onResetDemo: () => void;
}

interface DraftItem {
  id: string;
  name: string;
  category: string;
  tradeQuantity: number;
  tradeUnit: TradeUnitKey;
  reorderQuantity: number;
  price: number;
}

const DEMO_ITEMS_STRING = "Rice 135 bags, sugar 50 kg, eggs 13 dozens, oil 20 cartons, biscuits 30 boxes, dal 25 kg";

export const InitialSetupModal = ({
  open,
  existingProducts,
  currentLanguage,
  onClose,
  onSaveSetup,
  onResetDemo,
}: InitialSetupModalProps) => {
  const [spokenText, setSpokenText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  const handleParseString = (text: string) => {
    setSpokenText(text);
    if (!text.trim()) {
      setDraftItems([]);
      return;
    }

    const compoundIntents = parseCompoundVoiceIntents(text, existingProducts, currentLanguage);
    const parsedDrafts: DraftItem[] = compoundIntents.map((item, idx) => {
      const unitKey = item.tradeUnit || "bag";
      const unitConfig = TRADE_UNITS[unitKey] || TRADE_UNITS.bag;
      const qty = item.quantity || 1;

      // Smart categories & pricing defaults based on item name
      const lower = (item.productName || item.rawText).toLowerCase();
      let category = "Groceries";
      let price = 100;
      let reorder = Math.max(2, Math.round(qty * 0.15));

      if (lower.includes("rice") || lower.includes("chawal")) {
        category = "Grains & Staples";
        price = 1200;
        reorder = 20;
      } else if (lower.includes("sugar") || lower.includes("chini") || lower.includes("cheeni")) {
        category = "Groceries";
        price = 45;
        reorder = 10;
      } else if (lower.includes("egg") || lower.includes("ande")) {
        category = "Dairy & Eggs";
        price = 84;
        reorder = 5;
      } else if (lower.includes("oil") || lower.includes("tel")) {
        category = "Oils & Ghee";
        price = 1800;
        reorder = 5;
      } else if (lower.includes("biscuit") || lower.includes("parle") || lower.includes("good day")) {
        category = "Snacks & Packaged";
        price = 360;
        reorder = 8;
      } else if (lower.includes("dal") || lower.includes("dhal") || lower.includes("pulse")) {
        category = "Pulses & Dals";
        price = 125;
        reorder = 5;
      }

      return {
        id: `draft_${Date.now()}_${idx}`,
        name: item.productName || `Item ${idx + 1}`,
        category,
        tradeQuantity: qty,
        tradeUnit: unitKey,
        reorderQuantity: reorder,
        price,
      };
    });

    setDraftItems(parsedDrafts);
  };

  const handleToggleMic = () => {
    if (!isSpeechRecognitionSupported()) {
      window.alert("Speech recognition not supported in this browser. Please type the list below.");
      return;
    }

    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      setSpokenText("");
      speechService.startListening(currentLanguage, {
        onStart: () => setIsListening(true),
        onResult: (transcript, isFinal) => {
          setSpokenText(transcript);
          if (isFinal) {
            setIsListening(false);
            handleParseString(transcript);
          }
        },
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false),
      });
    }
  };

  const handleRemoveDraft = (id: string) => {
    setDraftItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSaveAll = () => {
    if (draftItems.length === 0) return;

    const payload = draftItems.map((item) => {
      const unitConfig = TRADE_UNITS[item.tradeUnit] || TRADE_UNITS.bag;
      const baseUnit = unitConfig.baseUnit;
      const tradeUnitSize = unitConfig.defaultMultiplier;
      const baseQuantity = item.tradeQuantity * tradeUnitSize;
      const minStockThreshold = item.reorderQuantity * tradeUnitSize;

      return {
        name: item.name,
        category: item.category,
        quantity: baseQuantity,
        baseUnit,
        tradeUnit: item.tradeUnit,
        tradeUnitSize,
        price: item.price,
        minStockThreshold,
        reorderQuantity: item.reorderQuantity,
      };
    });

    onSaveSetup(payload);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border border-emerald-500/30 text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                Initial Inventory Setup
                <span className="text-xs bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  Zero Typing
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tap and tell us what you have in your shop — speak all items together.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Voice Input Wizard Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-indigo-950/40 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Speak All Your Items
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleParseString(DEMO_ITEMS_STRING)}
              className="text-[11px] h-7 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              ⚡ Load Demo Phrase
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleToggleMic}
              size="icon"
              className={`h-14 w-14 rounded-full shrink-0 shadow-lg transition-all ${
                isListening
                  ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/30"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/20"
              }`}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            <div className="flex-1 space-y-1">
              <Input
                value={spokenText}
                onChange={(e) => handleParseString(e.target.value)}
                placeholder='e.g., "Rice 135 bags, sugar 50 kg, eggs 13 dozens, oil 20 cartons"'
                className="bg-slate-950 border-border text-sm text-foreground h-11"
              />
              <p className="text-[11px] text-muted-foreground">
                {isListening
                  ? "🎙️ Listening... Speak your items clearly"
                  : "Tap mic and speak, or type/edit the sentence above"}
              </p>
            </div>
          </div>
        </div>

        {/* Parsed Items Preview Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground">
              Detected Items ({draftItems.length})
            </span>
            {draftItems.length > 0 && (
              <span className="text-emerald-400 font-medium text-[11px]">
                Review items before saving to store
              </span>
            )}
          </div>

          {draftItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center bg-slate-950/40">
              <p className="text-xs text-muted-foreground">
                No items detected yet. Speak or type your stock above, or load the Sai General Stores demo.
              </p>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onResetDemo}
                  className="text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Directly Seed Sai General Stores Catalog
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-slate-950/80 overflow-hidden divide-y divide-border/60 max-h-60 overflow-y-auto">
              {draftItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Category: {item.category} • Reorder Alert: at {item.reorderQuantity} {item.tradeUnit}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {item.tradeQuantity} {TRADE_UNITS[item.tradeUnit]?.label || item.tradeUnit}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDraft(item.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-muted-foreground">
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {draftItems.length > 0 && (
              <Button
                size="sm"
                onClick={handleSaveAll}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md"
              >
                <Check className="mr-1.5 h-4 w-4" />
                Confirm & Save {draftItems.length} Items to Store
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InitialSetupModal;
