import { FindOptions, Transaction } from 'sequelize'
import sequelize, { getModel } from '../../../db/abx_modules'
import { wrapInTransaction } from '../../../db/transaction_wrapper'
import { StoredReport } from '../../interfaces'

export async function storeReport({
  accountId,
  reportType,
  s3Key
}: StoredReport,
  transaction?: Transaction
): Promise<StoredReport> {
  return wrapInTransaction(sequelize, transaction, async (t) => {
    const storedReportInstance = await getModel<StoredReport>('storedReport').create(
      { accountId, reportType, s3Key },
      { transaction: t }
    )

    return storedReportInstance.get()
  })
}

export async function findStoredReports(query: FindOptions): Promise<StoredReport[]> {
  const storedReports = await getModel<StoredReport>('storedReport').findAll(query)
  return storedReports.map(storedReport => storedReport.get())
}
