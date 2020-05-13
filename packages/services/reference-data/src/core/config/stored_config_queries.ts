import { AccountStatus } from '@abx-types/account'
import { CurrencyCode, MobileVersions } from '@abx-types/reference-data'
import {
  CurrencyWithdrawalConfig,
  DepositPollingFrequency,
  ExchangeHoldingsWallet,
  FeatureFlag,
  SupportedFeatureFlags,
  WithdrawalConfig,
} from '@abx-types/reference-data'
import { findExchangeConfig } from './stored_config_loader'

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const exchangeConfig = await findExchangeConfig()

  return !!exchangeConfig ? exchangeConfig.featureFlags : []
}

export async function isFeatureFlagEnabled(flag: SupportedFeatureFlags): Promise<boolean> {
  const exchangeConfig = await findExchangeConfig()
  return !!exchangeConfig ? exchangeConfig.featureFlags.some(({ name, enabled }) => name === flag && enabled) : false
}

export async function getExchangeHoldingsWallets(): Promise<ExchangeHoldingsWallet[]> {
  const exchangeConfig = await findExchangeConfig()
  return !!exchangeConfig ? exchangeConfig.exchangeHoldingsWallets : []
}

export async function getTransactionFeeCaps(): Promise<Record<CurrencyCode, number>> {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig.transactionFeeCap
}

export async function getMobileVersions(): Promise<MobileVersions> {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig.mobileVersions
}

export async function getExchangeDepositPollingFrequency(): Promise<DepositPollingFrequency[]> {
  const exchangeConfig = await findExchangeConfig()
  return !!exchangeConfig ? exchangeConfig.depositPollingFrequency : []
}

export async function getVatRate(): Promise<number> {
  const exchangeConfig = await findExchangeConfig()
  return !!exchangeConfig ? exchangeConfig.vatRate : 1
}

export async function getWithdrawalConfigForCurrency({ currencyCode }: { currencyCode: CurrencyCode }): Promise<CurrencyWithdrawalConfig> {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig && exchangeConfig.withdrawalFees[currencyCode]
}

export async function getWithdrawalConfig(): Promise<WithdrawalConfig> {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig && exchangeConfig.withdrawalFees
}

export async function getWithdrawalLimit(accountStatus: AccountStatus) {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig && exchangeConfig.withdrawalLimit[accountStatus]
}

export async function getOperationsEmail(): Promise<string> {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig && exchangeConfig.operationsEmail
}

export async function getEthereumDepositMaxBlockCheck(): Promise<number> {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig && exchangeConfig.ethereumDepositMaxBlockCheck
}

export async function getExcludedAccountTypesFromOrderRangeValidations() {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig && exchangeConfig.excludedAccountTypesFromOrderRanges
}

export async function getDepositMimimumAmounts(): Promise<Record<CurrencyCode, number>> {
  const exchangeConfig = await findExchangeConfig()
  return exchangeConfig.depositMinimumAmounts
}
