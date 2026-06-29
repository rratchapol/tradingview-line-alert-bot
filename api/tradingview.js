const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readPayload(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }

  return {};
}

function formatSignalMessage(payload) {
  const side = String(payload.side || "SETUP").toUpperCase();
  const symbol = payload.symbol || payload.ticker || "Unknown symbol";
  const price = payload.price || payload.close || "-";
  const timeframe = payload.timeframe || "15M";
  const setup = payload.setup || "VWAP Bounce EMA Stack";
  const bias = payload.bias || "-";
  const entry = payload.entry || price;
  const stopLoss = payload.sl || payload.stopLoss || "-";
  const takeProfit = payload.tp || payload.takeProfit || "-";
  const rr = payload.rr || payload.riskReward || "-";
  const time = payload.time || new Date().toISOString();

  const reasons = Array.isArray(payload.reasons)
    ? payload.reasons.map((reason) => `- ${reason}`).join("\n")
    : payload.reason
      ? `- ${payload.reason}`
      : "- Checklist passed";

  return [
    `${symbol} ${side} ALERT`,
    "",
    `Setup: ${setup}`,
    `Timeframe: ${timeframe}`,
    `Price: ${price}`,
    `Bias: ${bias}`,
    `Entry: ${entry}`,
    `SL: ${stopLoss}`,
    `TP: ${takeProfit}`,
    `R:R: ${rr}`,
    `Time: ${time}`,
    "",
    "Checklist:",
    reasons
  ].join("\n");
}

async function pushLineMessage(text) {
  const token = getEnv("LINE_CHANNEL_ACCESS_TOKEN");
  const userId = getEnv("LINE_USER_ID");

  const response = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: userId,
      messages: [
        {
          type: "text",
          text
        }
      ]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${body}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = readPayload(req);
    const expectedSecret = getEnv("ALERT_WEBHOOK_SECRET");

    if (payload.secret !== expectedSecret) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    const message = formatSignalMessage(payload);
    await pushLineMessage(message);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to process TradingView alert"
    });
  }
}
