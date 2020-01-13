import { Logger } from '../../../config/logging'
import { ReportType, S3SignedUrlParams, TradeTransactionInvoiceUrl } from '../../interfaces'
import { createSignedUrl } from '../generate_report/shared/s3_helpers'
const logger = Logger.getInstance('reports', 's3_presigned_url')

export async function generatePreSignedUrlForTradeTransactionReport(transactionId: number, accountHin: string): Promise<TradeTransactionInvoiceUrl> {
  const params: S3SignedUrlParams = {
    Bucket: `kbe-${ReportType.tradeTransaction}`,
    Key: `${process.env.NODE_ENV}/${ReportType.tradeTransaction}_${accountHin}_${transactionId}.pdf`,
    Expires: 60,
  }

  return createSignedUrl(params)
    .then((url) => ({ url }))
    .catch((e) => {
      logger.error(`error with signed url: ${e}`)
      return { url: '' }
    })
}

