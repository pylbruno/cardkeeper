// Vercel Serverless Function：代理 Anthropic API 查詢信用卡優惠。
// API key 只存在伺服器端環境變數（ANTHROPIC_API_KEY），絕不可放進前端程式碼。

// Firebase Web API key 是公開識別碼（與 src/firebase.js 相同），非機密。
const FIREBASE_API_KEY = "AIzaSyBcJHTYrzdK4AF5dsWkekYFJYHgqMb-dB0";

async function verifyFirebaseToken(idToken) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.users?.[0] || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 只有已登入的使用者能呼叫，避免端點被陌生流量白嫖 API 額度
  const idToken = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!idToken) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  const user = await verifyFirebaseToken(idToken).catch(() => null);
  if (!user) {
    return res.status(401).json({ error: "Invalid auth token" });
  }

  const { bank, cardType } = req.body || {};
  if (
    typeof bank !== "string" || typeof cardType !== "string" ||
    !bank.trim() || !cardType.trim() || bank.length > 30 || cardType.length > 50
  ) {
    return res.status(400).json({ error: "Invalid bank or cardType" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const prompt = `你是台灣信用卡優惠專家。請搜尋並整理「${bank} ${cardType}」的最新刷卡優惠，以純 JSON 陣列回覆（不含 markdown），格式：[{"title":"...","tags":["..."],"rate":2.5,"cap":300,"maxSpend":12000}]，提供 3-4 筆，cap/maxSpend 無上限設 null。`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error("Anthropic API error", r.status, data?.error?.message);
      return res.status(502).json({ error: "Upstream API error" });
    }

    const text = (data.content || [])
      .map(b => (b.type === "text" ? b.text : ""))
      .join("\n");
    // 模型偶爾會在 JSON 前後加說明文字，擷取第一個陣列再解析
    const match = text.match(/\[[\s\S]*\]/);
    const benefits = JSON.parse(match ? match[0] : text.replace(/```json|```/g, "").trim());
    if (!Array.isArray(benefits)) throw new Error("not an array");

    return res.status(200).json(benefits);
  } catch (e) {
    console.error("benefits handler failed", e);
    return res.status(502).json({ error: "Failed to fetch benefits" });
  }
}
