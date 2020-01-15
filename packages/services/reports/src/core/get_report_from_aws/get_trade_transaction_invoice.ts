import { findAccountById } from '@abx-service-clients/account'
import { Logger } from '@abx/logging'
import { ValidationError } from '@abx-types/error'
import { findTradeTransaction } from '@abx-service-clients/order'
import { TradeTransactionInvoiceUrl } from '@abx-service-clients/report'
import { generatePreSignedUrlForTradeTransactionReport } from './s3_presigned_url'

const logger = Logger.getInstance('trade transaction report', 'getTradeTransactionInvoicePreSignedUrl')

export async function getTradeTransactionInvoicePreSignedUrl(userAccountId: string, transactionId: number): Promise<TradeTransactionInvoiceUrl> {
  const { accountId: accountIdInTransaction } = await findTradeTransaction({ id: transactionId })
  logger.debug(`Fetched account id ${accountIdInTransaction} for validating permission to view report`)

  if (accountIdInTransaction !== userAccountId) {
    throw new ValidationError('You are not authorized to access the trade transaction invoice.', { status: 401 })
  }
  const account = await findAccountById(userAccountId)

  const preSignedUrl = await generatePreSignedUrlForTradeTransactionReport(transactionId, account.hin)
  logger.debug('Created presigned url')
  return preSignedUrl
}
