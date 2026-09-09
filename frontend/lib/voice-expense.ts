import type { ExpenseCreate, ExpenseCategory } from "./types";

const categories: [ExpenseCategory, RegExp][] = [
  ["transport", /\b(in\s?drive|uber|careem|yango|rickshaw|bus|taxi|petrol|fuel|ride)\b/i],
  ["groceries", /\b(grocer\w*|supermarket|vegetables|fruit|milk)\b/i],
  ["food", /\b(chai|paratha|coffee|tea|lunch|dinner|breakfast|food|cafe|restaurant|pizza|burger)\b/i],
  ["books", /\b(book\w*|stationery|notebook\w*|printing)\b/i],
  ["rent", /\b(rent|hostel)\b/i],
  ["utilities", /\b(electricity|internet|wifi|water bill|gas bill|phone bill)\b/i],
];

// Recognition engines usually produce digits. Also accept simple spoken English amounts.
const words: Record<string, number> = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
function wordAmount(text: string): number | null {
  let total = 0, group = 0, found = false;
  for (const word of text.trim().toLowerCase().split(/[\s-]+/)) {
    if (word === "and") continue;
    if (words[word]) { group += words[word]; found = true; }
    else if (word === "hundred" && group) group *= 100;
    else if ((word === "thousand" || word === "lakh") && group) {total += group * (word === "lakh" ? 100000 : 1000); group = 0;}
    else return null;
  }
  return found ? total + group : null;
}

export function parseVoiceExpense(transcript: string): ExpenseCreate {
  const text = transcript.trim().replace(/^hey[,.!]?\s+pocket(?:\s*campus)?[,.!]?\s*/i, "");
  if (/\b(yesterday|last|tomorrow|refund|received|earned|income|dollars?|usd|euros?)\b/i.test(text)) {
    throw new Error("Voice entry supports today's expenses in rupees. Please enter this expense manually.");
  }
  const digits = text.match(/\d[\d,]*(?:\.\d+)?/g) || [];
  if (digits.length > 1 || /[-−]\s*\d/.test(text)) throw new Error("I heard more than one amount or a negative amount. Please say one expense at a time.");
  let amount: number | null = null;
  let amountText = "";
  if (digits.length === 1) {
    amountText = digits[0];
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(amountText)) throw new Error("Please repeat the amount clearly, with up to two decimal places.");
    amount = Number(amountText.replace(/,/g, ""));
  } else {
    const match = text.match(/(?:spent|spended|paid|spend)\s+(.+?)\s+(?:rupees?|rupess|rs\b|pkr\b)/i);
    if (match) { amount = wordAmount(match[1]); amountText = match[1]; }
  }
  if (amount === null || !Number.isFinite(amount) || amount <= 0 || amount > 999999999) throw new Error("I couldn't identify one clear amount. Try: Hey Pocket, I spent 500 rupees at inDrive.");
  const description = text.replace(amountText, " ")
    .replace(/\b(?:i|just|have|spended|spent|spend|paid|rupees?|rupess|rs|pkr)\b/gi, " ")
    .replace(/^[\s,.!:;-]*(?:at|on|for)\b\s*/i, "").replace(/\s+/g, " ").trim().replace(/[.!?,]+$/, "");
  if (!description || description.length > 120) throw new Error("Please say what you spent it on, for example: 500 rupees at inDrive.");
  const matches = categories.filter(([,pattern]) => pattern.test(description));
  return { amount, description, currency: "PKR", category: matches.length === 1 ? matches[0][0] : "other" };
}
