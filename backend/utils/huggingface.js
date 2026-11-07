import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.useBrowserCache = false;
try {
  env.backends.onnx.wasm.numThreads = 1;
} catch {
  // ignore backend tuning failures
}

const HF_TOKEN = () => String(process.env.HF_TOKEN || "").trim();
const CHAT_MODEL = () =>
  process.env.HF_CHAT_MODEL || "openai/gpt-oss-20b:cheapest";

let embedder;
let sentiment;
let writer;
let localDisabled = false;
let lastProviderNote = "";
const productEmbedCache = new Map();

const ensureTokenHeader = () => {
  const token = HF_TOKEN();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const cleanGenerated = (text) =>
  String(text || "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

const tokensOf = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

const cosine = (a, b) => {
  let dot = 0;
  let left = 0;
  let right = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    dot += a[i] * b[i];
    left += a[i] * a[i];
    right += b[i] * b[i];
  }
  if (!left || !right) return 0;
  return dot / (Math.sqrt(left) * Math.sqrt(right));
};

const keywordScore = (query, blob) => {
  const left = new Set(tokensOf(query));
  const right = new Set(tokensOf(blob));
  if (!left.size || !right.size) return 0;
  let hit = 0;
  left.forEach((word) => {
    if (right.has(word)) hit += 1;
  });
  return hit / left.size;
};

const getEmbedder = async () => {
  if (localDisabled) throw new Error("Local HF models unavailable on this machine");
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
};

const getSentiment = async () => {
  if (localDisabled) throw new Error("Local HF models unavailable on this machine");
  if (!sentiment) {
    sentiment = await pipeline(
      "sentiment-analysis",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
    );
  }
  return sentiment;
};

const getWriter = async () => {
  if (localDisabled) throw new Error("Local HF models unavailable on this machine");
  if (!writer) {
    writer = await pipeline("text2text-generation", "Xenova/LaMini-Flan-T5-248M");
  }
  return writer;
};

export const embedText = async (text) => {
  const pipe = await getEmbedder();
  const output = await pipe(String(text || "").slice(0, 800), {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
};

export const analyzeSentiment = async (text) => {
  const value = String(text || "").trim();
  try {
    const pipe = await getSentiment();
    const result = await pipe(value.slice(0, 500));
    const row = Array.isArray(result) ? result[0] : result;
    const label = String(row?.label || "NEUTRAL").toUpperCase();
    if (label.includes("POS")) return { label: "positive", score: Number(row.score) || 0 };
    if (label.includes("NEG")) return { label: "negative", score: Number(row.score) || 0 };
    return { label: "neutral", score: Number(row.score) || 0 };
  } catch (error) {
    localDisabled = true;
    const lower = value.toLowerCase();
    const bad = ["bad", "poor", "late", "worst", "refund", "damage", "cheap quality", "waste"];
    const good = ["good", "love", "great", "best", "nice", "quality", "fast", "amazing", "perfect"];
    const neg = bad.some((word) => lower.includes(word));
    const pos = good.some((word) => lower.includes(word));
    if (pos && !neg) return { label: "positive", score: 0.6 };
    if (neg && !pos) return { label: "negative", score: 0.6 };
    return { label: "neutral", score: 0.5 };
  }
};

export const chatWithProvider = async (messages, { maxTokens = 220 } = {}) => {
  const token = HF_TOKEN();
  if (!token) {
    const error = new Error("HF_TOKEN is missing");
    error.code = "NO_TOKEN";
    throw error;
  }

  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      ...ensureTokenHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL(),
      messages,
      max_tokens: maxTokens,
      temperature: 0.5,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.error ||
      `Hugging Face chat failed (${response.status})`;
    const error = new Error(typeof message === "string" ? message : JSON.stringify(message));
    error.code = response.status === 402 ? "NO_CREDITS" : "HF_ERROR";
    error.status = response.status;
    throw error;
  }

  return cleanGenerated(data?.choices?.[0]?.message?.content || "");
};

const templateDescription = ({ name, category, subCategory, colors = [] }) => {
  const colorText = (Array.isArray(colors) ? colors : [])
    .map((color) => (typeof color === "string" ? color : color?.name))
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const type = subCategory || category || "fashion";
  return (
    `${name} is a ${type.toLowerCase()} piece from Charu Garments, made for everyday comfort with a clean finish` +
    `${colorText ? ` in ${colorText}` : ""}. Soft feel, easy fit, and ready for casual or smart looks.`
  );
};

export const generateProductDescription = async ({
  name,
  category,
  subCategory,
  colors = [],
}) => {
  const prompt =
    `Write a short attractive product description for an Indian clothing store. ` +
    `Product: ${name}. Category: ${category || "Fashion"}${subCategory ? ` / ${subCategory}` : ""}. ` +
    `Keep it under 60 words. No hashtags.`;

  try {
    const remote = await chatWithProvider(
      [
        {
          role: "system",
          content:
            "You write concise product copy for Charu Garments, a clothing store in India. Use simple English.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 140 },
    );
    if (remote) return { text: remote, source: "huggingface-chat" };
  } catch (error) {
    lastProviderNote = error.message;
  }

  try {
    const pipe = await getWriter();
    const local = await pipe(prompt, { max_new_tokens: 90 });
    const text = cleanGenerated(local?.[0]?.generated_text || local?.generated_text || "");
    if (text) return { text, source: "local-model", note: lastProviderNote };
  } catch (error) {
    localDisabled = true;
    lastProviderNote = lastProviderNote || error.message;
  }

  return {
    text: templateDescription({ name, category, subCategory, colors }),
    source: "template",
    note: lastProviderNote,
  };
};

export const answerShoppingQuestion = async ({ question, products = [], siteSettings = {} }) => {
  const q = String(question || "").trim();
  if (!q) throw new Error("Enter a question");

  let matches = [];
  try {
    const queryVec = await embedText(q);
    for (const product of products) {
      const blob = [
        product.name,
        product.category,
        product.subCategory,
        product.description,
        product.sellerName,
      ]
        .filter(Boolean)
        .join(" ");
      const cacheKey = `${product._id}:${blob}`;
      let vector = productEmbedCache.get(cacheKey);
      if (!vector) {
        vector = await embedText(blob);
        productEmbedCache.set(cacheKey, vector);
      }
      matches.push({ product, score: cosine(queryVec, vector) });
    }
    matches = matches
      .sort((a, b) => b.score - a.score)
      .filter((row) => row.score > 0.22)
      .slice(0, 4);
  } catch (error) {
    localDisabled = true;
    lastProviderNote = error.message;
    matches = products
      .map((product) => {
        const blob = `${product.name} ${product.category} ${product.subCategory} ${product.description}`;
        return { product, score: keywordScore(q, blob) };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  const catalog = matches
    .map(
      ({ product, score }) =>
        `- ${product.name} | ${product.category}/${product.subCategory || "General"} | ₹${product.price}` +
        `${product.sellerName ? ` | Sold by ${product.sellerName}` : ""}` +
        ` (match ${Number(score).toFixed(2)})`,
    )
    .join("\n");

  const storeFacts = [
    siteSettings.phone ? `Phone: ${siteSettings.phone}` : "",
    siteSettings.email ? `Email: ${siteSettings.email}` : "",
    siteSettings.address ? `Store: ${siteSettings.address}` : "",
    "Pickup from store is available.",
    "Delivery OTP and shipping are handled by Charu Garments.",
    "Refunds go to the customer wallet after approval.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const remote = await chatWithProvider(
      [
        {
          role: "system",
          content:
            "You are Charu Garments shopping assistant. Answer briefly in simple English or Hinglish if the user uses Hinglish. Use only the store facts and product list. If unsure, say so.",
        },
        {
          role: "user",
          content: `Store facts:\n${storeFacts}\n\nRelevant products:\n${catalog || "None matched"}\n\nCustomer question: ${q}`,
        },
      ],
      { maxTokens: 180 },
    );
    if (remote) {
      return {
        answer: remote,
        products: matches.map(({ product }) => ({
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.image?.[0] || "",
          sellerName: product.sellerName || "Charu Garments",
        })),
        source: "huggingface-chat",
      };
    }
  } catch (error) {
    lastProviderNote = error.message;
  }

  if (matches.length) {
    const top = matches
      .slice(0, 3)
      .map(({ product }) => `${product.name} (₹${product.price})`)
      .join(", ");
    return {
      answer: `Based on your question, these look closest: ${top}. Open Collection and filter by Men, Women, or Kids for more. For pickup, delivery, or refund help, check Contact in the footer.`,
      products: matches.map(({ product }) => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image?.[0] || "",
        sellerName: product.sellerName || "Charu Garments",
      })),
      source: localDisabled ? "keyword-search" : "local-search",
      note: lastProviderNote,
    };
  }

  return {
    answer:
      "I could not find a close product match. Try Collection filters for Men, Women, or Kids, or ask about size, delivery, pickup, refund, or wallet.",
    products: [],
    source: "fallback",
    note: lastProviderNote,
  };
};

export const semanticProductSearch = async (query, products = []) => {
  const q = String(query || "").trim();
  if (!q) return [];
  try {
    const queryVec = await embedText(q);
    const scored = [];
    for (const product of products) {
      const blob = [product.name, product.category, product.subCategory, product.description]
        .filter(Boolean)
        .join(" ");
      const vector = await embedText(blob);
      scored.push({ product, score: cosine(queryVec, vector) });
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .filter((row) => row.score > 0.2)
      .slice(0, 24)
      .map(({ product, score }) => ({ ...(product.toObject?.() || product), aiScore: score }));
  } catch {
    return products
      .map((product) => {
        const blob = `${product.name} ${product.category} ${product.subCategory} ${product.description}`;
        return { product, score: keywordScore(q, blob) };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24)
      .map(({ product, score }) => ({ ...(product.toObject?.() || product), aiScore: score }));
  }
};

export const warmAiModels = async () => {
  try {
    await getEmbedder();
    console.log("Hugging Face local search model ready");
  } catch (error) {
    localDisabled = true;
    console.error("Local HF search model unavailable:", error.message);
  }
};
