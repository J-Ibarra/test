export enum OrderDataEndpoints {
  /** Retrieval endpoints. */
  findOrderById = 'exchange:order-data:findOrder',
  getOpenOrders = 'exchange:order-data:getOpenOrders',

  findLastOrderMatchForSymbol = 'exchange:order-data:findLastOrderMatchForSymbol',
  findLastOrderMatchForSymbols = 'exchange:order-data:findLastOrderMatchForSymbols',
  findOrderMatch = 'exchange:order:findOrderMatch',
  findOrderMatches = 'exchange:order:findOrderMatches',

  findTradeTransaction = 'exchange:order:findTradeTransaction',
  findTradeTransactions = 'exchange:order:findTradeTransactions',

  /** Creation endpoints. */
  createCurrencyTransaction = 'exchange:order:createCurrencyTransaction',
}
