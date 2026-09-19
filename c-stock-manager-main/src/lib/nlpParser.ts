import { ParsedVoiceIntent, ActionType, Product, TradeUnitKey } from "@/types/inventory";
import { matchTradeUnit, TRADE_UNITS } from "./tradeUnits";

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectScript(word: string): "telugu" | "hindi" | "tamil" | "latin" | "mixed" {
  const teluguRe  = /[\u0C00-\u0C7F]/;
  const hindiRe   = /[\u0900-\u097F]/;
  const tamilRe   = /[\u0B80-\u0BFF]/;
  const hasTelugu = teluguRe.test(word);
  const hasHindi  = hindiRe.test(word);
  const hasTamil  = tamilRe.test(word);
  const hasLatin  = /[a-zA-Z]/.test(word);
  const scripts   = [hasTelugu, hasHindi, hasTamil, hasLatin].filter(Boolean).length;
  if (scripts > 1) return "mixed";
  if (hasTelugu) return "telugu";
  if (hasHindi)  return "hindi";
  if (hasTamil)  return "tamil";
  return "latin";
}

/**
 * Detect the dominant language mix in a full utterance.
 * Returns a profile that guides matching strategy.
 */
function detectCodeMix(text: string): {
  hastelugu: boolean;
  hasHindi: boolean;
  hasTamil: boolean;
  hasEnglish: boolean;
  isMixed: boolean;
} {
  const words = text.split(/\s+/);
  const scripts = words.map(detectScript);
  const hastelugu  = scripts.includes("telugu");
  const hasHindi   = scripts.includes("hindi");
  const hasTamil   = scripts.includes("tamil");
  const hasEnglish = scripts.includes("latin");
  return {
    hastelugu,
    hasHindi,
    hasTamil,
    hasEnglish,
    isMixed: [hastelugu, hasHindi, hasTamil, hasEnglish].filter(Boolean).length > 1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// NUMBER WORDS — all languages + code-mixed spoken forms
// ─────────────────────────────────────────────────────────────────────────────

const NUMBER_WORDS: Record<string, number> = {
  // English
  one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
  eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15,
  sixteen:16, seventeen:17, eighteen:18, nineteen:19,
  twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90,
  hundred:100, thousand:1000,

  // Hindi / Hinglish
  ek:1, do:2, teen:3, char:4, chaar:4, paanch:5, panch:5, cheh:6, che:6, saat:7,
  aath:8, nau:9, das:10, gyarah:11, barah:12, pandrah:15, bees:20, pachis:25,
  tees:30, chaalees:40, pachaas:50, saath:60, sattar:70, assi:80, nabbe:90,
  sau:100, hazaar:1000,
  // Devanagari numerals
  "एक":1,"दो":2,"तीन":3,"चार":4,"पांच":5,"छह":6,"सात":7,"आठ":8,"नौ":9,"दस":10,
  "बीस":20,"पचास":50,"सौ":100,"हजार":1000,

  // Telugu / Tenglish spoken
  okati:1, rendu:2, moodu:3, naalugu:4, aaidu:5, aaru:6, aedu:7, enimidi:8,
  thommidi:9, padi:10, padakonu:11, pannendu:12, pandrendu:13, padsunalu:14,
  padaihendu:15, iravai:20, iravai_rendu:22, mudwai:30, nalabhai:40,
  aabhai:50, aruvai:60, ebhai:80, thonbhai:90, vandha:100, veyyi:1000,
  // Telugu Unicode
  "ఒకటి":1,"రెండు":2,"మూడు":3,"నాలుగు":4,"ఐదు":5,"ఆరు":6,"ఏడు":7,
  "ఎనిమిది":8,"తొమ్మిది":9,"పది":10,"ఇరవై":20,"ఏభై":50,"వంద":100,

  // Tamil / Tanglish
  onru:1, irandu:2, moondru:3, naangu:4, ainthu:5, aaru_ta:6, eazhu:7,
  ettu:8, onpathu:9, pathu:10, irupathu:20, aimbathu:50, nooru:100,
  // Tamil Unicode
  "ஒன்று":1,"இரண்டு":2,"மூன்று":3,"நான்கு":4,"ஐந்து":5,"ஆறு":6,"ஏழு":7,
  "எட்டு":8,"ஒன்பது":9,"பத்து":10,
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTION KEYWORDS — English + Hindi + Telugu + Tamil + CODE-MIXED VERBS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Code-mixed verb patterns that end a phrase in regional suffix:
 * "add karo", "add cheyyi", "add chesko", "check karo", "becho karo", etc.
 */
const CODE_MIXED_ADD_VERBS = [
  // Telugu-mixed  (add + Telugu imperative/verb suffix)
  "add cheyyi", "add chesko", "add chesuko", "add cheyyandi", "add avutundi",
  "vachindi", "vachayi", "vachay", "tecchayi", "tecchaadu",
  "జతచేయి", "వచ్చింది", "చేర్చు",
  // Hindi-mixed (add + Hindi verb)
  "add karo", "add kar", "add kardo", "add karein", "add karna",
  "rakh do", "rakh dena", "rakhna", "daldo", "daal do", "daalena",
  "laaya", "laaye", "laya", "aaya", "aaye", "aayi", "aai", "aagaya", "aagaye", "aa gaya",
  "mila", "mile", "khariday", "kharida",
  "जमा करो", "जोड़ो", "डालो", "रखो", "लाया", "आया",
  // Tamil-mixed
  "add pannu", "add pannunga", "add seyyi", "vanthachu",
  "சேர்","வரவு",
];

const CODE_MIXED_REMOVE_VERBS = [
  // Telugu-mixed
  "remove cheyyi", "remove chesko", "sold cheyyi", "ammesa", "ammesanu",
  "ammayi", "potundi", "teesuko", "teesaanu",
  "అమ్మేసాను", "తొలగించు", "తీసుకో",
  // Hindi-mixed
  "remove karo", "remove kar", "bech diya", "becho", "nikalo", "nikala",
  "gaya", "khatam", "de diya", "dene", "issue karo", "issue kar",
  "बेचा", "निकालो", "गया", "खत्म", "दिया",
  // Tamil-mixed
  "remove pannu", "sell pannunga", "vittachu",
  "விற்று",
];

const CODE_MIXED_QUERY_VERBS = [
  // Telugu-mixed  ← KEY: "check cheyyi" is the most common Tenglish form
  "check cheyyi", "check chesko", "check chesuko", "check cheyyandi",
  "stock cheyyi", "stock check cheyyi", "chupinchu",
  "ఎంత ఉంది", "ఎంతుంది", "ఉందా", "చెప్పు", "చూడు",
  // Hindi-mixed
  "check karo", "check kar", "dekho", "dikhao", "batao", "bata do",
  "kitna hai", "kitne hain", "kitna bacha", "stock batao", "stock dikhao",
  "कितना","कितने","देखो","बताओ","चेक",
  // Tamil-mixed
  "check pannu", "pakku", "sollu", "yevvalavu irukku",
  "எவ்வளவு","இருக்கா",
];

const CODE_MIXED_REORDER_VERBS = [
  "order karo", "order kar", "order cheyyi", "mangao", "mangaao",
  "low stock", "kam hai", "khatam hone wala", "kavali", "thevei",
  "order karana", "reorder kar",
  "ఆర్డర్","తక్కువ","కావాలి",
  "कम है","रीऑर्डर",
];

const ACTION_KEYWORDS: Record<string, string[]> = {
  SELL: [
    "sold", "sell", "selling", "sale", "customer took", "customer took away",
    "bech diya", "becha", "becho", "ammesa", "ammesanu", "ammayi",
    "అమ్మేసాను", "తీసుకో", "తీసుకున్నారు", "విற்று", "vittachu",
  ],
  ADD: [
    "add", "added", "adding", "receive", "received", "stock in", "purchase",
    "buying", "bought", "incoming", "new stock", "fill", "came", "arrived",
    ...CODE_MIXED_ADD_VERBS,
  ],
  REMOVE: [
    "remove", "issue", "issued", "deduct", "dispatch", "outgoing", "stock out", "nikalo",
    "తొలగించు",
  ],
  SALES_QUERY: [
    "did i sell", "have i sold", "what did i sell", "how much did i sell",
    "how much sold", "today's sales", "sales today", "sales this week",
    "amount sold", "total sold",
  ],
  LOW_STOCK_QUERY: [
    "which items are running low", "which items are low", "what items are low",
    "items running low", "running low", "what is running low", "low stock items",
    "which is low", "items low",
  ],
  REORDER_QUERY: [
    "what do i need to buy", "what should i buy", "when should i buy",
    "what to reorder", "need to buy", "should i buy", "to buy today",
    "what do i buy", "what to buy",
  ],
  SET_REORDER_LEVEL: [
    "remind me when", "alert at", "alert me below", "reorder level at",
    "alert me when", "goes below", "should alert me below", "set reorder level",
    "reorder threshold", "reorder level", "reorder limit", "reorder point",
  ],
  CHECK: [
    "how much", "how many", "is left", "do i have", "stock of", "balance",
    "remaining", "kitna bacha", "entha undi", "chupinchu", "stock check",
    "check", ...CODE_MIXED_QUERY_VERBS,
  ],
  SET: [
    "set", "update", "current stock", "stock is", "hai", "rakho", "marpu",
    "मात्रा","स्टॉक","ఉంది","இருக்கிறது",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT ALIAS CATALOG — every spoken form across all language mixes
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT_CATALOG_ALIASES: Array<{
  tags: string[];
  aliases: string[];
}> = [
  {
    tags: ["rice", "chawal", "arisi", "biyyam", "basmati"],
    aliases: [
      // English
      "rice","basmati","biryani rice","raw rice",
      // Hindi/Hinglish
      "chawal","chaval","chaaval","chaawaal","baasmati","basmati chawal",
      // Telugu/Tenglish
      "biyyam","biyyamu","akki","రైస్","బాస్మతి","వరి","అన్నం",
      // Tamil/Tanglish
      "arisi","pacharisi","ponni arisi",
      // code-mixed compound phrases
      "rice stock","rice bags","rice ka stock","rice cheyyi",
    ],
  },
  {
    tags: ["oil","tel","ennai","nune","sunflower","fortune","groundnut","palm"],
    aliases: [
      // English
      "oil","sunflower oil","groundnut oil","palm oil","coconut oil","refined oil",
      "fortune oil","fortune sunflower",
      // Hindi/Hinglish
      "tel","tail","tael","sarson","sarson ka tel","cooking oil","tel ka dabba",
      "తెల్","నూనె",
      // Telugu/Tenglish
      "nune","nune telli","nune bottles","nune packet","ఆయిల్","నూనె","సన్‌ఫ్లవర్",
      "ఫార్చ్యూన్","fortune","fortune brand",
      // Tamil/Tanglish
      "ennai","ennay","nallennai",
      // code-mixed
      "oil add karo","oil ka stock","tel ka stock","oil stock check",
    ],
  },
  {
    tags: ["sugar","chini","cheeni","sakkarai","panchadara"],
    aliases: [
      // English
      "sugar","refined sugar","white sugar",
      // Hindi/Hinglish
      "chini","cheeni","chinni","shakkar","sheera","chini ka bag",
      "चीनी","शक्कर",
      // Telugu/Tenglish
      "panchadara","panchathara","cakkera","చక్కెర","sakkar",
      // Tamil/Tanglish
      "sakkarai","sakkara","vellam",
      // code-mixed
      "sugar check karo","sugar stock","sugar bags","sugar ka stock",
    ],
  },
  {
    tags: ["soap","sabun","lux","bars"],
    aliases: [
      // English
      "soap","bath soap","lux soap","bathing bar","bar soap",
      // Hindi/Hinglish
      "sabun","saabun","साबुन","nhaane ka sabun","lux",
      // Telugu/Tenglish
      "sabbu","sabbu billa","సబ్బు","soap packets",
      // Tamil/Tanglish
      "sabbu","chappudu",
      // code-mixed
      "soap check karo","soap stock","soap ka stock",
    ],
  },
  {
    tags: ["atta","wheat","flour","aashirvaad","chakki"],
    aliases: [
      // English
      "atta","wheat flour","flour","whole wheat","chakki fresh",
      // Hindi/Hinglish
      "aata","aashirvaad","आटा","ashirvaad","gehun","gehu ka atta",
      // Telugu/Tenglish
      "godhuma","godhumapu pindi","గోధుమ","పిండి","atta bags",
      // Tamil/Tanglish
      "godhumai","maida","rava",
      // code-mixed
      "atta add karo","atta ka stock","atta bags",
    ],
  },
  {
    tags: ["tea","chai","red label","brooke bond","leaves"],
    aliases: [
      // English
      "tea","tea leaves","red label","brooke bond","tea packets","chai",
      // Hindi/Hinglish
      "chaipatti","chai patti","chai ka dabba","chaay","चाय","redlabel",
      // Telugu/Tenglish
      "chaay","tea podi","తేయాకు","చాయ్",
      // Tamil/Tanglish
      "tea thool","theneer","thalir",
      // code-mixed
      "chai check karo","tea stock check","chai add karo",
    ],
  },
  {
    tags: ["salt","namak","uppu"],
    aliases: [
      // English
      "salt","iodized salt","rock salt","sea salt",
      // Hindi/Hinglish
      "namak","noon","नमक","tata salt","namak bags",
      // Telugu/Tenglish
      "uppu","uppudu","ఉప్పు",
      // Tamil/Tanglish
      "uppu","karuppuppu",
      // code-mixed
      "namak check karo","salt stock","uppu check cheyyi",
    ],
  },
  {
    tags: ["dal","lentil","toor","moong","chana","masoor"],
    aliases: [
      // English
      "dal","lentils","toor dal","moong dal","chana dal","masoor dal",
      // Hindi/Hinglish
      "daal","toor","tuvar","arhar","moong","chana","दाल","अरहर","मूंग",
      // Telugu/Tenglish
      "pappu","kandi pappu","pesara pappu","పప్పు","కంది",
      // Tamil/Tanglish
      "paruppu","thuvaram paruppu","pasi paruppu",
      // code-mixed
      "dal check karo","pappu stock cheyyi","dal add karo",
    ],
  },
  {
    tags: ["eggs","egg","guddu","gudlu","anda","ande","muttai"],
    aliases: [
      "eggs","egg","dozen eggs","egg tray","farm eggs",
      "anda","ande","अंडा","अंडे","anda tray",
      "guddu","gudlu","గుడ్డు","గుడ్లు","కోడి గుడ్లు",
      "muttai","mutta","முட்டை",
      "eggs add karo","gudlu check cheyyi","anda stock",
    ],
  },
  {
    tags: ["milk","doodh","paalu","curd","dahi","perugu","amul","nandini","heritage"],
    aliases: [
      "milk","dairy milk","amul milk","heritage milk","sangam milk","nandini milk",
      "doodh","dudh","दूध","paalu","పాలు","మజ్జిగ",
      "curd","dahi","दही","perugu","పెరుగు","yoghurt",
      "milk packet","milk liter","milk ltr","milk bottle",
    ],
  },
  {
    tags: ["biscuit","biscuits","parle","britannia","oreo","bourbon","goodday"],
    aliases: [
      "biscuit","biscuits","parle","parle g","britannia","marie","marie gold",
      "good day","oreo","bourbon","5050","biscut","बिस्कुट","బిస్కెట్లు",
      "biscuit packet","biscuits box","biscuit carton",
    ],
  },
  {
    tags: ["noodle","noodles","maggi","yippee","pasta","ramen"],
    aliases: [
      "noodle","noodles","maggi","maggie","yippee","top ramen","pasta",
      "मैगी","మాగీ","నూడుల్స్","maggi packet","maggi box","maggi carton",
    ],
  },
  {
    tags: ["chips","lays","kurkure","namkeen","sev","bhujia","mixture","bingo"],
    aliases: [
      "chips","lays","kurkure","bingo","namkeen","sev","bhujia","mixture",
      "नमकीन","చిప్స్","మిశ్రమం","chips packet","namkeen packet",
    ],
  },
  {
    tags: ["chocolate","chocolates","dairymilk","5star","kitkat","perk","munch"],
    aliases: [
      "chocolate","chocolates","dairy milk","cadbury","5 star","five star",
      "kitkat","perk","munch","chocolates box","चॉकलेट","చాక్లేట్లు",
    ],
  },
  {
    tags: ["coffee","nescafe","bru","instant"],
    aliases: [
      "coffee","nescafe","bru","filter coffee","instant coffee",
      "कॉफ़ी","కాఫీ","coffee powder","coffee packet",
    ],
  },
  {
    tags: ["colddrink","drink","thumsup","coke","coca cola","sprite","pepsi","frooti","maaza","7up"],
    aliases: [
      "cold drink","soft drink","thums up","coke","coca cola","sprite",
      "pepsi","7up","frooti","maaza","thumbsup","कोल्ड ड्रिंक","కూల్ డ్రింక్",
      "drink bottle","soda bottle","can",
    ],
  },
  {
    tags: ["masala","mirchi","chilli","haldi","turmeric","dhaniya","jeera","pasupu","kaaram"],
    aliases: [
      "masala","mirchi","red chilli","chilli powder","kaaram","లాల్ మిర్చి",
      "haldi","turmeric","pasupu","हल्दी","పసుపు",
      "dhaniya","coriander","dhania","धनिया","ధనియాలు",
      "jeera","cumin","जीरा","జీలకర్ర",
      "garam masala","chicken masala","sambar powder","everest","mdh","mtr",
    ],
  },
  {
    tags: ["detergent","surf","washing","wheel","tide","aerial","rin"],
    aliases: [
      "detergent","surf","surf excel","tide","aerial","wheel","ghari",
      "washing powder","detergent powder","సర్ఫ్","డిటర్జెంట్","निरमा",
      "rin soap","wheel bar","surf packet",
    ],
  },
  {
    tags: ["dishwash","vim","exo","pril","harpic","lizol"],
    aliases: [
      "dishwash","vim","vim bar","vim liquid","exo","pril","harpic","lizol",
      "विम","విమ్","साबुन","dishwash bar",
    ],
  },
  {
    tags: ["shampoo","clinicplus","sunsilk","headshoulders","pantene","meera"],
    aliases: [
      "shampoo","clinic plus","sunsilk","head and shoulders","pantene","meera",
      "शैम्पू","షాంపూ","shampoo sachet","shampoo bottle",
    ],
  },
  {
    tags: ["toothpaste","paste","colgate","pepsodent","close up","sensodyne"],
    aliases: [
      "toothpaste","paste","colgate","pepsodent","close up","sensodyne","dabur red",
      "टूथपेस्ट","పేస్ట్","toothbrush",
    ],
  },
  {
    tags: ["matchbox","matches","agarbatti","incense","pooja"],
    aliases: [
      "matchbox","matches","match box","agarbatti","incense sticks","cycle agarbatti",
      "माचिस","అగ్గిపెట్టె","అగరబత్తి","pooja oil",
    ],
  },
  {
    tags: ["mosquito","goodknight","allout","coil"],
    aliases: [
      "mosquito","good knight","all out","goodknight refill","allout refill",
      "mosquito coil","odomos","गुड नाइट","మస్కిటో",
    ],
  },
  {
    tags: ["dryfruit","cashew","kaju","almond","badam","raisins","kismis"],
    aliases: [
      "cashew","cashews","kaju","काजू","జీడిపప్పు",
      "almond","almonds","badam","बादाम","బాదం",
      "raisins","kismis","kishmish","किसमिस","కిస్మిస్",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// QUANTITY EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractQuantity(text: string): number | undefined {
  // Digits first (most reliable)
  const digitMatch = text.match(/\b(\d+(?:\.\d+)?)\b/);
  if (digitMatch) return parseFloat(digitMatch[1]);

  // Word numbers — try longest multi-word numbers first (e.g. "twenty five")
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  // Try two-word combos (e.g. "twenty five" = 25)
  for (let i = 0; i < words.length - 1; i++) {
    const combined = words[i] + " " + words[i + 1];
    if (NUMBER_WORDS[combined] !== undefined) return NUMBER_WORDS[combined];
  }

  // Single word numbers
  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) return NUMBER_WORDS[word];
  }

  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION EXTRACTION — phrase-first (longer patterns win)
// ─────────────────────────────────────────────────────────────────────────────

function extractAction(text: string): ActionType {
  const lower = text.toLowerCase();

  // Check multi-word action phrases first (longest match wins)
  const allPatterns: Array<[ActionType, string[]]> = Object.entries(ACTION_KEYWORDS).map(
    ([k, v]) => [k as ActionType, v]
  );

  // Sort by keyword length descending so "add cheyyi" beats "add"
  type PatternItem = [ActionType, string];
  const flat: PatternItem[] = [];
  for (const [action, kws] of allPatterns) {
    for (const kw of kws) flat.push([action, kw]);
  }
  flat.sort((a, b) => b[1].length - a[1].length);

  for (const [action, kw] of flat) {
    if (lower.includes(kw)) return action;
  }

  return "UNKNOWN";
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT MATCHING
// ─────────────────────────────────────────────────────────────────────────────

const MIN_MATCH_SCORE = 5;

function scoreProductMatch(lower: string, product: Product): number {
  const pName = product.name.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
  const pCategory = product.category.toLowerCase();
  const pWords = pName.split(/\s+/).filter((w) => w.length > 2);

  let score = 0;

  // Full name match (highest priority)
  if (lower.includes(pName)) {
    return pName.length * 4;
  }

  // Individual product name words
  for (const w of pWords) {
    if (lower.includes(w)) score += w.length * 2;
  }

  // Alias group match — check if the product belongs to a group,
  // and if any alias from that group appears in the spoken text
  for (const group of PRODUCT_CATALOG_ALIASES) {
    const productBelongsToGroup = group.tags.some(
      (tag) => pName.includes(tag) || pCategory.includes(tag)
    );
    if (!productBelongsToGroup) continue;

    const spokenHit = group.aliases.some((alias) =>
      lower.includes(alias.toLowerCase())
    );
    if (spokenHit) {
      score += 20;
      break;
    }
  }

  return score;
}

function findBestProductMatch(text: string, products: Product[]): Product | undefined {
  const lower = text.toLowerCase();
  let bestMatch: Product | undefined = undefined;
  let highestScore = 0;

  for (const p of products) {
    const s = scoreProductMatch(lower, p);
    if (s > highestScore) {
      highestScore = s;
      bestMatch = p;
    }
  }

  return highestScore >= MIN_MATCH_SCORE ? bestMatch : undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK MESSAGE — code-mix aware, friendly output
// ─────────────────────────────────────────────────────────────────────────────

function buildFeedback(
  action: ActionType,
  quantity: number | undefined,
  tradeUnit: TradeUnitKey,
  matchedProduct: Product | undefined,
  codeMix: ReturnType<typeof detectCodeMix>,
  insufficientStock?: { availableTradeUnits: number; requestedTradeUnits: number; unitLabel: string }
): string {
  const prodName = matchedProduct?.name ?? "Item";
  const unitLabel = TRADE_UNITS[tradeUnit]?.label ?? tradeUnit;
  const qty = quantity ?? "?";

  if (insufficientStock) {
    return `⚠️ Not enough stock! You have only ${insufficientStock.availableTradeUnits} ${unitLabel} of ${prodName}, but asked to remove ${insufficientStock.requestedTradeUnits}.`;
  }

  if (action === "SELL") {
    if (codeMix.hastelugu) return `${prodName} ${qty} ${unitLabel} అమ్మకం రికార్డ్ అయింది.`;
    if (codeMix.hasHindi) return `${prodName} ${qty} ${unitLabel} becha gaya.`;
    const remainingUnits = matchedProduct
      ? Math.max(0, Number(((matchedProduct.quantity - (quantity || 0) * (matchedProduct.tradeUnitSize || 1)) / (matchedProduct.tradeUnitSize || 1)).toFixed(1)))
      : 0;
    return `${qty} ${unitLabel} of ${prodName} sold. ${remainingUnits} ${unitLabel} remaining in inventory.`;
  }

  if (action === "ADD") {
    if (codeMix.hastelugu) return `${prodName} కి ${qty} ${unitLabel} add చేస్తున్నారు.`;
    if (codeMix.hasHindi) return `${prodName} mein ${qty} ${unitLabel} joda gaya.`;
    const newUnits = matchedProduct
      ? Number(((matchedProduct.quantity + (quantity || 0) * (matchedProduct.tradeUnitSize || 1)) / (matchedProduct.tradeUnitSize || 1)).toFixed(1))
      : qty;
    return `${qty} ${unitLabel} of ${prodName} added. You now have ${newUnits} ${unitLabel}.`;
  }

  if (action === "CHECK" || action === "QUERY") {
    if (matchedProduct) {
      const unitsLeft = Number((matchedProduct.quantity / (matchedProduct.tradeUnitSize || 1)).toFixed(1));
      if (codeMix.hastelugu) return `మీ వద్ద ${unitsLeft} ${unitLabel} ${prodName} ఉంది.`;
      if (codeMix.hasHindi) return `Aapke paas ${prodName} ${unitsLeft} ${unitLabel} bacha hai.`;
      return `You have ${unitsLeft} ${unitLabel} of ${prodName} in stock.`;
    }
    return `Checking stock in your inventory.`;
  }

  if (action === "LOW_STOCK_QUERY") {
    return `Checking items currently running below their reorder safety level.`;
  }

  if (action === "SALES_QUERY") {
    return `Calculating sales transaction records for ${prodName}...`;
  }

  if (action === "REORDER_QUERY") {
    return `Checking items recommended for purchase based on your reorder levels.`;
  }

  if (action === "SET_REORDER_LEVEL") {
    return `Reorder alert for ${prodName} set to ${qty} ${unitLabel}.`;
  }

  if (action === "REMOVE") {
    return `Deduct ${qty} ${unitLabel} of ${prodName}.`;
  }

  return `Heard: "${codeMix.isMixed ? "code-mixed voice command" : "voice command"}" — confirm or review below.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHONETIC SCRIPT NORMALIZATION (Telugu/Hindi STT -> English/Latin Transliteration)
// ─────────────────────────────────────────────────────────────────────────────

const PHONETIC_TRANSCRIPTIONS: Record<string, string> = {
  // Telugu STT -> English
  "యాడ్": "add", "ఆడ్": "add", "ఏడ్": "add", "యాడ్స్": "add",
  "చెక్": "check", "చేయి": "cheyyi", "చేయండి": "cheyyi",
  "రైస్": "rice", "రాఇస్": "rice", "రైసు": "rice", "బాస్మతి": "basmati",
  "చావల్": "chawal", "బాస్మతిరైస్": "basmati rice",
  "షుగర్": "sugar", "షూగర్": "sugar", "సుగర్": "sugar", "చక్కెర": "sugar",
  "ఆయిల్": "oil", "నూనె": "nune", "సబ్బు": "soap", "సాల్ట్": "salt", "ఉప్పు": "uppu",
  "ఆటా": "atta", "గోధుమ": "atta", "పప్పు": "dal", "దాల్": "dal",
  "కేజీ": "kg", "కేజీలు": "kg", "కెజి": "kg",
  "బ్యాగ్": "bag", "బ్యాగ్స్": "bag", "బ్యాక్": "bag", "బోరి": "bori",
  "కార్టన్": "carton", "కార్టన్లు": "carton",
  "లీటర్": "litre", "లీటర్లు": "litre",
  "డజన్": "dozen", "ఆఫ్": "of",
  // Hindi STT -> English
  "ऐड": "add", "चेक": "check", "करो": "karo",
  "राइस": "rice", "चावल": "chawal", "शुगर": "sugar", "चीनी": "sugar",
  "ऑयल": "oil", "तेल": "tel", "साबुन": "soap", "नमक": "salt",
  "आटा": "atta", "दाल": "dal", "केजी": "kg", "बैग": "bag", "बोरी": "bori",
  "कार्टन": "carton", "लीटर": "litre", "दर्जन": "dozen"
};

function normalizePhoneticScript(text: string): string {
  let normalized = text;
  for (const [scriptWord, latinWord] of Object.entries(PHONETIC_TRANSCRIPTIONS)) {
    normalized = normalized.split(scriptWord).join(latinWord);
  }
  return normalized;
}

function extractCandidateProductName(text: string): string {
  const lower = normalizePhoneticScript(text.toLowerCase());

  for (const group of PRODUCT_CATALOG_ALIASES) {
    for (const alias of group.aliases) {
      if (lower.includes(alias.toLowerCase())) {
        if (group.tags.includes("rice")) return "Basmati Rice";
        if (group.tags.includes("oil")) return "Sunflower Oil";
        if (group.tags.includes("sugar")) return "Sugar";
        if (group.tags.includes("soap")) return "Bath Soap";
        if (group.tags.includes("atta")) return "Aashirvaad Atta";
        if (group.tags.includes("salt")) return "Iodized Salt";
        if (group.tags.includes("tea")) return "Tea Powder";
        if (group.tags.includes("dal")) return "Toor Dal";
        if (group.tags.includes("eggs")) return "Eggs";
        if (group.tags.includes("milk")) return "Milk Packet";
        if (group.tags.includes("biscuit")) return "Parle-G Biscuits";
        if (group.tags.includes("noodle")) return "Maggi Noodles";
        if (group.tags.includes("chips")) return "Lays Chips";
        if (group.tags.includes("chocolate")) return "Dairy Milk Chocolate";
        if (group.tags.includes("coffee")) return "Nescafe Coffee";
        if (group.tags.includes("colddrink")) return "Thums Up Soft Drink";
        if (group.tags.includes("masala")) return "Red Chilli Powder";
        if (group.tags.includes("detergent")) return "Surf Excel Detergent";
        if (group.tags.includes("dishwash")) return "Vim Dishwash Bar";
        if (group.tags.includes("shampoo")) return "Clinic Plus Shampoo";
        if (group.tags.includes("toothpaste")) return "Colgate Toothpaste";
        if (group.tags.includes("matchbox")) return "Agarbatti & Matchbox";
        if (group.tags.includes("mosquito")) return "Good Knight Refill";
        if (group.tags.includes("dryfruit")) return "Cashews (Kaju)";
      }
    }
  }

  let cleaned = lower
    .replace(/\b(add|remove|check|sold|received|set|cheyyi|karo|of|ki|ka|nundi|aayi|vachindi)\b/gi, "")
    .replace(/\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|rendu|moodu|naalugu|aaidu|aaru|ek|do|teen|char|paanch)\b/gi, "")
    .replace(/\b(kg|bag|bags|bori|borii|carton|cartons|box|boxes|dozen|litre|litres|packet|packets|piece|pieces|unit|units)\b/gi, "")
    .replace(/[^\w\s]/gi, "")
    .trim();

  if (cleaned.length > 2) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return "New Spoken Product";
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PARSE ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────

export function parseVoiceIntent(
  rawText: string,
  products: Product[],
  currentLang: string = "hi-IN"
): ParsedVoiceIntent {
  const text = rawText.trim();

  if (!text) {
    return {
      rawText: "",
      action: "UNKNOWN",
      confidence: 0,
      language: currentLang,
      feedbackMessage: "No voice text detected.",
    };
  }

  const normalizedText = normalizePhoneticScript(text);
  const codeMix        = detectCodeMix(normalizedText);
  const action         = extractAction(normalizedText);
  const quantity       = extractQuantity(normalizedText);
  const matchedUnitKey = matchTradeUnit(normalizedText);
  const matchedProduct = findBestProductMatch(normalizedText, products);
  const candidateName  = matchedProduct?.name || extractCandidateProductName(text);

  const tradeUnit: TradeUnitKey =
    matchedUnitKey ??
    (matchedProduct ? matchedProduct.tradeUnit : "bag");

  const tradeUnitSize =
    matchedProduct?.tradeUnitSize ??
    (TRADE_UNITS[tradeUnit]?.defaultMultiplier ?? 1);

  const baseQuantityCalculated =
    quantity !== undefined ? quantity * tradeUnitSize : undefined;

  // Confidence — boosted for code-mixed because we handle it explicitly
  let confidence = 0.2;
  let insufficientStock = undefined;
  if ((action === "SELL" || action === "REMOVE") && matchedProduct && quantity !== undefined) {
    const availableUnits = Number((matchedProduct.quantity / tradeUnitSize).toFixed(1));
    if (quantity > availableUnits) {
      insufficientStock = {
        availableTradeUnits: availableUnits,
        requestedTradeUnits: quantity,
        unitLabel: TRADE_UNITS[tradeUnit]?.label || tradeUnit,
      };
    }
  }

  const feedbackMessage = buildFeedback(action, quantity, tradeUnit, matchedProduct, codeMix, insufficientStock);

  return {
    rawText: text,
    action,
    productName: candidateName,
    matchedProduct,
    quantity,
    tradeUnit,
    baseQuantityCalculated,
    targetThreshold: action === "SET_REORDER_LEVEL" ? quantity : undefined,
    insufficientStock,
    confidence: Math.min(1, Number(confidence.toFixed(2))),
    language: currentLang,
    feedbackMessage,
  };
}

/**
 * Parse single or multi-item compound spoken utterances.
 * Example: "Add 5 bags of rice and 12 dozens of eggs"
 * Splits by " and ", " aur ", " మరియు ", ",", "&" and parses each item independently.
 */
export function parseCompoundVoiceIntents(
  rawText: string,
  products: Product[],
  currentLang: string = "hi-IN"
): ParsedVoiceIntent[] {
  const text = rawText.trim();
  if (!text) return [];

  // Split by conjunctions
  const parts = text.split(/\b(?:and|aur|మరియు|మరియూ|&)\b|,/gi).map((p) => p.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return [parseVoiceIntent(text, products, currentLang)];
  }

  const firstIntent = parseVoiceIntent(parts[0], products, currentLang);
  const defaultAction = firstIntent.action !== "UNKNOWN" ? firstIntent.action : "ADD";

  const results: ParsedVoiceIntent[] = [firstIntent];

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    let intent = parseVoiceIntent(part, products, currentLang);
    if (intent.action === "UNKNOWN") {
      intent = { ...intent, action: defaultAction };
    }
    results.push(intent);
  }

  return results;
}
