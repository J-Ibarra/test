export enum ConfigEndpoints {
  isFeatureFlagEnabled = 'exchange:reference-data:config:isFeatureFlagEnabled',
  getExchangeHoldingsWallets = 'exchange:reference-data:config:getExchangeHoldingsWallets',
  getTransactionFeeCaps = 'exchange:reference-data:config:getTransactionFeeCaps',
  getExchangeDepositPollingFrequency = 'exchange:reference-data:config:getExchangeDepositPollingFrequency',
  getVatRate = 'exchange:reference-data:config:getVatRate',
  getWithdrawalConfigForCurrency = 'exchange:reference-data:config:getWithdrawalConfigForCurrency',
  getWithdrawalConfig = 'exchange:reference-data:config:getWithdrawalConfig',
  getWithdrawalLimit = 'exchange:reference-data:config:getWithdrawalLimit',
  getOperationsEmail = 'exchange:reference-data:config:getOperationsEmail',
  getEthereumDepositMaxBlockCheck = 'exchange:reference-data:config:getEthereumDepositMaxBlockCheck',
  getExcludedAccountTypesFromOrderRangeValidations = 'exchange:reference-data:config:getExcludedAccountTypesFromOrderRangeValidations',
}
