import { type NextRequest } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

type InventoryInsight = {
  name: string;
  stockPct: number;
  currentStock: number;
  maxStock: number;
  price: number;
  unitsPerDay: number;
  daysOfStockRemaining: number | null;
  urgencyLabel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
};

type RichUserContext = {
  role: string;
  orgName: string;
  inventoryInsights: InventoryInsight[];
  orderHealth: {
    pendingCount: number;
    fulfilledLast7Days: number;
    mostOrderedItemName: string;
  };
  revenueSnapshot: {
    last7DayRevenue: number;
    trendLabel: string;
    topSellerByQty: string;
    topSellerByRevenue: string;
  } | null;
  partnersSummary: string;
};

function buildSystemPrompt(ctx: RichUserContext): string {
  const inventoryLines = ctx.inventoryInsights.length > 0
    ? ctx.inventoryInsights.map(item => {
        const daysStr = item.daysOfStockRemaining !== null
          ? `${item.daysOfStockRemaining} days remaining`
          : 'not moving — possible dead stock';
        const velocityStr = item.unitsPerDay > 0 ? `${item.unitsPerDay} units/day` : '0 units/day';
        return `  • ${item.name}: ${item.stockPct}% stock (${item.currentStock}/${item.maxStock}) | ${velocityStr} | ${daysStr} | URGENCY: ${item.urgencyLabel} | ₹${item.price}/unit`;
      }).join('\n')
    : '  • No inventory data available.';

  const revenueLines = ctx.revenueSnapshot
    ? [
        `  • Revenue (last 7 days): ₹${ctx.revenueSnapshot.last7DayRevenue} | ${ctx.revenueSnapshot.trendLabel}`,
        `  • Top seller by qty: ${ctx.revenueSnapshot.topSellerByQty}`,
        `  • Top seller by revenue: ${ctx.revenueSnapshot.topSellerByRevenue}`,
      ].join('\n')
    : '  • No POS revenue data for this role.';

  const roleDirective =
    ctx.role === 'Retailer'
      ? 'Focus on POS velocity, revenue trends, and when/how much to reorder from distributors.'
      : ctx.role === 'Distributor'
      ? 'Focus on fulfilling downstream orders efficiently and managing upstream restocks proactively.'
      : 'Focus on production scheduling and maintaining adequate stock for high-demand items.';

  return `You are Pulse AI, the intelligent supply-chain assistant built into KiranaPulse — a B2B supply chain simulation platform.

CURRENT USER CONTEXT:
- Role: ${ctx.role}
- Organization: ${ctx.orgName}
- Partners: ${ctx.partnersSummary}

INVENTORY ANALYSIS (velocity predictions based on last 14 days of sales):
${inventoryLines}

ORDER HEALTH:
  • Pending orders: ${ctx.orderHealth.pendingCount}
  • Fulfilled in last 7 days: ${ctx.orderHealth.fulfilledLast7Days}
  • Most frequently ordered item: ${ctx.orderHealth.mostOrderedItemName}

REVENUE SNAPSHOT:
${revenueLines}

PLATFORM RULES:
- Supply chain tiers: Manufacturer → Distributor → Retailer.
- Auto-restock triggers at 30% stock threshold.
- Only Retailers have the POS (Point of Sale) system.

YOUR BEHAVIOR:
- Be concise and data-driven. Use bullet points for multi-item analyses.
- ${roleDirective}
- When recommending restocks, rank by urgency: CRITICAL → HIGH → MEDIUM → LOW.
- For reorder quantity, target 21 days of coverage: recommendedQty = ceil(unitsPerDay × 21) − currentStock.
- Flag "not moving" items as potential dead stock — recommend reducing orders or running promotions.
- Always cite the specific numbers provided. Never speculate without data.
- If data is sparse (no recent transactions), acknowledge it and offer general supply chain advice.`;
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return Response.json({ error: 'Gemini API key not configured.' }, { status: 500 });
  }

  const body = await request.json();
  const messages: ChatMessage[] = body.messages ?? [];
  const userContext: RichUserContext = body.userContext ?? {
    role: 'Unknown',
    orgName: 'Unknown',
    inventoryInsights: [],
    orderHealth: { pendingCount: 0, fulfilledLast7Days: 0, mostOrderedItemName: 'N/A' },
    revenueSnapshot: null,
    partnersSummary: 'N/A',
  };

  const systemPrompt = buildSystemPrompt(userContext);

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood. I am Pulse AI — I have analyzed your inventory velocity, order health, and revenue data. How can I help?' }] },
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  ];

  try {
    const geminiResponse = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return Response.json({ error: 'Gemini API request failed.' }, { status: geminiResponse.status });
    }

    const reader = geminiResponse.body?.getReader();
    if (!reader) {
      return Response.json({ error: 'No response stream.' }, { status: 500 });
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { controller.close(); return; }

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip malformed chunks */ }
          }
        }
      },
      cancel() { reader.cancel(); },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
