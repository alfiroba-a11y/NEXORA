/*
  Provider boundary. Replace the methods below with calls to your licensed broker.
  Browser clients never receive these credentials; all order handling stays server-side.
*/
function assertConfigured() {
  if (!process.env.BROKER_API_BASE_URL || !process.env.BROKER_API_KEY) {
    const error = new Error('Broker integration is not configured. Add BROKER_API_BASE_URL and credentials in Render.');
    error.status = 503; throw error;
  }
}

export const broker = {
  async placeOrder({ symbol, side, orderType, amount, accountId }) {
    assertConfigured();
    // Map these fields to the order schema required by your selected broker.
    const response = await fetch(`${process.env.BROKER_API_BASE_URL}/orders`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.BROKER_API_KEY}` },
      body: JSON.stringify({ symbol, side, type: orderType, notional: amount, clientAccountId: accountId })
    });
    if (!response.ok) throw new Error(`Broker rejected order: ${await response.text()}`);
    return response.json();
  }
};
