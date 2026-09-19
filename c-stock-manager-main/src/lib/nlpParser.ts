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
  ADD: [
    "add", "added", "adding", "receive", "received", "stock in", "purchase",
    "buying", "bought", "incoming", "new stock", "fill",
    ...CODE_MIXED_ADD_VERBS,
  ],
  REMOVE: [
    "remove", "issue", "issued", "sell", "sold", "selling", "deduct", "dispatch",
    "outgoing", "stock out",
    ...CODE_MIXED_REMOVE_VERBS,
  ],
  SET: [
    "set", "update", "current stock", "stock is", "hai", "rakho", "marpu",
    "मात्रा","स्टॉक","ఉంది","இருக்கிறது",
  ],
  QUERY: [
    "how much", "how many", "check", "stock of", "balance", "remaining",
    ...CODE_MIXED_QUERY_VERBS,
  ],
  REORDER: [
    "reorder", "order", "shortage", ...CODE_MIXED_REORDER_VERBS,
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
      // English
      "eggs","egg","dozen eggs","egg tray","farm eggs",
      // Hindi/Hinglish
      "anda","ande","अंडा","अंडे","anda tray",
      // Telugu/Tenglish
      "guddu","gudlu","గుడ్డు","గుడ్లు","కోడి గుడ్లు",
      // Tamil/Tanglish
      "muttai","mutta","முட்டை",
      // code-mixed
      "eggs add karo","gudlu check cheyyi","anda stock",
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
  codeMix: ReturnType<typeof detectCodeMix>
): string {
  const prodName = matchedProduct?.name ?? "(product — please select below)";
  const unitLabel = TRADE_UNITS[tradeUnit]?.label ?? tradeUnit;
  const qty = quantity ?? "?";

  // Choose feedback style based on detected language mix
  if (codeMix.hastelugu) {
    if (action === "ADD")    return `${prodName} కి ${qty} ${unitLabel} add చేస్తున్నారు.`;
    if (action === "REMOVE") return `${prodName} నుండి ${qty} ${unitLabel} తొలగిస్తున్నారు.`;
    if (action === "QUERY")  return `${prodName} stock ఎంత ఉందో చూస్తున్నారు.`;
  }
  if (codeMix.hasHindi) {
    if (action === "ADD")    return `${prodName} mein ${qty} ${unitLabel} add ho raha hai.`;
    if (action === "REMOVE") return `${prodName} se ${qty} ${unitLabel} nikalenge.`;
    if (action === "QUERY")  return `${prodName} ka stock check ho raha hai.`;
  }

  // Default English
  if (action === "ADD")    return `Add ${qty} ${unitLabel} of ${prodName}.`;
  if (action === "REMOVE") return `Deduct ${qty} ${unitLabel} of ${prodName}.`;
  if (action === "QUERY")  return matchedProduct
    ? `Checking stock for ${matchedProduct.name}.`
    : `Checking total inventory.`;
  if (action === "REORDER") return `Showing low stock items for reordering.`;

  return `Heard: "${codeMix.isMixed ? "code-mixed input" : "input"}" — confirm or correct below.`;
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
  if (action !== "UNKNOWN")          confidence += 0.3;
  if (quantity !== undefined)         confidence += 0.2;
  if (matchedProduct !== undefined)   confidence += 0.25;
  if (codeMix.isMixed)                confidence += 0.05; // bonus for code-mix recognition

  const feedbackMessage = buildFeedback(action, quantity, tradeUnit, matchedProduct, codeMix);

  return {
    rawText: text,
    action,
    productName: candidateName,
    matchedProduct,
    quantity,
    tradeUnit,
    baseQuantityCalculated,
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
