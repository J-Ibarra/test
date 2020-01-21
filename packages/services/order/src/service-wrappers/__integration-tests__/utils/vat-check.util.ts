import { expect } from 'chai'

import { sequelize, getModel } from '@abx/db-connection-utils'
import { TradeTransaction } from '@abx-types/order'

// The trade amount and CHF tax rates expected for a given order
interface TradeAmountCHFTaxAmountPair {
  tradeAmount: number
  chfTaxRate: number
}

export async function verifyVatFeeMatchesExpected({
  orderId,
  tradeAmountToExpectedCHFTaxPaid,
}: {
  orderId: number
  tradeAmountToExpectedCHFTaxPaid: TradeAmountCHFTaxAmountPair[]
}) {
  await sequelize.transaction(async t => {
    const tradeTransactionInstances = await getModel<TradeTransaction>('tradeTransaction').findAll({
      where: { orderId },
      transaction: t,
      order: [['createdAt', 'ASC']],
    })

    const amountToCHFTax = tradeAmountToExpectedCHFTaxPaid.reduce((acc, pair) => acc.set(pair.tradeAmount, pair.chfTaxRate), new Map())

    const tradeTransactions = tradeTransactionInstances.map(tradeTransactionInstance => tradeTransactionInstance.get())
    tradeTransactions.forEach(transaction => expect(transaction.taxAmountCHF).to.eql(amountToCHFTax.get(transaction.amount)))
  })
}
