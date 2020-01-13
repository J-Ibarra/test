import {findAccountById} from '../../../accounts'
import { Logger } from '../../../config/logging'
import sequelize from '../../../db/abx_modules'
import { wrapInTransaction } from '../../../db/transaction_wrapper'
import { ValidationError } from '../../../errors'
import { findTradeTransaction } from '../../../transactions'
import { TradeTransactionInvoiceUrl } from '../../interfaces'
import { generatePreSignedUrlForTradeTransactionReport } from './s3_presigned_url'

const logger = Logger.getInstance('trade transaction report', 'getTradeTransactionInvoicePreSignedUrl')

export async function getTradeTransactionInvoicePreSignedUrl(userAccountId: string, transactionId: number): Promise<TradeTransactionInvoiceUrl> {
  const { accountId: accountIdInTransaction } = await wrapInTransaction(sequelize, null, async (t) => {
    const tradeTransaction = await findTradeTransaction({
      where: {
        id: transactionId
      },
      transaction: t,
    })

    return tradeTransaction
  })
  logger.debug(`Fetched account id ${accountIdInTransaction} for validating permission to view report`)

  if (accountIdInTransaction !== userAccountId) {
    throw new ValidationError(
      'You are not authorized to access the trade transaction invoice.',
      { status: 401 }
    )
  }
  const account = await findAccountById(userAccountId)

  const preSignedUrl = await generatePreSignedUrlForTradeTransactionReport(transactionId, account.hin)
  logger.debug('Created presigned url')
  return preSignedUrl
}
