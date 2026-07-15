import Groq from 'groq-sdk';
import { config } from '../config/config.js';

const groq = new Groq({ apiKey: config.groq.apiKey });

export interface ExtractedTransaction {
  date: string;
  merchant: string;
  amount: number;
  category: string;
}

export interface StatementAnalysis {
  transactions:       ExtractedTransaction[];
  flagged:            { merchant: string; amount: number; reason: string }[];
  summary:            string;
  total_spent:        number;
  total_transactions: number;
}

function chunkText(text: string, maxChars = 2800): string[] {
  const lines = text.split('\n');
  const chunks: string[] = [];
  let current = '';
  for (const line of lines) {
    if ((current + line).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    current += line + '\n';
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function extractTransactionSection(text: string): string {
  const startMarkers = ['TRANSACTION', 'DÉBITS / CRÉDITS', 'DEBITS / CREDITS'];
  let startIdx = 0;
  for (const marker of startMarkers) {
    const idx = text.indexOf(marker);
    if (idx > 0) { startIdx = Math.max(0, idx - 100); break; }
  }
  const endMarkers = [
    'VEUILLEZ EFFECTUER VOTRE PAIEMENT',
    'PLEASE MAKE YOUR PAYMENT ONLINE',
    'RÉPARTITION DU PAIEMENT',
    'HOW PAYMENTS ARE APPLIED',
    'TAUX D\'INTÉRÊT / ACHATS',
  ];
  let endIdx = text.length;
  for (const marker of endMarkers) {
    const idx = text.indexOf(marker, startIdx);
    if (idx > startIdx + 500) { endIdx = idx; break; }
  }
  return text.slice(startIdx, endIdx);
}

async function analyzeChunk(chunk: string): Promise<ExtractedTransaction[]> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are a precise financial transaction extractor for Canadian bank/credit card statements.

This is a BNC (Banque Nationale) Mastercard statement format. Each transaction row contains:
- Transaction date (MM DD)
- Reference number
- Posted date (MM DD)  
- Merchant description + city + province
- Amount (positive = purchase/debit, ending with "-" = payment/credit)

EXCLUDE these — do NOT include in output:
- Any amount ending in "-" → these are payments or credits coming IN (e.g. "200.00-", "1000.00-")
- Lines with PAIEMENT RECU MERCI → credit card payments
- Lines with REMISE → cashback rewards  
- Lines with PROGRAMME → reward programs
- Lines with ASS. DISTINCTION → insurance
- Lines with SOLDE PRÉCÉDENT → previous balance
- The summary rows at the bottom (ACHATS/AUTRES, TOTAL, etc.)

For foreign currency transactions: when you see "MONTANT ORIGINAL EN DEVISE CAD X.XX" on a line AFTER a merchant, the X.XX is the CAD amount — use that as the transaction amount, not the foreign amount.

Return ONLY a valid JSON array, no markdown, no explanation.`,
      },
      {
        role: 'user',
        content: `Extract all purchase/expense transactions from this statement chunk.

Return ONLY a JSON array in this exact format:
[
  {
    "date": "2026-MM-DD",
    "merchant": "Clean Merchant Name",
    "amount": 12.99,
    "category": "Groceries|Dining|Transport|Housing|Utilities|Healthcare|Entertainment|Shopping|Subscriptions|Travel|Education|Other"
  }
]

Rules:
- Use 2026 as the year for all dates
- Clean merchant names: "TIM HORTONS #2439 LASALLE QC" → "Tim Hortons", "PROXI LASALLE LASALLE QC" → "Proxi Lasalle", "MCDONALD'S #40054 VAUDREUIL-DOR QC" → "McDonald's"
- SKIP any line where the amount ends in "-"
- SKIP PAIEMENT RECU MERCI, REMISE, PROGRAMME lines
- For foreign currency: look for "MONTANT ORIGINAL EN DEVISE CAD X.XX" — use that X.XX CAD amount
- Dining: restaurants, fast food, cafes (Tim Hortons, McDonald's, Dairy Queen, etc.)
- Groceries: grocery stores, Proxi, IGA, Metro, Maxi
- Transport: gas, transit, Uber, parking, Chrono-Recharge Opus
- Shopping: clothing, retail stores, Amazon, Winners, Old Navy, Dollarama
- Entertainment: Steam, games, events, Centre Bell, cinema
- Subscriptions: Netflix, Spotify, Audible, Apple, Google
- Travel: Airbnb, hotels, flights

Statement chunk:
${chunk}`,
      },
    ],
    temperature: 0.05,
    max_tokens: 2048,
  });

  const text = completion.choices[0]?.message?.content ?? '';
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) return [];

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as ExtractedTransaction[];
    return parsed.filter(t =>
      t.amount > 0 &&
      t.amount < 10000 &&
      t.merchant &&
      t.merchant.length > 1
    );
  } catch {
    return [];
  }
}

export async function analyzeStatement(pdfText: string): Promise<StatementAnalysis> {
  const transactionText = extractTransactionSection(pdfText);
  console.log('Transaction section length:', transactionText.length);

  const chunks = chunkText(transactionText, 2800);
  console.log('Processing', chunks.length, 'chunks');

  const allTransactions: ExtractedTransaction[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}`);
    try {
      const txns = await analyzeChunk(chunks[i]);
      console.log(`Chunk ${i + 1} returned ${txns.length} transactions`);
      allTransactions.push(...txns);
      if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.error(`Chunk ${i + 1} failed:`, err);
    }
  }

  // Deduplicate by date + merchant + amount
  const seen = new Set<string>();
  const unique = allTransactions.filter(t => {
    const key = `${t.date}-${t.merchant}-${t.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Flag large transactions over $100
  const flagged = unique
    .filter(t => t.amount > 100)
    .map(t => ({
      merchant: t.merchant,
      amount:   t.amount,
      reason:   t.amount > 500 ? 'Very large transaction' : 'Transaction over $100',
    }));

  const totalSpent = unique.reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = unique.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const summary = `Found ${unique.length} transactions totaling $${totalSpent.toFixed(2)} CAD this period. ` +
    `Top spending: ${topCategories.map(([cat, amt]) => `${cat} ($${amt.toFixed(2)})`).join(', ')}.`;

  return {
    transactions:       unique,
    flagged,
    summary,
    total_spent:        Math.round(totalSpent * 100) / 100,
    total_transactions: unique.length,
  };
}