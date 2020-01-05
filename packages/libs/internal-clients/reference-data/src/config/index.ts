import { getEpicurusInstance } from '@abx/db-connection-utils'
import { ConfigEndpoints } from './endpoints'
import {
  SupportedFeatureFlags,
  CurrencyWithdrawalConfig,
  ExchangeHoldingsWallet,
  CurrencyCode,
  DepositPollingFrequency,
  WithdrawalConfig,
} from '@abx-types/reference-data'
import { AccountStatus } from '@abx-types/account'

export async function isFeatureFlagEnabled(flag: SupportedFeatureFlags): Promise<boolean> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.isFeatureFlagEnabled, { flag })
}

export async function getExchangeHoldingsWallets(): Promise<ExchangeHoldingsWallet[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getExchangeHoldingsWallets, {})
}

export async function getTransactionFeeCaps(): Promise<Record<CurrencyCode, number>> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getTransactionFeeCaps, {})
}

export async function getExchangeDepositPollingFrequency(): Promise<DepositPollingFrequency[]> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getExchangeDepositPollingFrequency, {})
}

export async function getVatRate(): Promise<number> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getVatRate, {})
}

export async function getWithdrawalConfigForCurrency({ currencyCode }: { currencyCode: CurrencyCode }): Promise<CurrencyWithdrawalConfig> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getWithdrawalConfigForCurrency, { currencyCode })
}

export async function getWithdrawalConfig(): Promise<WithdrawalConfig> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getWithdrawalConfig, {})
}

export async function getWithdrawalLimit(accountStatus: AccountStatus) {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getWithdrawalLimit, { accountStatus })
}

export async function getOperationsEmail(): Promise<string> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getOperationsEmail, {})
}

export async function getEthereumDepositMaxBlockCheck(): Promise<number> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getEthereumDepositMaxBlockCheck, {})
}

export async function getExcludedAccountTypesFromOrderRangeValidations(): Promise<number> {
  const epicurus = getEpicurusInstance()
  return epicurus.request(ConfigEndpoints.getExcludedAccountTypesFromOrderRangeValidations, {})
}
