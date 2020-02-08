import Decimal from 'decimal.js'
import { Transaction, WhereOptions } from 'sequelize'
import { getSymbolBoundaries } from '@abx-service-clients/reference-data'
import { DBOrder, getModel, wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'
import { DepthItem } from '@abx-types/depth-cache'
import { DepthMidPrice, MidPricesForSymbolRequest, MidPricesForSymbolsRequest } from '@abx-types/market-data'
import { reduceSymbolsToMappedObject } from '../utils/helpers'
import { MidPriceRepository } from './mid_price_repository'
import { calculateMidPrice } from '@abx-service-clients/market-data'

/** Defines a {@link MidPriceRepository} using a relation database as its data source. */
export class DatabaseMidPriceRepository implements MidPriceRepository {
  /** Creates and returns a {@link DatabaseMidPriceRepository} instance, if one already created returns that. */
  public static getInstance(): DatabaseMidPriceRepository {
    if (!this.instance) {
      this.instance = new DatabaseMidPriceRepository()
    }

    return this.instance
  }

  private static instance: DatabaseMidPriceRepository

  public recordDepthMidPriceChange(symbolId: string, buyDepthTopOrder: DepthItem, sellDepthTopOrder: DepthItem, t?: Transaction) {
    return wrapInTransaction(sequelize, t, async transaction => {
      const symbolBoundaries = await getSymbolBoundaries(symbolId)
      const price = calculateMidPrice({
        symbolId,
        buy: [buyDepthTopOrder],
        sell: [sellDepthTopOrder],
      })
      const truncatedPrice = new Decimal(price).toDP(symbolBoundaries.quoteBoundary.maxDecimals, Decimal.ROUND_DOWN).toNumber()
      return await getModel<DepthMidPrice>('depth_mid_price')
        .create(
          {
            symbolId,
            price: truncatedPrice,
            createdAt: new Date(),
          },
          {
            transaction,
          },
        )
        .then(midPrice => midPrice.get())
    })
  }

  public getMidPricesForSymbol({ symbolId, from, transaction, limit, createdAtOrder }: MidPricesForSymbolRequest): Promise<DepthMidPrice[]> {
    return wrapInTransaction(sequelize, transaction, async t => {
      return this.getDepthMidPrices({
        where: {
          symbolId,
          createdAt: { $gte: from },
        },
        limit,
        createdAtOrder,
        t,
      })
    })
  }

  public getMidPricesForSymbols({
    symbolIds,
    from,
    transaction,
    limit,
    createdAtOrder,
  }: MidPricesForSymbolsRequest): Promise<Map<string, DepthMidPrice[]>> {
    return wrapInTransaction(sequelize, transaction, async t => {
      const midPrices = await this.getDepthMidPrices({
        where: {
          symbolId: {
            $in: symbolIds,
          },
          createdAt: {
            $gte: from,
          },
        },
        limit,
        createdAtOrder,
        t,
      })
      return reduceSymbolsToMappedObject(midPrices)
    })
  }

  private async getDepthMidPrices({
    where,
    limit = Number.MAX_SAFE_INTEGER,
    createdAtOrder = DBOrder.ASC,
    t,
  }: {
    where: WhereOptions
    limit?: number
    createdAtOrder?: DBOrder
    t?: Transaction
  }): Promise<DepthMidPrice[]> {
    const midPriceInstances = await getModel<DepthMidPrice>('depth_mid_price').findAll({
      where,
      order: [['id', createdAtOrder]],
      limit,
      transaction: t,
    })

    return midPriceInstances.map(price => price.get())
  }
}
