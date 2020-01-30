export enum BalanceRetrievalEndpoints {
  findBalance = 'exchange:balance:findBalance',
  findCurrencyAvailableBalances = 'exchange:balance:findCurrencyBalances',
  findAllBalancesForAccount = 'exchange:balance:findAllBalancesForAccount',
  findRawBalances = 'exchange:balance:findRawBalances',
  retrieveTotalOrderValueReceivedByAccount = 'exchange:balance:retrieveTotalOrderValueReceivedByAccount',
  getBalanceAdjustmentsForBalanceAndTradeTransactions = 'exchange:balance:getBalanceAdjustmentsForBalanceAndTradeTransactions',
  getOrderBalanceReserveAdjustment = 'exchange:balance:getOrderBalanceReserveAdjustment',
}
