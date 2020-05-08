import { findExchangeConfig } from './stored_config_loader'
import { SupportedFeatureFlags, IExchangeConfigEntry, CurrencyCode, WithdrawalConfig } from '@abx-types/reference-data'
import { getModel } from '@abx-utils/db-connection-utils'

export async function changeFeatureFlagEnabledStatus(flag: SupportedFeatureFlags, enabled: boolean): Promise<void> {
  const exchangeConfig = await findExchangeConfig()
  exchangeConfig.featureFlags = exchangeConfig.featureFlags.map((featureFlag) => (featureFlag.name === flag ? { name, enabled } : featureFlag))

  const exchangeConfigInstances = await getModel<IExchangeConfigEntry>('exchangeConfig').findAll()
  const exchangeConfigEntries = exchangeConfigInstances.map((exchangeConfigInstance) => exchangeConfigInstance.get())

  const featureFlagsConfigEntry = exchangeConfigEntries.find(({ value }) => !!value.featureFlags)
  await getModel<IExchangeConfigEntry>('exchangeConfig').update(
    {
      id: featureFlagsConfigEntry!.id,
      value: { featureFlags: exchangeConfig.featureFlags },
    },
    { where: { id: featureFlagsConfigEntry!.id! } },
  )
}

export async function updateWithdrawalConfigForCurrency(currency: CurrencyCode, config: Partial<WithdrawalConfig>): Promise<void> {
  const exchangeConfig = await findExchangeConfig()

  const currentWithdrawalConfigForCurrency = exchangeConfig.withdrawalFees[currency]
  exchangeConfig.withdrawalFees[currency] = { ...currentWithdrawalConfigForCurrency, ...config }

  const exchangeConfigInstances = await getModel<IExchangeConfigEntry>('exchangeConfig').findAll()
  const exchangeConfigEntries = exchangeConfigInstances.map((exchangeConfigInstance) => exchangeConfigInstance.get())

  const withdrawalFeesConfigEntry = exchangeConfigEntries.find(({ value }) => !!value.withdrawalFees)
  await getModel<IExchangeConfigEntry>('exchangeConfig').update(
    {
      id: withdrawalFeesConfigEntry!.id,
      value: { withdrawalFees: { ...withdrawalFeesConfigEntry!.value.withdrawalFees!, [currency]: exchangeConfig.withdrawalFees[currency] } },
    },
    { where: { id: withdrawalFeesConfigEntry!.id! } },
  )
}
