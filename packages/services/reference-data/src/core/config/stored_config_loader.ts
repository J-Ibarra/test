import moment from 'moment'
import { Environment, ExchangeConfigValue, IExchangeConfigEntry, localAndTestEnvironments } from '@abx-types/reference-data'
import { sequelize, getModel, wrapInTransaction } from '@abx-utils/db-connection-utils'

interface ConfigInMemoryCache {
  lastRefresh: Date
  exchangeConfig: ExchangeConfigValue | null
}

let config: ConfigInMemoryCache = {
  lastRefresh: new Date(),
  exchangeConfig: null,
}

const shouldInvalidateCache = (): boolean =>
  localAndTestEnvironments.includes(process.env.NODE_ENV as Environment) || moment(config.lastRefresh).isBefore(moment().subtract(30, 'seconds'))

/**
 * Uses an in-memory {@code config} cache of the {@link ExchangeConfigValue}.
 * The cache is invalidated every 30 minutes.
 */
export async function findExchangeConfig(): Promise<ExchangeConfigValue> {
  if (!config.exchangeConfig || shouldInvalidateCache()) {
    const exchangeConfigInstances = await getModel<IExchangeConfigEntry>('exchangeConfig').findAll()
    const exchangeConfigEntries = exchangeConfigInstances.map((exchangeConfigInstance) => exchangeConfigInstance.get())
    let configAccumulator = {}

    exchangeConfigEntries.forEach((exchangeConfigEntry) => {
      configAccumulator = {
        ...configAccumulator,
        ...exchangeConfigEntry.value,
      }
    })

    config = {
      lastRefresh: new Date(),
      exchangeConfig: configAccumulator as ExchangeConfigValue,
    }
  }

  return config.exchangeConfig!
}

export function updateOrCreateExchangeConfig(value: { [P in keyof ExchangeConfigValue]?: ExchangeConfigValue[P] }): Promise<void> {
  const updatedExchangeConfig = {
    ...config.exchangeConfig,
    ...value,
  }

  config = {
    ...config,
    exchangeConfig: updatedExchangeConfig as any,
  }

  return wrapInTransaction(sequelize, null, async (transaction) => {
    await sequelize.query('delete from exchange_config')

    const updatedExchangeConfigEntries = Object.keys(updatedExchangeConfig).map((exchangeConfigKey) => ({
      value: { [exchangeConfigKey]: updatedExchangeConfig[exchangeConfigKey] },
    }))

    await getModel<IExchangeConfigEntry>('exchangeConfig').bulkCreate(updatedExchangeConfigEntries, { transaction })
  })
}
