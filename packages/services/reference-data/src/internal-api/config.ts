import { getEpicurusInstance, messageFactory } from '@abx-utils/db-connection-utils'
import { ConfigEndpoints } from '@abx-service-clients/reference-data'
import {
  isFeatureFlagEnabledSchema,
  getExchangeHoldingsWalletsSchema,
  getTransactionFeeCapsSchema,
  getExchangeDepositPollingFrequencySchema,
  getVatRateSchema,
  getWithdrawalConfigForCurrencySchema,
  getWithdrawalConfigSchema,
  getWithdrawalLimitSchema,
  getOperationsEmailSchema,
  getEthereumDepositMaxBlockCheckSchema,
  getExcludedAccountTypesFromOrderRangeValidationsSchema,
} from './schemas'
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

export function boot() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    ConfigEndpoints.isFeatureFlagEnabled,
    messageFactory(isFeatureFlagEnabledSchema, ({ flag }) => isFeatureFlagEnabled(flag)),
  )

  epicurus.server(
    ConfigEndpoints.getExchangeHoldingsWallets,
    messageFactory(getExchangeHoldingsWalletsSchema, () => getExchangeHoldingsWallets()),
  )

  epicurus.server(
    ConfigEndpoints.getTransactionFeeCaps,
    messageFactory(getTransactionFeeCapsSchema, () => getTransactionFeeCaps()),
  )

  epicurus.server(
    ConfigEndpoints.getExchangeDepositPollingFrequency,
    messageFactory(getExchangeDepositPollingFrequencySchema, () => getExchangeDepositPollingFrequency()),
  )

  epicurus.server(
    ConfigEndpoints.getVatRate,
    messageFactory(getVatRateSchema, () => getVatRate()),
  )

  epicurus.server(
    ConfigEndpoints.getWithdrawalConfigForCurrency,
    messageFactory(getWithdrawalConfigForCurrencySchema, ({ currencyCode }) => getWithdrawalConfigForCurrency(currencyCode)),
  )

  epicurus.server(
    ConfigEndpoints.getWithdrawalConfig,
    messageFactory(getWithdrawalConfigSchema, () => getWithdrawalConfig()),
  )

  epicurus.server(
    ConfigEndpoints.getWithdrawalLimit,
    messageFactory(getWithdrawalLimitSchema, ({ accountStatus }) => getWithdrawalLimit(accountStatus)),
  )

  epicurus.server(
    ConfigEndpoints.getOperationsEmail,
    messageFactory(getOperationsEmailSchema, () => getOperationsEmail()),
  )

  epicurus.server(
    ConfigEndpoints.getEthereumDepositMaxBlockCheck,
    messageFactory(getEthereumDepositMaxBlockCheckSchema, () => getEthereumDepositMaxBlockCheck()),
  )

  epicurus.server(
    ConfigEndpoints.getExcludedAccountTypesFromOrderRangeValidations,
    messageFactory(getExcludedAccountTypesFromOrderRangeValidationsSchema, () => getExcludedAccountTypesFromOrderRangeValidations()),
  )
}
