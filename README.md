# TradingView LINE Alert Bot

Vercel serverless webhook for receiving TradingView alerts and forwarding them to LINE with the Messaging API.

## 1. Environment Variables

Set these in Vercel Project Settings > Environment Variables:

```text
LINE_CHANNEL_ACCESS_TOKEN=your LINE Messaging API channel access token
LINE_USER_ID=your LINE user ID
ALERT_WEBHOOK_SECRET=a long random secret used only by TradingView alerts
```

Do not commit real tokens to the repository.

## 2. Deploy to Vercel

```bash
npm install
npx vercel
```

After deployment, your TradingView webhook URL will be:

```text
https://your-project.vercel.app/api/tradingview
```

## 3. TradingView Alert Message

Option A: use the sample Pine Script in `tradingview/vwap-ema-line-alert.pine`.

After adding it to a BTC 15M chart:

1. Set the script input `Webhook secret` to the same value as `ALERT_WEBHOOK_SECRET`.
2. Create an alert from the script.
3. Choose `Any alert() function call`.
4. Set the alert trigger to `Once Per Bar Close`.
5. Add the Vercel webhook URL.

Option B: use this JSON as a manual alert message.

```json
{
  "secret": "same value as ALERT_WEBHOOK_SECRET",
  "symbol": "{{ticker}}",
  "price": "{{close}}",
  "time": "{{time}}",
  "timeframe": "15M",
  "side": "LONG",
  "setup": "VWAP Bounce EMA Stack",
  "bias": "1H Bullish",
  "entry": "{{close}}",
  "sl": "",
  "tp": "",
  "rr": ">= 1:1.5",
  "reasons": [
    "1H bias confirmed",
    "EMA9/EMA21 aligned",
    "VWAP or EMA21 retest",
    "15M candle closed confirmation",
    "Rejection candle confirmed"
  ]
}
```

For short alerts, change `side` and `bias`.

## 4. Local Test

Run locally:

```bash
npm install
npx vercel dev
```

Then send a test request:

```bash
curl -X POST http://localhost:3000/api/tradingview \
  -H "Content-Type: application/json" \
  -d '{"secret":"your secret","symbol":"BTCUSDT","side":"LONG","price":"61250","bias":"1H Bullish"}'
```
