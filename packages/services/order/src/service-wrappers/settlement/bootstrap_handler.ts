import { getEpicurusInstance, getModel, messageFactory } from '@abx-utils/db-connection-utils'
import { calculateRealTimeMidPriceForSymbol } from '@abx-service-clients/market-data'
import { OrderMatch, OrderMatchStatus, UsdMidPriceEnrichedOrderMatch } from '@abx-types/order'
import { CurrencyCode } from '@abx-types/reference-data'
import { getAllCompleteSymbolDetails, getAllSymbolPairSummaries } from '@abx-service-clients/reference-data'
import { SettlementEndpoints } from '@abx-service-clients/order'
import { addOrderToSettleQueue, settleOrderMatchForPair, runSettlementLogic } from './core'
import { runOrderDataMigrations } from '../../migrations/migration-runner'

export const settleOrderMatch = {
  type: 'object',
  'x-persist-event': 'settle order match',
  properties: {
    id: {
      type: 'number',
      required: true,
    },
    feeCurrencyToUsdMidPrice: {
      type: 'number',
      required: true,
    },
  },
}

interface OrderMatchFeeCurrencyMidPriceDetails {
  feeCurrency: CurrencyCode
  feeCurrencyToUsdMidPrice: number
}

export async function bootstrap() {
  await runOrderDataMigrations()
  const epicurus = getEpicurusInstance()

  epicurus.server(
    SettlementEndpoints.settleOrderMatch,
    messageFactory(settleOrderMatch, async match => addOrderToSettleQueue(match)),
  )

  const symbols = await getAllSymbolPairSummaries()
  symbols.forEach(({ id }) => setTimeout(() => settleOrderMatchForPair(id), 100))

  await addAllMatchesPendingCompletionToQueue()
}

export async function bootstrapForTesting() {
  const epicurus = getEpicurusInstance()

  epicurus.server(
    SettlementEndpoints.settleOrderMatch,
    messageFactory(settleOrderMatch, async match => {
      return runSettlementLogic(match)
    }),
  )
}

async function addAllMatchesPendingCompletionToQueue() {
  const omInstances = await getModel<OrderMatch>('orderMatchTransaction').findAll({
    where: {
      status: OrderMatchStatus.matched,
    },
  })

  const allMatchesPendingSettlement = omInstances.map(omInstance => omInstance.get())
  const symbolIdToFeeCurrencyMidPrice = await computeMidPriceForAllSymbolFeeCurrencies(allMatchesPendingSettlement.map(({ symbolId }) => symbolId))

  const feeCurrencyUsdMidPriceEnrichedMatches = allMatchesPendingSettlement.map(orderMatch =>
    enrichOrderMatchWithUsdMidPrice(orderMatch, symbolIdToFeeCurrencyMidPrice[orderMatch.symbolId]),
  )

  feeCurrencyUsdMidPriceEnrichedMatches.forEach(addOrderToSettleQueue)
}

async function computeMidPriceForAllSymbolFeeCurrencies(symbolIds: string[]): Promise<Record<string, OrderMatchFeeCurrencyMidPriceDetails>> {
  const allSymbols = await getAllCompleteSymbolDetails()
  const uniqueSymbolIds = symbolIds.reduce((symbolIdAcc, symbolId) => symbolIdAcc.add(symbolId), new Set<string>())

  const symbolFeeCurrencies = Array.from(uniqueSymbolIds).map(orderMatchSymbol => allSymbols.find(({ id }) => id === orderMatchSymbol)!.fee.code)
  const realTimeMidPrices = await Promise.all(symbolFeeCurrencies.map(feeCurrency => calculateRealTimeMidPriceForSymbol(`${feeCurrency}_USD`)))

  return Array.from(uniqueSymbolIds).reduce((symbolFeeCurrencyMidPriceData, orderMatchSymbolId, index) => {
    symbolFeeCurrencyMidPriceData[orderMatchSymbolId] = {
      feeCurrency: symbolFeeCurrencies[index],
      feeCurrencyToUsdMidPrice: realTimeMidPrices[index],
    }

    return symbolFeeCurrencyMidPriceData
  }, {})
}

function enrichOrderMatchWithUsdMidPrice(
  orderMatch: OrderMatch,
  feeCurrencyMidPrice: OrderMatchFeeCurrencyMidPriceDetails,
): UsdMidPriceEnrichedOrderMatch {
  const orderMatchSymbolQuote = orderMatch.symbolId.slice(-3)

  if (orderMatchSymbolQuote === CurrencyCode.usd) {
    return {
      ...orderMatch,
      feeCurrencyToUsdMidPrice: orderMatch.matchPrice,
    }
  }

  return {
    ...orderMatch,
    feeCurrencyToUsdMidPrice: feeCurrencyMidPrice.feeCurrencyToUsdMidPrice,
  }
}
