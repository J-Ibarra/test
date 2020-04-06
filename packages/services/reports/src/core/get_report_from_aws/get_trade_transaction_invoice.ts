import { findAccountById } from '@abx-service-clients/account'
import { Logger } from '@abx-utils/logging'
import { ValidationError } from '@abx-types/error'
import { findTradeTransaction, generateTradeTransactionReportData } from '@abx-service-clients/order'
import { TradeTransactionInvoiceUrl, ReportType } from '@abx-service-clients/report'
import { generatePreSignedUrlForTradeTransactionReport } from './s3_presigned_url'
import { createReportAndUploadToS3 } from '../generate_report'

const logger = Logger.getInstance('trade transaction report', 'getTradeTransactionInvoicePreSignedUrl')

export async function getTradeTransactionInvoicePreSignedUrl(userAccountId: string, transactionId: number): Promise<TradeTransactionInvoiceUrl> {
  const { accountId: accountIdInTransaction } = await findTradeTransaction(transactionId)
  logger.debug(`Fetched account id ${accountIdInTransaction} for validating permission to view report`)

  if (accountIdInTransaction !== userAccountId) {
    throw new ValidationError('You are not authorized to access the trade transaction invoice.', { status: 401 })
  }
  const account = await findAccountById(userAccountId)

  const preSignedUrl = await generatePreSignedUrlForTradeTransactionReport(transactionId, account.hin!)

  if (!preSignedUrl.url) {
    logger.debug(`Unable to create presigned URL as resource not found, generating new transaction pdf for ${transactionId}`)
    const transactionData = await generateTradeTransactionReportData(transactionId)
    await createReportAndUploadToS3({ reportType: ReportType.tradeTransaction, data: transactionData })

    return generatePreSignedUrlForTradeTransactionReport(transactionId, account.hin!)
  } else {
    logger.debug('Created presigned url')
  }

  return preSignedUrl
}
