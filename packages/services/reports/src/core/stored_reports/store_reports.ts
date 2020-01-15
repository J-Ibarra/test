import { FindOptions, Transaction } from 'sequelize'
import { wrapInTransaction, getModel, sequelize } from '@abx/db-connection-utils'
import { StoredReport } from '@abx-service-clients/report'

export async function storeReport({ accountId, reportType, s3Key }: StoredReport, transaction?: Transaction): Promise<StoredReport> {
  return wrapInTransaction(sequelize, transaction, async t => {
    const storedReportInstance = await getModel<StoredReport>('storedReport').create({ accountId, reportType, s3Key }, { transaction: t })

    return storedReportInstance.get()
  })
}

export async function findStoredReports(query: FindOptions): Promise<StoredReport[]> {
  const storedReports = await getModel<StoredReport>('storedReport').findAll(query)
  return storedReports.map(storedReport => storedReport.get())
}
