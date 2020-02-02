export enum OrderDataEndpoints {
  /** Retrieval endpoints. */
  findOrderById = 'orders/findOrder',
  getOpenOrders = 'orders/getOpenOrders',

  findLastOrderMatchForSymbol = 'orders/findLastOrderMatchForSymbol',
  findLastOrderMatchForSymbols = 'orders/findLastOrderMatchForSymbols',
  findOrderMatch = 'orders/findOrderMatch',
  findOrderMatches = 'orders/findOrderMatches',

  findTradeTransaction = 'orders/findTradeTransaction',

  /** Creation endpoints. */
  createCurrencyTransaction = 'orders/createCurrencyTransaction',
}
