import { ConfigEndpoints } from '@abx-service-clients/reference-data'
import {
  isFeatureFlagEnabled,
  getExchangeHoldingsWallets,
  getTransactionFeeCaps,
  getExchangeDepositPollingFrequency,
  getVatRate,
  getWithdrawalConfigForCurrency,
  getWithdrawalConfig,
  getWithdrawalLimit,
  getOperationsEmail,
  getEthereumDepositMaxBlockCheck,
  getExcludedAccountTypesFromOrderRangeValidations,
} from '../core'
import { InternalRoute } from '@abx-utils/internal-api-tools'

export function createConfigEndpointHandlers(): InternalRoute<any, any>[] {
  return [
    {
      path: ConfigEndpoints.isFeatureFlagEnabled,
      handler: async ({ flag }) => {
        const enabled = await isFeatureFlagEnabled(flag)

        return { enabled }
      },
    },
    {
      path: ConfigEndpoints.getExchangeHoldingsWallets,
      handler: () => getExchangeHoldingsWallets(),
    },
    {
      path: ConfigEndpoints.getTransactionFeeCaps,
      handler: () => getTransactionFeeCaps(),
    },
    {
      path: ConfigEndpoints.getExchangeDepositPollingFrequency,
      handler: () => getExchangeDepositPollingFrequency(),
    },
    {
      path: ConfigEndpoints.getVatRate,
      handler: async () => {
        const vatRate = await getVatRate()

        return { vatRate }
      },
    },
    {
      path: ConfigEndpoints.getWithdrawalConfigForCurrency,
      handler: ({ currencyCode }) => getWithdrawalConfigForCurrency(currencyCode),
    },
    {
      path: ConfigEndpoints.getWithdrawalConfig,
      handler: () => getWithdrawalConfig(),
    },
    {
      path: ConfigEndpoints.getWithdrawalLimit,
      handler: async ({ accountStatus }) => {
        const limit = await getWithdrawalLimit(accountStatus)

        return { limit }
      },
    },
    {
      path: ConfigEndpoints.getOperationsEmail,
      handler: async () => {
        const email = await getOperationsEmail()

        return { email }
      },
    },
    {
      path: ConfigEndpoints.getEthereumDepositMaxBlockCheck,
      handler: async () => {
        const blocks = await getEthereumDepositMaxBlockCheck()

        return { blocks }
      },
    },
    {
      path: ConfigEndpoints.getExcludedAccountTypesFromOrderRangeValidations,
      handler: () => getExcludedAccountTypesFromOrderRangeValidations(),
    },
  ]
}
