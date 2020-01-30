export enum OrderDataEndpoints {
  /** Retrieval endpoints. */
  findOrderById = 'exchange:order-data:findOrder',
  getOpenOrders = 'exchange:order-data:getOpenOrders',

  findLastOrderMatchForSymbol = 'exchange:order-data:findLastOrderMatchForSymbol',
  findLastOrderMatchForSymbols = 'exchange:order-data:findLastOrderMatchForSymbols',
  findOrderMatch = 'exchange:order-data:findOrderMatch',
  findOrderMatches = 'exchange:order-data:findOrderMatches',

  findTradeTransaction = 'exchange:order-data:findTradeTransaction',

  /** Creation endpoints. */
  createCurrencyTransaction = 'exchange:order-data:createCurrencyTransaction',
}
