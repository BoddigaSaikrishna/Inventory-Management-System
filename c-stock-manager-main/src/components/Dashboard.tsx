import { useState, useMemo, useCallback } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type {
  Product,
  LanguageCode,
  ParsedVoiceIntent,
  TradeUnitKey,
} from "@/types/inventory";
import { parseCompoundVoiceIntents } from "@/lib/nlpParser";
import { speakText } from "@/lib/speech";
import { enqueueOfflineAction, type OfflineQueueEntry } from "@/lib/offlineQueue";
import { TRADE_UNITS } from "@/lib/tradeUnits";

// Components
import LoginScreen from "@/components/LoginScreen";
import InventoryDashboard from "@/components/InventoryDashboard";
import SalesDashboard from "@/components/SalesDashboard";
import ReorderSuggestions from "@/components/ReorderSuggestions";
import TransactionHistory from "@/components/TransactionHistory";
import PersistentVoiceAssistant from "@/components/PersistentVoiceAssistant";
import VoiceCommandModal from "@/components/VoiceCommandModal";
import InsufficientStockModal from "@/components/InsufficientStockModal";
import InitialSetupModal from "@/components/InitialSetupModal";
import ProductFormDialog from "@/components/ProductFormDialog";
import OfflineStatusBar from "@/components/OfflineStatusBar";

import { Button } from "@/components/ui/button";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  History,
  WifiOff,
  LogOut,
  RotateCcw,
  Sparkles,
} from "lucide-react";

type MainTab = "inventory" | "sales" | "reorder" | "history";

const Dashboard = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const {
    products,
    transactions,
    salesTransactions,
    reminders,
    addProduct,
    updateProduct,
    deleteProduct,
    setProductReorderLevel,
    executeVoiceIntent,
    lowStockProducts,
    outOfStockProducts,
    lowStockCount,
    outOfStockCount,
    totalItemsCount,
    todayUpdatesCount,
    resetToSaiStoreDemo,
    clearAllData,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<MainTab>("inventory");
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("hi-IN");

  // Voice & Modals State
  const [activeVoiceIntent, setActiveVoiceIntent] = useState<ParsedVoiceIntent | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [insufficientStockIntent, setInsufficientStockIntent] = useState<ParsedVoiceIntent | null>(null);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [showInitialSetupModal, setShowInitialSetupModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [lastFeedbackMessage, setLastFeedbackMessage] = useState<string>(
    "Tap microphone to manage your stock with natural voice."
  );
  const [offlineQueuedCount, setOfflineQueuedCount] = useState(0);

  // Offline sync handler
  const handleOfflineSync = useCallback(
    (entries: OfflineQueueEntry[]) => {
      for (const entry of entries) {
        executeVoiceIntent(entry.intent);
      }
      setOfflineQueuedCount(0);
      const msg = `Synced ${entries.length} offline actions to inventory.`;
      setLastFeedbackMessage(msg);
      speakText(msg, currentLanguage);
    },
    [executeVoiceIntent, currentLanguage]
  );

  const { isOnline, wasOffline, isSyncing, pendingCount } = useOnlineStatus(handleOfflineSync);

  /**
   * Process Voice Transcript from Persistent Voice Assistant or Input
   */
  const handleProcessVoiceInput = (rawText: string) => {
    if (!rawText.trim()) return;

    const compoundIntents = parseCompoundVoiceIntents(rawText, products, currentLanguage);
    if (compoundIntents.length === 0) return;

    const primaryIntent = compoundIntents[0];

    // 1. Guard check: Insufficient Stock
    if (primaryIntent.insufficientStock) {
      setInsufficientStockIntent(primaryIntent);
      setShowInsufficientModal(true);
      const alertMsg = `Not enough stock. You only have ${primaryIntent.insufficientStock.availableTradeUnits} ${primaryIntent.insufficientStock.unitLabel} of ${primaryIntent.productName || "item"}.`;
      setLastFeedbackMessage(alertMsg);
      speakText(alertMsg, currentLanguage);
      return;
    }

    // 2. Query Handling (CHECK_STOCK, SALES_QUERY, LOW_STOCK_QUERY, REORDER_QUERY)
    if (primaryIntent.action === "CHECK" || primaryIntent.action === "QUERY") {
      let response = primaryIntent.feedbackMessage;
      if (primaryIntent.matchedProduct) {
        const p = primaryIntent.matchedProduct;
        const availableTrade = Number((p.quantity / (p.tradeUnitSize || 1)).toFixed(1));
        const unitLabel = TRADE_UNITS[p.tradeUnit]?.label || p.tradeUnit;
        response = `You have ${availableTrade} ${unitLabel} of ${p.name} available in store.`;
      }
      setLastFeedbackMessage(response);
      speakText(response, currentLanguage);
      return;
    }

    if (primaryIntent.action === "SALES_QUERY") {
      setActiveTab("sales");
      setLastFeedbackMessage(primaryIntent.feedbackMessage);
      speakText(primaryIntent.feedbackMessage, currentLanguage);
      return;
    }

    if (primaryIntent.action === "LOW_STOCK_QUERY") {
      if (lowStockProducts.length === 0) {
        const msg = "All stock levels are healthy! No items are currently in shortage.";
        setLastFeedbackMessage(msg);
        speakText(msg, currentLanguage);
      } else {
        const itemNames = lowStockProducts.map((p) => p.name).join(", ");
        const msg = `${lowStockProducts.length} items are running low: ${itemNames}.`;
        setLastFeedbackMessage(msg);
        speakText(msg, currentLanguage);
      }
      return;
    }

    if (primaryIntent.action === "REORDER_QUERY") {
      setActiveTab("reorder");
      const msg = reminders.length > 0
        ? `You have ${reminders.length} items needing reorder.`
        : "Reorder list is clear.";
      setLastFeedbackMessage(msg);
      speakText(msg, currentLanguage);
      return;
    }

    if (primaryIntent.action === "SET_REORDER_LEVEL") {
      if (primaryIntent.matchedProduct && primaryIntent.targetThreshold !== undefined) {
        setProductReorderLevel(primaryIntent.matchedProduct.id, primaryIntent.targetThreshold);
        const msg = `Reorder level for ${primaryIntent.matchedProduct.name} set to ${primaryIntent.targetThreshold} ${TRADE_UNITS[primaryIntent.matchedProduct.tradeUnit]?.label || "units"}.`;
        setLastFeedbackMessage(msg);
        speakText(msg, currentLanguage);
      }
      return;
    }

    // 3. Action Execution (ADD, SELL, SET)
    if (!isOnline) {
      for (const intent of compoundIntents) {
        enqueueOfflineAction(intent);
      }
      setOfflineQueuedCount((c) => c + compoundIntents.length);
      const offlineMsg = `Saved ${compoundIntents.length} action(s) offline. Will sync when online.`;
      setLastFeedbackMessage(offlineMsg);
      window.alert(offlineMsg);
      return;
    }

    // Direct multi-item compound execution if all matched
    if (compoundIntents.length > 1) {
      let count = 0;
      for (const item of compoundIntents) {
        if (item.matchedProduct) {
          executeVoiceIntent(item);
          count++;
        }
      }
      const compoundSummary = `Processed ${count} items into inventory successfully.`;
      setLastFeedbackMessage(compoundSummary);
      speakText(compoundSummary, currentLanguage);
      return;
    }

    // Single item intent: show confirmation modal
    setActiveVoiceIntent(primaryIntent);
    setShowVoiceModal(true);
  };

  /**
   * Quick Add Stock (+1 Trade Unit)
   */
  const handleQuickAddStock = (product: Product) => {
    const unitLabel = TRADE_UNITS[product.tradeUnit]?.label || product.tradeUnit;
    const intent: ParsedVoiceIntent = {
      rawText: `Add 1 ${unitLabel} ${product.name}`,
      action: "ADD",
      matchedProduct: product,
      productName: product.name,
      quantity: 1,
      tradeUnit: product.tradeUnit,
      baseQuantityCalculated: product.tradeUnitSize,
      confidence: 1.0,
      language: currentLanguage,
      feedbackMessage: `Added 1 ${unitLabel} of ${product.name}.`,
    };
    executeVoiceIntent(intent);
    const msg = `Added 1 ${unitLabel} of ${product.name}.`;
    setLastFeedbackMessage(msg);
    speakText(msg, currentLanguage);
  };

  /**
   * Quick Sell Stock (-1 Trade Unit) with Out-of-Stock Protection
   */
  const handleQuickSellStock = (product: Product) => {
    const unitLabel = TRADE_UNITS[product.tradeUnit]?.label || product.tradeUnit;
    const currentTrade = Number((product.quantity / (product.tradeUnitSize || 1)).toFixed(1));

    if (currentTrade < 1) {
      const guardIntent: ParsedVoiceIntent = {
        rawText: `Sell 1 ${unitLabel} ${product.name}`,
        action: "SELL",
        matchedProduct: product,
        productName: product.name,
        quantity: 1,
        tradeUnit: product.tradeUnit,
        confidence: 1.0,
        language: currentLanguage,
        feedbackMessage: `Not enough stock.`,
        insufficientStock: {
          availableTradeUnits: currentTrade,
          requestedTradeUnits: 1,
          unitLabel,
        },
      };
      setInsufficientStockIntent(guardIntent);
      setShowInsufficientModal(true);
      const alertMsg = `Not enough stock. You have only ${currentTrade} ${unitLabel} of ${product.name}.`;
      setLastFeedbackMessage(alertMsg);
      speakText(alertMsg, currentLanguage);
      return;
    }

    const intent: ParsedVoiceIntent = {
      rawText: `Sold 1 ${unitLabel} ${product.name}`,
      action: "SELL",
      matchedProduct: product,
      productName: product.name,
      quantity: 1,
      tradeUnit: product.tradeUnit,
      baseQuantityCalculated: product.tradeUnitSize,
      confidence: 1.0,
      language: currentLanguage,
      feedbackMessage: `Sold 1 ${unitLabel} of ${product.name}.`,
    };
    executeVoiceIntent(intent);
    const msg = `Sold 1 ${unitLabel} of ${product.name}.`;
    setLastFeedbackMessage(msg);
    speakText(msg, currentLanguage);
  };

  /**
   * Initial Setup Bulk Add
   */
  const handleSaveInitialSetup = (
    items: Array<{
      name: string;
      category: string;
      quantity: number;
      baseUnit: any;
      tradeUnit: TradeUnitKey;
      tradeUnitSize: number;
      price: number;
      minStockThreshold: number;
      reorderQuantity: number;
    }>
  ) => {
    for (const item of items) {
      addProduct(item);
    }
    const msg = `Saved ${items.length} items to Sai General Stores inventory.`;
    setLastFeedbackMessage(msg);
    speakText(msg, currentLanguage);
  };

  /**
   * Spoken Audio Alerts for Shortages
   */
  const handleSpeakShortageAlerts = () => {
    if (reminders.length === 0) {
      speakText("All stock is healthy. No items are running low.", currentLanguage);
      return;
    }
    let speech = `Attention: ${reminders.length} items are low on stock. `;
    reminders.forEach((r) => {
      speech += `${r.productName} has only ${r.currentTradeUnits} ${r.tradeUnitLabel} remaining. `;
    });
    speakText(speech, currentLanguage);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans pb-32">
      {/* Offline Status Bar Banner */}
      <OfflineStatusBar
        isOnline={isOnline}
        wasOffline={wasOffline}
        isSyncing={isSyncing}
        pendingCount={pendingCount + offlineQueuedCount}
      />

      {/* Primary Top Header */}
      <header className="sticky top-0 z-30 border-b border-emerald-500/20 bg-slate-900/95 backdrop-blur-xl shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Voice<span className="text-emerald-400">Stock</span> AI
                </span>
                <span className="text-[10px] uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full hidden sm:inline-block">
                  Kirana Voice Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                "Speak your business. Manage your stock."
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isOnline ? (
              <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-500/30 px-2.5 py-1 rounded-xl text-xs">
                <WifiOff className="h-3.5 w-3.5 text-red-400" />
                <span className="text-red-300 font-bold text-[11px]">Offline Mode</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-xl border border-border/50 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-muted-foreground">Store:</span>
                <span className="font-bold text-white">Sai General Stores</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={resetToSaiStoreDemo}
              className="text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 h-8"
              title="Reset stock to original demo numbers"
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-white text-xs h-8"
            >
              <LogOut className="mr-1 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="border-t border-border/40 bg-slate-950/60 px-4">
          <div className="mx-auto max-w-7xl flex items-center gap-1 overflow-x-auto py-1 text-xs">
            {/* Inventory Tab */}
            <button
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "inventory"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-muted-foreground hover:text-white hover:bg-slate-900"
              }`}
            >
              <Package className="h-4 w-4" />
              📦 Inventory Dashboard
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "inventory"
                    ? "bg-slate-950 text-emerald-400"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {totalItemsCount}
              </span>
            </button>

            {/* Sales Tab */}
            <button
              onClick={() => setActiveTab("sales")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "sales"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-white hover:bg-slate-900"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              📊 Sales Dashboard
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === "sales"
                    ? "bg-white text-indigo-700"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {salesTransactions.length}
              </span>
            </button>

            {/* Reorder Hub Tab */}
            <button
              onClick={() => setActiveTab("reorder")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "reorder"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-muted-foreground hover:text-white hover:bg-slate-900"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              ⚡ Reorder & Shortages
              {lowStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Activity History Tab */}
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "history"
                  ? "bg-slate-800 text-white shadow-md"
                  : "text-muted-foreground hover:text-white hover:bg-slate-900"
              }`}
            >
              <History className="h-4 w-4" />
              🕒 Voice Activity Log ({transactions.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        {/* Tab: Inventory Dashboard */}
        {activeTab === "inventory" && (
          <InventoryDashboard
            products={products}
            reminders={reminders}
            lowStockCount={lowStockCount}
            outOfStockCount={outOfStockCount}
            totalItemsCount={totalItemsCount}
            todayUpdatesCount={todayUpdatesCount}
            onOpenInitialSetup={() => setShowInitialSetupModal(true)}
            onOpenAddProduct={() => setShowAddModal(true)}
            onEditProduct={setEditProduct}
            onDeleteProduct={deleteProduct}
            onQuickAddStock={handleQuickAddStock}
            onQuickSellStock={handleQuickSellStock}
            onResetDemo={resetToSaiStoreDemo}
            onSpeakAlerts={handleSpeakShortageAlerts}
          />
        )}

        {/* Tab: Sales Dashboard */}
        {activeTab === "sales" && (
          <SalesDashboard
            transactions={transactions}
            products={products}
            lowStockCount={lowStockCount}
            onSpeakText={(text) => {
              setLastFeedbackMessage(text);
              speakText(text, currentLanguage);
            }}
          />
        )}

        {/* Tab: Reorder Hub */}
        {activeTab === "reorder" && (
          <ReorderSuggestions
            lowStockProducts={lowStockProducts}
            onSpeakSummary={(text) => {
              setLastFeedbackMessage(text);
              speakText(text, currentLanguage);
            }}
          />
        )}

        {/* Tab: Transaction History Log */}
        {activeTab === "history" && (
          <TransactionHistory transactions={transactions} />
        )}
      </main>

      {/* Persistent Voice Assistant Bar (Floating at Bottom of All Screens) */}
      <PersistentVoiceAssistant
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        isOnline={isOnline}
        onProcessTranscript={handleProcessVoiceInput}
        lastFeedbackMessage={lastFeedbackMessage}
        onSpeakText={(text) => speakText(text, currentLanguage)}
      />

      {/* Out-of-Stock Guard Modal */}
      <InsufficientStockModal
        open={showInsufficientModal}
        intent={insufficientStockIntent}
        onClose={() => setShowInsufficientModal(false)}
        onConfirmAdjusted={(adjustedIntent) => {
          executeVoiceIntent(adjustedIntent);
          setLastFeedbackMessage(adjustedIntent.feedbackMessage);
          speakText(adjustedIntent.feedbackMessage, currentLanguage);
        }}
      />

      {/* Initial Store Stock Setup Wizard Modal */}
      <InitialSetupModal
        open={showInitialSetupModal}
        existingProducts={products}
        currentLanguage={currentLanguage}
        onClose={() => setShowInitialSetupModal(false)}
        onSaveSetup={handleSaveInitialSetup}
        onResetDemo={() => {
          resetToSaiStoreDemo();
          setShowInitialSetupModal(false);
          const msg = "Loaded Sai General Stores demo catalog!";
          setLastFeedbackMessage(msg);
          speakText(msg, currentLanguage);
        }}
      />

      {/* Voice Action Confirmation Modal */}
      <VoiceCommandModal
        open={showVoiceModal}
        intent={activeVoiceIntent}
        products={products}
        onClose={() => setShowVoiceModal(false)}
        onCreateProduct={(data) => addProduct(data)}
        onConfirm={(finalIntent) => {
          executeVoiceIntent(finalIntent);
          setLastFeedbackMessage(finalIntent.feedbackMessage);
          speakText(finalIntent.feedbackMessage, currentLanguage);
        }}
        onSpeakResponse={(text) => speakText(text, currentLanguage)}
      />

      {/* Manual Product Create Modal */}
      <ProductFormDialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => {
          addProduct(data);
          const msg = `Added ${data.name} to inventory.`;
          setLastFeedbackMessage(msg);
          speakText(msg, currentLanguage);
        }}
      />

      {/* Manual Product Edit Modal */}
      {editProduct && (
        <ProductFormDialog
          open={!!editProduct}
          onClose={() => setEditProduct(null)}
          product={editProduct}
          onSubmit={(data) => {
            updateProduct(editProduct.id, data);
            const msg = `Updated details for ${editProduct.name}.`;
            setLastFeedbackMessage(msg);
            speakText(msg, currentLanguage);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
