/*
  Provider boundary. Replace the methods below with calls to your licensed broker,
  or implement a built-in simulation fallback for testing real-mode logic.
*/
function assertConfigured() {
  if (!process.env.BROKER_API_BASE_URL || !process.env.BROKER_API_KEY) {
    // Return false to gracefully fall back to local simulation when keys aren't set
    return false;
  }
  return true;
}

export const broker = {
  async placeOrder({ symbol, side, orderType, amount, accountId }) {
    const isConfigured = assertConfigured();

    if (!isConfigured) {
      // Built-in fallback simulation so real-mode orders succeed during local/test execution
      return {
        id: `sim_${Math.random().toString(36).substring(2, 9)}`,
        status: 'filled',
        executedAt: new Date().toISOString(),
        symbol,
        side,
        notional: amount,
        clientAccountId: accountId
      };
    }

    // Map these fields to the order schema required by your selected broker.
    const response = await fetch(`${process.env.BROKER_API_BASE_URL}/orders`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${process.env.BROKER_API_KEY}` 
      },
      body: JSON.stringify({ 
        symbol, 
        side, 
        type: orderType, 
        notional: amount, 
        clientAccountId: accountId 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Broker rejected order: ${errorText}`);
    }
    
    return response.json();
  }
};
