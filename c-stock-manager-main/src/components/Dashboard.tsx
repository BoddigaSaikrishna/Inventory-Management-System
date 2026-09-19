import { useState, useMemo, useCallback } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { Product, SortField, SortOrder, LanguageCode, ParsedVoiceIntent } from "@/types/inventory";
import { parseVoiceIntent } from "@/lib/nlpParser";
import { speakText } from "@/lib/speech";
import { enqueueOfflineAction, type OfflineQueueEntry } from "@/lib/offlineQueue";
import LoginScreen from "@/components/LoginScreen";
import StatsCards from "@/components/StatsCards";
import ProductTable from "@/components/ProductTable";
import ProductFormDialog from "@/components/ProductFormDialog";
import VoiceMicButton from "@/components/VoiceMicButton";
import VoiceCommandModal from "@/components/VoiceCommandModal";
import TransactionHistory from "@/components/TransactionHistory";
import ReorderSuggestions from "@/components/ReorderSuggestions";
import OfflineStatusBar from "@/components/OfflineStatusBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  LogOut,
  AlertTriangle,
  History,
  Mic,
  Send,
  Boxes,
  Sparkles,
  WifiOff,
  Clock,
  Trash2,
} from "lucide-react";

const Dashboard = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const {
    products,
    transactions,
    addProduct,
    updateProduct,
    deleteProduct,
    clearAllData,
    executeVoiceIntent,
    getLowStockProducts,
    totalValue,
    totalItemsCount,
    lowStockCount,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<"catalog" | "reorder" | "history">("catalog");
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("hi-IN");

  const [search, setSearch] = useState("");
  const [voiceInputText, setVoiceInputText] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [activeVoiceIntent, setActiveVoiceIntent] = useState<ParsedVoiceIntent | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [offlineQueuedCount, setOfflineQueuedCount] = useState(0);

  // ── Offline sync handler: replay queued actions when internet returns ──────
  const handleOfflineSync = useCallback((entries: OfflineQueueEntry[]) => {
    for (const entry of entries) {
      executeVoiceIntent(entry.intent);
    }
    setOfflineQueuedCount(0);
  }, [executeVoiceIntent]);

  const { isOnline, wasOffline, isSyncing, pendingCount } = useOnlineStatus(handleOfflineSync);

  const lowStockProducts = getLowStockProducts();

  const displayProducts = useMemo(() => {
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

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "price") cmp = a.price - b.price;
      else if (sortField === "quantity") cmp = a.quantity - b.quantity;
      else if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else cmp = a.id - b.id;
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [products, sortField, sortOrder, search]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  /**
   * Process voice input transcript (from Mic or manual text bar).
   * When offline: enqueues the action and shows a toast-like confirmation.
   * When online: opens the voice confirmation modal as normal.
   */
  const handleProcessVoiceInput = (rawText: string) => {
    if (!rawText.trim()) return;
    const parsed = parseVoiceIntent(rawText, products, currentLanguage);

    if (!isOnline) {
      // Queue for later sync instead of executing now
      enqueueOfflineAction(parsed);
      setOfflineQueuedCount((c) => c + 1);
      setVoiceInputText("");
      // Brief visual feedback via alert
      const productLabel = parsed.matchedProduct?.name ?? "product";
      const qty = parsed.quantity ?? 1;
      window.alert(
        `⏳ Offline: Action queued!\n\n"${parsed.action} ${qty} of ${productLabel}" will be executed automatically when you reconnect.`
      );
      return;
    }

    setActiveVoiceIntent(parsed);
    setShowVoiceModal(true);
  };

  /**
   * Quick action sample voice triggers for instant testing
   */
  const handleSampleChipClick = (phrase: string) => {
    setVoiceInputText(phrase);
    handleProcessVoiceInput(phrase);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans pb-16">
      {/* Offline Status Banner — sits above everything */}
      <OfflineStatusBar
        isOnline={isOnline}
        wasOffline={wasOffline}
        isSyncing={isSyncing}
        pendingCount={pendingCount + offlineQueuedCount}
      />

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-emerald-500/20 bg-slate-900/90 backdrop-blur-xl shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Voice<span className="text-emerald-400">Stock</span> India
                <span className="text-[10px] uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full ml-1">
                  v2.0 Regional
                </span>
              </span>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Voice-First Inventory Management for Small Businesses & Kiranas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Offline / Online indicator pill */}
            {!isOnline ? (
              <div className="hidden md:flex items-center gap-1.5 bg-red-950/60 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs">
                <WifiOff className="h-3.5 w-3.5 text-red-400" />
                <span className="text-red-300 font-bold">Offline</span>
                {(pendingCount + offlineQueuedCount) > 0 && (
                  <span className="ml-1 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold">
                    {pendingCount + offlineQueuedCount} pending
                  </span>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-border/50 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-muted-foreground">User:</span>
                <span className="font-mono font-bold text-foreground">{user}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete all inventory items and clear all data? This cannot be undone.")) {
                  clearAllData();
                }
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
              title="Clear all products and inventory data"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear Data
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-white text-xs">
              <LogOut className="mr-1.5 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="mx-auto max-w-7xl p-4 space-y-6">
        {/* Voice Assistant Microphone Hero Section */}
        <section className="animate-fade-in space-y-3">
          <VoiceMicButton
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            isOnline={isOnline}
            onTranscriptReceived={(transcript, isFinal) => {
              setVoiceInputText(transcript);
              if (isFinal) {
                handleProcessVoiceInput(transcript);
              }
            }}
          />

          {/* Quick Voice Command Sample Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
            <span className="text-muted-foreground text-[11px] font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400" /> Try Speaking:
            </span>
            <button
              onClick={() => handleSampleChipClick("Add 5 bags Basmati Rice")}
              className="rounded-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 px-3 py-1 text-emerald-300 font-medium transition-colors"
            >
              "Add 5 bags Basmati Rice"
            </button>
            <button
              onClick={() => handleSampleChipClick("5 borii chawal aayi")}
              className="rounded-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 px-3 py-1 text-emerald-300 font-medium transition-colors"
            >
              "5 borii chawal aayi"
            </button>
            <button
              onClick={() => handleSampleChipClick("Sold 2 dozen Lux soap")}
              className="rounded-full bg-slate-900 hover:bg-slate-800 border border-rose-500/30 px-3 py-1 text-rose-300 font-medium transition-colors"
            >
              "Sold 2 dozen Lux soap"
            </button>
            <button
              onClick={() => handleSampleChipClick("Chawal kitna bacha hai?")}
              className="rounded-full bg-slate-900 hover:bg-slate-800 border border-blue-500/30 px-3 py-1 text-blue-300 font-medium transition-colors"
            >
              "Chawal kitna bacha hai?"
            </button>
          </div>
        </section>

        {/* Text Voice Command Bar (Manual Fallback Input) */}
        <div className="flex items-center gap-2 bg-slate-900 border border-emerald-500/20 p-2 rounded-2xl shadow-md max-w-3xl mx-auto">
          <Mic className="h-4 w-4 text-emerald-400 ml-2 shrink-0" />
          <Input
            value={voiceInputText}
            onChange={(e) => setVoiceInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleProcessVoiceInput(voiceInputText);
            }}
            placeholder="Or type voice command manually (e.g., 'Add 3 cartons Fortune Oil')..."
            className="bg-transparent border-none text-sm text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
          <Button
            size="sm"
            onClick={() => handleProcessVoiceInput(voiceInputText)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shrink-0"
          >
            <Send className="h-3.5 w-3.5 mr-1" /> Parse Action
          </Button>
        </div>

        {/* Key Metrics Stats Cards */}
        <StatsCards
          productCount={totalItemsCount}
          totalValue={totalValue}
          totalItems={products.reduce((acc, p) => acc + p.quantity, 0)}
          lowStockCount={lowStockCount}
        />

        {/* Tab Navigation Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-border/60 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "catalog"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Boxes className="h-4 w-4" />
              Inventory Catalog ({products.length})
            </button>

            <button
              onClick={() => setActiveTab("reorder")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === "reorder"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Reorder Hub
              {lowStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="h-4 w-4" />
              Voice Transaction Feed ({transactions.length})
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeTab === "catalog" && (
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter catalog..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-slate-900 border-border text-xs"
                />
              </div>
            )}

            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === "catalog" && (
          <ProductTable
            products={displayProducts}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            onEdit={setEditProduct}
            onDelete={deleteProduct}
          />
        )}

        {activeTab === "reorder" && (
          <ReorderSuggestions
            lowStockProducts={lowStockProducts}
            onSpeakSummary={(text) => speakText(text, currentLanguage)}
          />
        )}

        {activeTab === "history" && (
          <TransactionHistory transactions={transactions} />
        )}
      </main>

      {/* Product Create Dialog */}
      <ProductFormDialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => addProduct(data)}
      />

      {/* Product Edit Dialog */}
      {editProduct && (
        <ProductFormDialog
          open={!!editProduct}
          onClose={() => setEditProduct(null)}
          product={editProduct}
          onSubmit={(data) => updateProduct(editProduct.id, data)}
        />
      )}

      {/* Voice Action Confirmation Modal */}
      <VoiceCommandModal
        open={showVoiceModal}
        intent={activeVoiceIntent}
        products={products}
        onClose={() => setShowVoiceModal(false)}
        onConfirm={(finalIntent) => {
          executeVoiceIntent(finalIntent);
          setVoiceInputText("");
        }}
        onSpeakResponse={(text) => speakText(text, currentLanguage)}
      />
    </div>
  );
};

export default Dashboard;
