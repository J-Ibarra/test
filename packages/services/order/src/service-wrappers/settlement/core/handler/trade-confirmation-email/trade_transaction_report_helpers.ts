import Decimal from 'decimal.js'
import { Transaction } from 'sequelize'

import { currencyScale } from '@abx-types/reference-data'
import { Logger } from '@abx/logging'
import { sequelize, wrapInTransaction } from '@abx/db-connection-utils'
import { ValidationError } from '@abx-types/error'
import { TradeTransaction, OrderDirection } from '@abx-types/order'
import { TradeTransactionDataFromOrderMatch } from '@abx-service-clients/report'

const logger = Logger.getInstance('lib', 'Get Trade Transaction Data')

export function calculateTotals(value: number, tax: number) {
  return parseFloat(new Decimal(value).plus(tax).toFixed(currencyScale))
}

export async function findTradeTransactionFromOrderMatch(queryData: TradeTransactionDataFromOrderMatch) {
  const {
    orderMatchId,
    orderIds: { buyOrderId, sellOrderId },
    direction,
  } = queryData
  const query = `
    SELECT * FROM trade_transaction tt 
      WHERE "tt"."orderId" = :orderId AND "tt"."counterTradeTransactionId" = (
        SELECT "filtered_tt"."id" FROM trade_transaction filtered_tt
          WHERE "filtered_tt"."orderId" = :counterOrderId 
            AND "filtered_tt"."id" = "tt"."counterTradeTransactionId"
      );
  `

  const tradeTransactionData = await wrapInTransaction(sequelize, null, async (tran: Transaction) => {
    const [tradeTransactionResponse] = (await sequelize.query(query, {
      replacements: {
        orderId: direction === OrderDirection.buy ? buyOrderId : sellOrderId,
        counterOrderId: direction === OrderDirection.buy ? sellOrderId : buyOrderId,
      },
      raw: true,
      type: sequelize.QueryTypes.SELECT,
      transaction: tran,
    })) as TradeTransaction[]

    if (!(tradeTransactionResponse && tradeTransactionResponse.fee)) {
      throw new ValidationError('Error while processing trade transaction data')
    }

    const { id: tradeTransactionId, fee, feeCurrencyId } = tradeTransactionResponse

    return {
      tradeTransactionId,
      fee: Number(fee),
      feeCurrencyId,
    }
  })

  logger.debug(
    `Queried trade transaction data for ordermatch id of ${orderMatchId}, direction of ${direction} and order id of ${
      direction === OrderDirection.buy ? buyOrderId : sellOrderId
    }`,
  )
  return tradeTransactionData
}
