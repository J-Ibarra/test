export enum BalanceRetrievalEndpoints {
  findBalance = 'exchange:balance:findBalance',
  findCurrencyBalances = 'exchange:balance:findCurrencyBalances',
  findAllBalancesForAccount = 'exchange:balance:findAllBalancesForAccount',
  findRawBalances = 'exchange:balance:findRawBalances',
  retrieveTotalOrderValueReceivedByAccount = 'exchange:balance:retrieveTotalOrderValueReceivedByAccount',
  getBalanceAdjustmentForBalanceAndOrder = 'exchange:balance:getBalanceAdjustmentForBalanceAndOrder',
  getBalanceAdjustmentsForBalanceAndTradeTransactions = 'exchange:balance:getBalanceAdjustmentsForBalanceAndTradeTransactions',
  getOrderBalanceReserveAdjustment = 'exchange:balance:getOrderBalanceReserveAdjustment',
}
