# NEXORA.COM deployment

This app is ready for a Render web service with a managed Render PostgreSQL database. It provides server-side authentication, account records, Paystack initialization, verified/idempotent Paystack webhooks, Paystack transfer-based withdrawals, and a broker order boundary.

## Deploy on Render

1. Push this directory to a private GitHub repository and create a Render Blueprint from `render.yaml` (or create a Node web service and Render Postgres separately).
2. Add every value from `.env.example` in Render **Environment**. Use real keys only in Render's encrypted environment variable UI; do not add them to Git or the frontend.
3. Configure the Paystack dashboard webhook to `https://YOUR-SERVICE.onrender.com/api/payments/paystack/webhook` and verify the secret matches `PAYSTACK_WEBHOOK_SECRET`.
4. Replace the generic request mapping in `broker.js` with the exact request/response contract of your licensed broker API, then configure its market-feed WebSocket in the same provider module.

## Important operations requirements

- Keep demo and real balances/accounts separate. Real balances are credited only by verified `charge.success` Paystack webhooks.
- On withdrawals, collect and validate bank/wallet details server-side, create a Paystack transfer recipient, and pass only the resulting recipient code to `/api/payments/withdraw`.
- Before enabling real orders, apply KYC/AML, age, jurisdiction, risk limits, audit logging, reconciliation, and all licences required in your operating countries. Have the complete flow reviewed by your broker, payment provider, and legal/compliance teams.
