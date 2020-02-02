export enum BalanceRetrievalEndpoints {
  findBalance = 'balance/findBalance',
  findCurrencyAvailableBalances = 'balance/findCurrencyBalances',
  findAllBalancesForAccount = 'balance/findAllBalancesForAccount',
  findRawBalances = 'balance/findRawBalances',
  retrieveTotalOrderValueReceivedByAccount = 'balance/retrieveTotalOrderValueReceivedByAccount',
  getBalanceAdjustmentsForBalanceAndTradeTransactions = 'balance/getBalanceAdjustmentsForBalanceAndTradeTransactions',
  getOrderBalanceReserveAdjustment = 'balance/getOrderBalanceReserveAdjustment',
}
