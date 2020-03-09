import { ConfigEndpoints } from './endpoints'
import {
  SupportedFeatureFlags,
  CurrencyWithdrawalConfig,
  ExchangeHoldingsWallet,
  CurrencyCode,
  DepositPollingFrequency,
  WithdrawalConfig,
} from '@abx-types/reference-data'
import { AccountStatus, AccountType } from '@abx-types/account'
import { InternalApiRequestDispatcher } from '@abx-utils/internal-api-tools'
import { REFERENCE_DATA_REST_API_PORT } from '../boundaries'

const internalApiRequestDispatcher = new InternalApiRequestDispatcher(REFERENCE_DATA_REST_API_PORT)

export async function isFeatureFlagEnabled(flag: SupportedFeatureFlags): Promise<boolean> {
  const result = await internalApiRequestDispatcher.fireRequestToInternalApi<{ enabled: boolean }>(ConfigEndpoints.isFeatureFlagEnabled, { flag })
  return result.enabled
}

export async function getExchangeHoldingsWallets(): Promise<ExchangeHoldingsWallet[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<ExchangeHoldingsWallet[]>(ConfigEndpoints.getExchangeHoldingsWallets)
}

export async function getTransactionFeeCaps(): Promise<Record<CurrencyCode, number>> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<Record<CurrencyCode, number>>(ConfigEndpoints.getTransactionFeeCaps)
}

export async function getExchangeDepositPollingFrequency(): Promise<DepositPollingFrequency[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<DepositPollingFrequency[]>(ConfigEndpoints.getExchangeDepositPollingFrequency)
}

export async function getVatRate(): Promise<number> {
  const { vatRate } = await internalApiRequestDispatcher.fireRequestToInternalApi<{ vatRate: number }>(ConfigEndpoints.getVatRate)
  return vatRate
}

export async function getWithdrawalConfigForCurrency({ currencyCode }: { currencyCode: CurrencyCode }): Promise<CurrencyWithdrawalConfig> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<CurrencyWithdrawalConfig>(ConfigEndpoints.getWithdrawalConfigForCurrency, {
    currencyCode,
  })
}

export async function getWithdrawalConfig(): Promise<WithdrawalConfig> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<WithdrawalConfig>(ConfigEndpoints.getWithdrawalConfig)
}

export async function getWithdrawalLimit(accountStatus: AccountStatus) {
  const { limit } = await internalApiRequestDispatcher.fireRequestToInternalApi<{ limit: number }>(ConfigEndpoints.getWithdrawalLimit, {
    accountStatus,
  })

  return limit
}

export async function getOperationsEmail(): Promise<string> {
  const { email } = await internalApiRequestDispatcher.fireRequestToInternalApi<{ email: string }>(ConfigEndpoints.getOperationsEmail)
  return email
}

export async function getEthereumDepositMaxBlockCheck(): Promise<number> {
  const { blocks } = await internalApiRequestDispatcher.fireRequestToInternalApi<{ blocks: number }>(ConfigEndpoints.getEthereumDepositMaxBlockCheck)
  return blocks
}

export async function getExcludedAccountTypesFromOrderRangeValidations(): Promise<AccountType[]> {
  return internalApiRequestDispatcher.fireRequestToInternalApi<AccountType[]>(ConfigEndpoints.getExcludedAccountTypesFromOrderRangeValidations)
}

export * from './endpoints'
